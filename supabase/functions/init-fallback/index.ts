import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const InitEventSchema = z.object({
  event_name: z.string().optional(),
  event_data: z.record(z.any()).optional(),
  timestamp: z.number().optional(),
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate shared secret
    const secret = req.headers.get("X-Fallback-Secret");
    const expectedSecret = Deno.env.get("INTERNAL_TOKEN");
    
    if (!secret || secret !== expectedSecret) {
      console.error("[UTMIFY] Unauthorized request - invalid secret");
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const rawBody = await req.json();
    
    // Validate input
    const validationResult = InitEventSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("[UTMIFY] Invalid request:", validationResult.error.issues);
      return new Response(JSON.stringify({ ok: false, error: "Invalid input" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = validationResult.data;
    const API_TOKEN = Deno.env.get("UTMIFY_API_KEY") || "";

    const payload = {
      pixel_id: "69115e23ec54d4aceb3e2352",
      event_name: body.event_name || "initiateCheckout",
      event_data: body.event_data || {},
      timestamp: body.timestamp || Date.now()
    };

    console.log("[UTMIFY] EVENT INIT FALLBACK: initiateCheckout");

    const response = await fetch("https://api.utmify.com.br/v1/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("[UTMIFY] RESPONSE status:", response.status);

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