import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const body = await req.json();

    const API_TOKEN = Deno.env.get('UTMIFY_API_KEY') || "";

    // Garantia de payload completo
    const payload = {
      event: "purchase",
      utms: body.utms || {},
      timestamp: body.timestamp || Date.now(),
      value: body.value || null,
      currency: "BRL",
      source: "lovable-fallback",
    };

    console.log("[UTMIFY] 🔄 Enviando evento PURCHASE via fallback:", payload);

    // Envia para a API OFICIAL da UTMIFY
    const response = await fetch("https://api.utmify.com.br/v1/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.text();
    console.log("[UTMIFY] 🔍 Resposta UTMIFY:", data);

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

  } catch (err: any) {
    console.error("[UTMIFY] ❌ Erro no purchase-fallback:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});