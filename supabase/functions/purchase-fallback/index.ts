import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PurchaseEventSchema = z.object({
  utms: z.record(z.string()).optional(),
  timestamp: z.number().optional(),
  value: z.number().optional(),
});

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate shared secret
    const secret = req.headers.get("X-Fallback-Secret");
    const expectedSecret = Deno.env.get("INTERNAL_TOKEN");
    
    if (!secret || secret !== expectedSecret) {
      console.error("[UTMIFY] Unauthorized request - invalid secret");
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const rawBody = await req.json();
    
    // Validate input
    const validationResult = PurchaseEventSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("[UTMIFY] Invalid request:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid input" }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const body = validationResult.data;
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

    console.log("[UTMIFY] 🔄 Sending purchase event via fallback");

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
    console.log("[UTMIFY] 🔍 UTMIFY response status:", response.status);

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