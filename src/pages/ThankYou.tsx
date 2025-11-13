import { useEffect } from "react";
import lovableInfinitoTitle from "@/assets/lovable-infinito-title.png";

export default function ThankYou() {
  useEffect(() => {
    const utms = (window as any).__UTMIFY__?.readPersistedUTMs() || {};
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    // 1) SDK UTMify
    if ((window as any).Utmify?.track) {
      (window as any).Utmify.track("purchase", { utms });
      console.log("[UTMIFY] PURCHASE enviado via SDK");
    } else {
      console.warn("[UTMIFY] SDK não disponível — usando fallback.");
    }

    // 2) FALLBACK (server-side)
    fetch(`${supabaseUrl}/functions/v1/purchase-fallback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "purchase",
        utms,
        timestamp: Date.now(),
        value: 13.90,
      }),
    })
      .then(() => console.log("[UTMIFY] PURCHASE fallback enviado"))
      .catch((err) => console.error("[UTMIFY] Erro fallback PURCHASE:", err));
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#0A0A0F] text-white">
      {/* IMAGEM DO PRODUTO */}
      <img
        src={lovableInfinitoTitle}
        alt="Método Lovable Infinito"
        className="w-[320px] sm:w-[380px] mb-8 drop-shadow-2xl"
      />

      {/* Título */}
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
        🎉 Acesso Liberado: Método Lovable Infinito
      </h1>

      {/* Mensagem */}
      <p className="text-lg sm:text-xl text-center max-w-[700px] leading-relaxed mb-6">
        Olá! Seu acesso ao <strong>Método Lovable Infinito</strong> já está pronto.
        Para entrar na área de membros, siga o passo a passo abaixo:
      </p>

      {/* Lista */}
      <div className="text-left max-w-[700px] text-lg sm:text-xl space-y-4 mb-6">
        <p>1️⃣ Acesse o link:</p>

        <a
          href="https://lovable-infinity-learn.lovable.app/login"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xl font-bold p-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 transition"
        >
          👉 https://lovable-infinity-learn.lovable.app/login
        </a>

        <p>2️⃣ Crie seu cadastro com seu e-mail e senha.</p>
        <p>3️⃣ Acesse todos os módulos do Método Lovable Infinito.</p>

        <p className="text-yellow-400 font-semibold mt-4">
          ⚠ IMPORTANTE: Salve esse link — ele é seu acesso permanente.
        </p>
      </div>

      {/* Botão principal */}
      <a
        href="https://lovable-infinity-learn.lovable.app/login"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 px-8 py-4 text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 rounded-full hover:opacity-90 transition shadow-xl"
      >
        Acessar Área de Membros
      </a>

      {/* Rodapé */}
      <p className="mt-8 text-center text-sm text-gray-300">
        Se tiver qualquer dúvida, pode chamar nosso suporte via WhatsApp.<br />
        Vamos escalar juntos! 🚀🔥
      </p>
    </div>
  );
}
