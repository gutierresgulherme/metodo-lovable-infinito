import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const API_TOKEN = Deno.env.get("UTMIFY_API_KEY") || "";

    const payload = {
      pixel_id: "69115e23ec54d4aceb3e2352",
      event_name: body.event_name || "initiateCheckout",
      event_data: body.event_data || {},
      timestamp: body.timestamp || Date.now()
    };

    console.log("[UTMIFY] EVENT INIT FALLBACK:", payload);

    const response = await fetch("https://api.utmify.com.br/v1/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("[UTMIFY] RESPONSE:", text);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err) {
    console.error("[UTMIFY] FALLBACK ERROR:", err);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});