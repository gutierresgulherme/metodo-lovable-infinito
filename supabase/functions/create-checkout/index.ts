import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  plan: string;
  price: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, price }: CheckoutRequest = await req.json();
    
    console.log('Creating checkout for:', { plan, price });

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
    }

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
        success: 'https://lovable-unlimited-deal.lovable.app/pending',
        failure: 'https://lovable-unlimited-deal.lovable.app',
        pending: 'https://lovable-unlimited-deal.lovable.app/pending',
      },
      auto_return: 'approved',
      notification_url: 'https://rwlztrsvqixonvvdnmrw.supabase.co/functions/v1/mp-webhook',
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

    return new Response(
      JSON.stringify({ 
        checkout_url: data.init_point,
        preference_id: data.id 
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
