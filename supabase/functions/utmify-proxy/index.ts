// utmify-proxy — envia eventos do Lovable → Utmify

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // === CONFIGURAÇÃO DA MINHA UTMIFY ===
    const utmifyWebhook = "https://api.utmify.com.br/webhooks/yampi?id=691575b6ec240f04799dbd98";

    const res = await fetch(utmifyWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return new Response(
      JSON.stringify({ ok: true, delivered: res.status }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    console.error("UTMIFY PROXY ERROR:", err);

    return new Response(
      JSON.stringify({ ok: false, error: err?.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
