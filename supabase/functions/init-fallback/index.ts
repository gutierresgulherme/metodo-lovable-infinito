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
    console.log('[UTMIFY] 📊 initiateCheckout (fallback):', payload);

    // Enviar para analytics interno
    const analyticsUrl = Deno.env.get('INTERNAL_ANALYTICS_URL');
    const analyticsToken = Deno.env.get('INTERNAL_TOKEN');

    if (analyticsUrl) {
      await fetch(analyticsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${analyticsToken || ''}`,
        },
        body: JSON.stringify({
          event: 'initiateCheckout',
          ...payload,
          source: 'fallback',
          timestamp: Date.now(),
        }),
      }).catch((err) => {
        console.error('[ANALYTICS] Error sending to analytics:', err);
      });
    }

    // Enviar para UTMify
    const utmifyToken = Deno.env.get('UTMIFY_API_KEY');
    
    if (utmifyToken) {
      try {
        const utmifyResponse = await fetch('https://api.utmify.com.br/api/v1/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${utmifyToken}`,
          },
          body: JSON.stringify({
            pixel_id: "69115e23ec54d4aceb3e2352",
            event_name: 'initiateCheckout',
            event_data: {
              plan: payload.plan,
              value: payload.value,
              currency: payload.currency || 'BRL',
              ...payload.utms,
            },
            timestamp: payload.timestamp || Date.now(),
          }),
        });

        if (utmifyResponse.ok) {
          console.log('[UTMIFY] ✅ Evento enviado com sucesso');
        } else {
          console.error('[UTMIFY] ❌ Erro ao enviar evento:', await utmifyResponse.text());
        }
      } catch (utmifyError) {
        console.error('[UTMIFY] ❌ Erro na requisição:', utmifyError);
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in init-fallback function:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});