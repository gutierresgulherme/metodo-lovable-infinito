import { useEffect } from "react";
import lovableInfinitoTitle from "@/assets/lovable-infinito-title.png";

export default function ThankYou() {
  useEffect(() => {
    const utms = (window as any).__UTMIFY__?.readPersistedUTMs() || {};
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    // SDK
    if ((window as any).Utmify?.track) {
      (window as any).Utmify.track("purchase", { utms });
      console.log("[UTMIFY] purchase (SDK)");
    }

    // FALLBACK
    fetch(`${supabaseUrl}/functions/v1/purchase-fallback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "purchase",
        utms,
        timestamp: Date.now(),
      }),
    })
      .then(() => {
        console.log("[UTMIFY] purchase fallback enviado");
      })
      .catch((err) => console.error("[UTMIFY] purchase fallback ERROR", err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0F24] px-6 text-white text-center">
      <img 
        src={lovableInfinitoTitle}
        alt="Método Lovable Infinito" 
        className="w-[320px] max-w-full mb-8 drop-shadow-xl"
      />

      <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#FF2EB8] to-[#00E5FF] bg-clip-text text-transparent">
        🎉 Acesso Liberado: Método Lovable Infinito
      </h1>

      <div className="max-w-xl text-lg leading-relaxed opacity-90">
        <p>Olá! Seu acesso ao Método Lovable Infinito já está pronto.</p>
        <br />

        <p>Para entrar na área de membros, siga o passo a passo abaixo:</p>
        <br />

        <p><strong>1.</strong> Acesse o link:</p>
        <p className="break-all text-[#FF2EB8] font-semibold mt-2">
          👉 https://lovable-infinity-learn.lovable.app/login
        </p>

        <p className="mt-3"><strong>2.</strong> Crie seu cadastro com seu e-mail e senha.</p>
        <p><strong>3.</strong> Acesse todo o conteúdo do Método Lovable Infinito.</p>

        <br />
        <p className="text-yellow-400 font-semibold">
          ⚠ IMPORTANTE: Salve esse link — ele é seu acesso permanente.
        </p>

        <br />
        <p>Se tiver qualquer dúvida, pode acionar nosso suporte.</p>
        <p>Bem-vindo(a) à sua nova jornada. Vamos escalar juntos. 🚀🔥</p>
      </div>

      <a
        href="https://lovable-infinity-learn.lovable.app/login"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 px-8 py-4 rounded-full bg-gradient-to-r from-[#FF2EB8] to-[#00E5FF] text-white font-bold text-lg shadow-lg hover:scale-[1.03] transition-transform"
      >
        Acessar Área de Membros
      </a>
    </div>
  );
}
