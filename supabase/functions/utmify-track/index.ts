import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('[UTMIFY] 📊 Enviando evento:', payload);

    const utmifyToken = Deno.env.get('UTMIFY_API_KEY');
    
    if (!utmifyToken) {
      console.error('[UTMIFY] ❌ Token não configurado');
      throw new Error('UTMIFY_API_KEY not configured');
    }

    // Enviar evento para a API da UTMify
    const utmifyResponse = await fetch('https://api.utmify.com.br/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${utmifyToken}`,
      },
      body: JSON.stringify({
        pixel_id: "69103176888cf7912654f1a5",
        event_name: payload.event || 'purchase',
        event_data: {
          order_id: payload.orderId,
          payment_id: payload.paymentId,
          preference_id: payload.prefId,
          value: payload.value,
          currency: payload.currency || 'BRL',
          ...payload.utms,
        },
        timestamp: payload.timestamp || Date.now(),
      }),
    });

    const utmifyResult = await utmifyResponse.text();
    console.log('[UTMIFY] ✅ Resposta da API:', utmifyResult);

    if (!utmifyResponse.ok) {
      console.error('[UTMIFY] ❌ Erro na API:', utmifyResponse.status, utmifyResult);
      throw new Error(`UTMify API error: ${utmifyResponse.status}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Event sent to UTMify successfully',
        response: utmifyResult,
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
    console.error('[UTMIFY] ❌ Erro ao enviar evento:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to send event to UTMify'
      }),
      {
        status: 200, // Retorna 200 para não quebrar o fluxo
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
