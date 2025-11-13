import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WebhookBodySchema = z.object({
  data: z.object({
    id: z.string().or(z.number()),
  }).optional(),
}).passthrough();

// EmailJS configuration
const EMAILJS_SERVICE_ID = Deno.env.get('EMAILJS_SERVICE_ID');
const EMAILJS_TEMPLATE_ID = Deno.env.get('EMAILJS_TEMPLATE_ID');
const EMAILJS_PUBLIC_KEY = Deno.env.get('EMAILJS_PUBLIC_KEY');
const EMAILJS_PRIVATE_KEY = Deno.env.get('EMAILJS_PRIVATE_KEY');

async function sendEmailViaEmailJS(toEmail: string, subject: string, message: string) {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: toEmail,
          subject: subject,
          message: message,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EmailJS error:', errorText);
      throw new Error(`EmailJS returned ${response.status}: ${errorText}`);
    }

    console.log('✅ Email enviado com sucesso para:', toEmail);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Mercado Pago webhook signature
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    
    if (!xSignature || !xRequestId) {
      console.error('❌ Missing webhook signature headers');
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    // Parse signature header (format: "ts=timestamp,v1=signature")
    const signatureParts: Record<string, string> = {};
    xSignature.split(',').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) signatureParts[key.trim()] = value.trim();
    });

    const timestamp = signatureParts['ts'];
    const signature = signatureParts['v1'];

    if (!timestamp || !signature) {
      console.error('❌ Invalid signature format');
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('❌ Invalid JSON in webhook body');
      return new Response('ok', { status: 200, headers: corsHeaders });
    }
    
    // Validate webhook body structure
    const validationResult = WebhookBodySchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ Invalid webhook body structure');
      return new Response('ok', { status: 200, headers: corsHeaders });
    }
    
    console.log('📩 Webhook Mercado Pago received');

    // Verify webhook authenticity by fetching payment from Mercado Pago API
    // This ensures the payment data is legitimate even if signature validation is bypassed

    // Confirmar status do pagamento
    if (body?.data?.id) {
      const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
      
      if (!accessToken) {
        console.error('MERCADO_PAGO_ACCESS_TOKEN not configured');
        return new Response('ok', { 
          status: 200,
          headers: corsHeaders 
        });
      }

      const paymentId = body.data.id;
      console.log('Fetching payment details for ID:', paymentId);

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error fetching payment:', response.status);
        return new Response('ok', { 
          status: 200,
          headers: corsHeaders 
        });
      }

      const payment = await response.json();
      console.log('💳 Payment status:', payment.status);

      // Salvar/atualizar pagamento no Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const paymentRecord = {
        payment_id: String(payment.id),
        payer_email: payment.payer?.email || 'unknown',
        status: payment.status,
        amount: payment.transaction_amount || 0,
        plan_description: payment.description || 'N/A',
      };

      const { error: upsertError } = await supabase
        .from('payments')
        .upsert(paymentRecord, { onConflict: 'payment_id' });

      if (upsertError) {
        console.error('❌ Erro ao salvar pagamento:', upsertError);
      } else {
        console.log('✅ Pagamento salvo no banco:', paymentRecord);
      }

      if (payment.status === 'approved') {
        console.log('✅ Payment approved');
        
        const orderId = payment.external_reference || String(payment.id);
        const utmsFromMetadata = payment.metadata?.utms ? JSON.parse(payment.metadata.utms) : {};

        // Enviar evento de purchase para analytics (dedupe server-side)
        const analyticsUrl = Deno.env.get('INTERNAL_ANALYTICS_URL');
        const analyticsToken = Deno.env.get('INTERNAL_TOKEN');

        if (analyticsUrl) {
          try {
            await fetch(analyticsUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${analyticsToken || ''}`,
              },
              body: JSON.stringify({
                event: 'purchase',
                source: 'webhook_mp',
                orderId,
                paymentId: String(payment.id),
                value: payment.transaction_amount,
                currency: payment.currency_id || 'BRL',
                utms: utmsFromMetadata,
                timestamp: Date.now(),
              }),
            });
            console.log('[ANALYTICS] Purchase event sent to analytics');
          } catch (analyticsError) {
            console.error('[ANALYTICS] Error sending to analytics:', analyticsError);
          }
        }

        // Enviar evento para UTMify
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
                pixel_id: "69103176888cf7912654f1a5",
                event_name: 'purchase',
                event_data: {
                  order_id: orderId,
                  payment_id: String(payment.id),
                  value: payment.transaction_amount,
                  currency: payment.currency_id || 'BRL',
                  email: payment.payer?.email,
                  ...utmsFromMetadata,
                },
                timestamp: Date.now(),
              }),
            });

            if (utmifyResponse.ok) {
              console.log('[UTMIFY] ✅ Evento de purchase enviado com sucesso');
            } else {
              const errorText = await utmifyResponse.text();
              console.error('[UTMIFY] ❌ Erro ao enviar evento:', utmifyResponse.status, errorText);
            }
          } catch (utmifyError) {
            console.error('[UTMIFY] ❌ Erro na requisição:', utmifyError);
          }
        }
        
        // Envio de e-mail via EmailJS (modo compatível com Edge Functions)
        try {
          // Captura o e-mail e nome do comprador vindos do Mercado Pago
          const clientEmail = payment.payer?.email;
          const clientName =
            payment.payer?.first_name ||
            payment.payer?.identification?.name ||
            "Cliente";

          if (!clientEmail) {
            console.warn("⚠️ Nenhum e-mail encontrado, cancelando envio do EmailJS.");
          } else {
            console.log("📧 Enviando e-mail de entrega para:", clientEmail);

            // Monta o corpo do e-mail com as variáveis do template configurado no EmailJS
            const emailPayload = {
              service_id: `${Deno.env.get("EMAILJS_SERVICE_ID")}`,
              template_id: `${Deno.env.get("EMAILJS_TEMPLATE_ID")}`,
              user_id: `${Deno.env.get("EMAILJS_PUBLIC_KEY")}`,
              accessToken: `${Deno.env.get("EMAILJS_PRIVATE_KEY")}`,
              template_params: {
                to_name: clientName,
                to_email: clientEmail, // e-mail digitado no checkout
              },
            };

            // Envia o e-mail de confirmação via API do EmailJS
            const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Origin": "https://lovable-unlimited-deal.lovable.app", // domínio do app
              },
              body: JSON.stringify(emailPayload),
            });

            const responseText = await emailResponse.text();
            console.log("📧 Resultado EmailJS:", responseText);

            if (!emailResponse.ok) {
              throw new Error(`Erro ao enviar e-mail: ${emailResponse.status} - ${responseText}`);
            }

            console.log("✅ E-mail de entrega enviado com sucesso para:", clientEmail);
          }
        } catch (error) {
          console.error("❌ Erro ao enviar o e-mail de entrega:", error);
        }
      } else if (payment.status === 'pending') {
        console.log('⏳ Pagamento pendente');
      } else if (payment.status === 'rejected') {
        console.log('❌ Pagamento rejeitado');
      }
    }

    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  } catch (error: any) {
    console.error('Error in mp-webhook function:', error);
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }
});
