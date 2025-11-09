import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ThankYou() {
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const status = (q.get("status") || q.get("collection_status") || "").toLowerCase();
    const paymentId = q.get("payment_id") || q.get("collection_id") || "";
    const prefId = q.get("preference_id") || "";
    const orderId = q.get("external_reference") || "";

    const dedupeKey = "__utmify_purchased_" + (paymentId || orderId || prefId || "na");
    
    if (localStorage.getItem(dedupeKey)) {
      console.log("[UTMIFY] purchase já enviado.");
      return;
    }

    const isApproved = ["approved", "accredited", "success"].includes(status);
    const utms = ((window as any).__UTMIFY__ && (window as any).__UTMIFY__.readPersistedUTMs()) || {};

    async function firePurchase() {
      const payload = {
        event: "purchase",
        orderId,
        paymentId,
        prefId,
        value: 13.90,
        currency: "BRL",
        utms
      };

      if ((window as any).Utmify && (window as any).Utmify.track) {
        (window as any).Utmify.track("purchase", payload);
        console.log("[UTMIFY] purchase (SDK)", payload);
      } else {
        try {
          await supabase.functions.invoke('purchase-fallback', {
            body: payload
          });
          console.log("[UTMIFY] purchase (fallback)", payload);
        } catch (err) {
          console.error("[UTMIFY] Error sending purchase fallback:", err);
        }
      }

      localStorage.setItem(dedupeKey, "1");
    }

    if (isApproved) {
      firePurchase();
    }
  }, []);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white px-6 text-center">
      <h1 className="text-3xl font-bold mb-4 text-green-600">🎉 Obrigado pela sua compra!</h1>
      <p className="text-gray-700 mb-4 text-base leading-relaxed">
        Seu pagamento foi confirmado e o acesso foi enviado para o seu e-mail.
      </p>
      <p className="text-gray-600 mb-8 text-sm">
        Se o e-mail não aparecer em alguns minutos, verifique a pasta de <strong>spam</strong> ou <strong>promoções</strong>.
      </p>
      <a
        href="https://wa.me/5511992361771?text=Olá%20acabei%20de%20adquirir%20o%20método%20Lovable%20Infinito!%20Gostaria%20de%20receber%20meu%20acesso%20agora."
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-green-600 hover:bg-green-700 text-white text-lg font-semibold text-center rounded-full px-6 py-3 w-full max-w-[360px] mx-auto leading-snug"
      >
        💬 Falar com suporte
      </a>
      <p className="text-gray-400 text-xs mt-10">© 2025 — Todos os direitos reservados.</p>
    </div>
  );
}