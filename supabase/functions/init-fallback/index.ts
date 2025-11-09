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
    console.log('[ANALYTICS] initiateCheckout (fallback):', payload);

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