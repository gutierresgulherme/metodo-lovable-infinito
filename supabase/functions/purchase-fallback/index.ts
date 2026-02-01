// ===============================
// CORS FIX + UTMIFY PURCHASE FALLBACK
// ===============================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Fallback-Secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req: Request) => {

  // PRE-FLIGHT
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const secret = req.headers.get("X-Fallback-Secret");
    const expected = Deno.env.get("VITE_FALLBACK_SECRET");

    if (!secret || secret !== expected) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders
      });
    }

    // Validar schema
    const body = await req.json();
    
    const Schema = z.object({
      event_name: z.string(),
      event_data: z.record(z.any()),
      timestamp: z.number()
    });

    Schema.parse(body);

    // Enviar direto à API da UTMify
    await fetch("https://api.utmify.com.br/v1/event/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...body.event_data,
        event: "purchase"
      })
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (err) {
    console.error("purchase-fallback ERROR:", err);
    return new Response("Internal Error", {
      status: 500,
      headers: corsHeaders
    });
  }
});
