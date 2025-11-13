const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-yampi-token',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[YAMPI] 🔔 Webhook received');

    // Validate token
    const SECRET = Deno.env.get('YAMPI_WEBHOOK_SECRET');
    const receivedToken = req.headers.get('x-yampi-token');

    if (!SECRET || receivedToken !== SECRET) {
      console.error('[YAMPI] ❌ Token inválido');
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await req.json();
    console.log('[YAMPI] 📦 Event:', data.event);

    // Valid events for purchase tracking
    const validEvents = [
      'pedido_aprovado',
      'payment_approved',
      'order_paid',
      'pedido_atualizado',
      'status_pedido_atualizado'
    ];

    if (!validEvents.includes(data.event)) {
      console.log('[YAMPI] ⚠️ Evento ignorado:', data.event);
      return new Response(
        JSON.stringify({ ignored: true }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract order data
    const product = data?.data?.items?.[0]?.name || 'Método Lovable Infinito';
    const price = parseFloat(data?.data?.amount || data?.data?.total || 0);
    const orderId = data?.data?.number || data?.data?.id || '';
    const customerEmail = data?.data?.customer?.email || '';
    const utms = data?.data?.metadata?.utms || {};

    console.log('[YAMPI] 💰 Purchase processed:', { product, orderId });

    // Send purchase event to UTMify
    const UTMIFY_API_KEY = Deno.env.get('UTMIFY_API_KEY');
    if (UTMIFY_API_KEY) {
      try {
        const utmifyPayload = {
          event: 'purchase',
          orderId,
          value: price,
          currency: 'BRL',
          productName: product,
          customerEmail,
          ...utms
        };

        const utmifyResponse = await fetch('https://api.utmify.com.br/api/v1/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${UTMIFY_API_KEY}`
          },
          body: JSON.stringify(utmifyPayload)
        });

        if (utmifyResponse.ok) {
          console.log('[UTMIFY] ✅ Purchase event sent successfully');
        } else {
          const errorText = await utmifyResponse.text();
          console.error('[UTMIFY] ❌ Error sending purchase event:', errorText);
        }
      } catch (error) {
        console.error('[UTMIFY] ❌ Exception sending purchase event:', error);
      }
    } else {
      console.log('[UTMIFY] ⚠️ API key not configured');
    }

    // Send to internal analytics if configured
    const INTERNAL_ANALYTICS_URL = Deno.env.get('INTERNAL_ANALYTICS_URL');
    const INTERNAL_TOKEN = Deno.env.get('INTERNAL_TOKEN');
    
    if (INTERNAL_ANALYTICS_URL && INTERNAL_TOKEN) {
      try {
        const analyticsPayload = {
          event: 'purchase',
          orderId,
          value: price,
          currency: 'BRL',
          productName: product,
          customerEmail,
          utms,
          source: 'yampi'
        };

        await fetch(INTERNAL_ANALYTICS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${INTERNAL_TOKEN}`
          },
          body: JSON.stringify(analyticsPayload)
        });

        console.log('[ANALYTICS] ✅ Event sent to internal analytics');
      } catch (error) {
        console.error('[ANALYTICS] ❌ Error sending to internal analytics:', error);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    console.error('[YAMPI] ❌ Error processing webhook:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
