import { useEffect } from "react";

export default function ThankYou() {
  // ------------------------------------------------
  // UTMIFY — purchase tracking (SDK + fallback)
  // ------------------------------------------------
  useEffect(() => {
    const utms = (window as any).__UTMIFY__?.readPersistedUTMs() || {};
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    // SDK
    if ((window as any).Utmify?.track) {
      (window as any).Utmify.track("purchase", { utms });
      console.log("[UTMIFY] purchase SDK");
    }

    // Fallback
    fetch(`${supabaseUrl}/functions/v1/purchase-fallback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "purchase",
        utms,
        timestamp: Date.now(),
      }),
    })
      .then(() => console.log("[UTMIFY] purchase fallback"))
      .catch((err) => console.error("[UTMIFY] purchase fallback ERROR", err));
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center text-white p-6">
      <div className="max-w-md mx-auto text-center">

        {/* IMAGEM DO PRODUTO */}
        <img
          src="/lovable-infinito-title.png"
          alt="Método Lovable Infinito"
          className="w-full mb-6 drop-shadow-xl"
        />

        {/* TÍTULO */}
        <h1 className="text-3xl font-bold mb-4 text-gradient">
          🎉 Acesso Liberado: Método Lovable Infinito
        </h1>

        {/* MENSAGEM */}
        <p className="text-lg opacity-90 mb-6">
          Seu entregável do Método Lovable Infinito já está liberado para acesso imediato.
        </p>

        {/* PASSO A PASSO */}
        <div className="bg-[#11111A] p-5 rounded-xl shadow-lg border border-white/10">
          <p className="text-left leading-relaxed">
            Basta seguir o passo abaixo:
            <br /><br />
            <strong>1. Clique no link para acessar o arquivo:</strong>
            <br />
            <a
              href="https://drive.google.com/file/d/1TIsIRBbd7YZwclsSYKU-aiuG7lqCiOrV/view?usp=drivesdk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF2EB8] underline font-semibold"
            >
              👉 Abrir Entregável
            </a>
            <br /><br />
            Salve no seu dispositivo e use sempre que precisar — esse material faz parte do seu acesso vitalício ao método.
            <br /><br />
            Se tiver qualquer dúvida, pode nos chamar no suporte via WhatsApp.
            <br />
            Tamo junto pra escalar ainda mais! 🚀🔥
          </p>
        </div>
      </div>
    </div>
  );
}
