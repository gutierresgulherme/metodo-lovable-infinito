import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CheckoutSchema = z.object({
  plan: z.string().min(1).max(200),
  price: z.number().positive().max(10000),
  utms: z.record(z.string()).optional(),
});

interface CheckoutRequest {
  plan: string;
  price: number;
  utms?: Record<string, string>;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validationResult = CheckoutSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error('Invalid checkout request:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid input data' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const { plan, price, utms = {} } = validationResult.data;
    
    console.log('Creating checkout for plan:', plan);

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    const baseUrl = Deno.env.get('PUBLIC_BASE_URL') || 'https://lovable-unlimited-deal-92478.lovable.app';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zshzrnkhxqksfaphfqyi.supabase.co';
    
    if (!accessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
    }

    // Criar URLs com UTMs
    const successUrl = new URL('/thank-you', baseUrl);
    const pendingUrl = new URL('/pending', baseUrl);
    const failureUrl = new URL('/', baseUrl);

    // Adicionar UTMs às URLs
    Object.entries(utms).forEach(([key, value]) => {
      if (value) {
        successUrl.searchParams.set(key, value);
        pendingUrl.searchParams.set(key, value);
        failureUrl.searchParams.set(key, value);
      }
    });

    const orderId = `ORD-${Date.now()}`;

    const preference = {
      items: [
        {
          title: plan,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(price),
        },
      ],
      back_urls: {
        success: successUrl.toString(),
        failure: failureUrl.toString(),
        pending: pendingUrl.toString(),
      },
      auto_return: 'approved',
      external_reference: orderId,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      metadata: {
        utms: JSON.stringify(utms),
        order_id: orderId,
      },
      tracks: [
        {
          type: "facebook_ad",
          values: {
            pixel_id: "1535934207721343"
          }
        }
      ],
    };

    console.log('Sending preference to Mercado Pago:', preference);

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mercado Pago API error:', errorText);
      throw new Error(`Mercado Pago API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Checkout created successfully:', data.id);

    // Adicionar UTMs ao init_point
    const initPointUrl = new URL(data.init_point);
    Object.entries(utms).forEach(([key, value]) => {
      if (value) {
        initPointUrl.searchParams.set(key, value);
      }
    });

    return new Response(
      JSON.stringify({ 
        checkout_url: initPointUrl.toString(),
        preference_id: data.id,
        order_id: orderId,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in create-checkout function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create checkout'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
});