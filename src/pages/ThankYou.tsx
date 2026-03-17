import { useEffect, useRef, useState } from "react";
import lovableInfinitoLogoNew from "@/assets/lovable-infinito-thankyou.jpg";
import { Check, Zap, Users, TrendingUp, Shield, ArrowRight, Play, ImageIcon } from "lucide-react";
import { getThankYouMedia } from "@/lib/vslService";
import { useUserRole } from "@/hooks/useUserRole";
import { YouTubePlayer } from "@/components/YouTubePlayer";

// Helper to convert Canva design links to direct image thumbnails
const getCanvaThumbnail = (url: string | null) => {
  if (!url) return null;
  if (!url.includes('canva.com/design/')) return url;

  try {
    // Extract design ID using regex
    const match = url.match(/\/design\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      // Canva thumbnail URL format
      return `https://www.canva.com/design/${match[1]}/thumbnail?width=1000`;
    }
  } catch (e) {
    console.warn("[CANVA-OPTIMIZER] Erro ao converter link do Canva:", e);
  }
  return url;
};

export default function ThankYou() {
  const { role, isLoading: isRoleLoading } = useUserRole();
  const isSubAdmin = role === 'moderator';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [upsellVideoUrl, setUpsellVideoUrl] = useState<string | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>("https://www.canva.com/design/DAHB7YwVXio/2ongHvDU_T_cprox2HNHZw/view");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const initPage = async () => {
      try {
        const { videoUrl, bannerUrl } = await getThankYouMedia();
        if (videoUrl) setUpsellVideoUrl(videoUrl);
        if (bannerUrl) {
          setBannerImageUrl(getCanvaThumbnail(bannerUrl));
        } else {
          // Fallback forced if database is restricted/empty
          setBannerImageUrl(getCanvaThumbnail("https://www.canva.com/design/DAHB7YwVXio/2ongHvDU_T_cprox2HNHZw/view"));
        }
      } catch (error) {
        console.error("[THANKYOU] Supabase quota error, using fallback...", error);
        setBannerImageUrl(getCanvaThumbnail("https://www.canva.com/design/DAHB7YwVXio/2ongHvDU_T_cprox2HNHZw/view"));
      }
    };

    initPage();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0A0A0F] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10">
        {/* HERO - Confirmação */}
        <section className="pt-8 pb-6 px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Success Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 mb-6">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-sm font-medium">Compra Confirmada</span>
            </div>

            <img
              src={lovableInfinitoLogoNew}
              alt="Lovable Infinito Logo"
              className="w-[280px] sm:w-[340px] mx-auto mb-6 drop-shadow-2xl rounded-2xl"
            />

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Acesso Liberado!
              </span>
            </h1>

            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-6">
              Seu acesso ao <strong className="text-white">Método Lovable Infinito</strong> já está pronto.
              Role até o final para ver suas instruções de acesso.
            </p>
          </div>
        </section>

        <div className="h-px w-full bg-white/5 my-12" />

        {/* Divisor */}
        <div className="relative py-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          </div>
          <div className="relative flex justify-center">
            <div className="px-6 py-2 bg-[#0A0A0F] border border-emerald-500/30 rounded-full">
              <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">
                ✅ Suas Instruções de Acesso
              </span>
            </div>
          </div>
        </div>

        {/* INSTRUÇÕES ORIGINAIS */}
        <section className="py-8 px-4 pb-16">
          <div className="max-w-2xl mx-auto">
            {/* Pulsing glow effect */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 rounded-3xl blur-xl opacity-30 animate-pulse" />
              <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <div className="flex justify-center mb-4">
                  <img
                    src={lovableInfinitoLogoNew}
                    alt="Lovable Infinito Logo"
                    className="w-auto h-auto max-w-[180px] sm:max-w-[220px] object-contain rounded-xl drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Acesso ao Método Lovable Infinito
                </h2>

                <p className="text-gray-300 text-center mb-6">
                  Para entrar na área de membros, siga o passo a passo:
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5">
                    <span className="text-2xl">1️⃣</span>
                    <div>
                      <p className="text-gray-200 mb-2">Acesse o link:</p>
                      <a
                        href="https://area-de-membros-produto-lovable-inf.vercel.app/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-cyan-400 hover:text-cyan-300 font-semibold break-all"
                      >
                        👉 https://area-de-membros-produto-lovable-inf.vercel.app/login
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5">
                    <span className="text-2xl">2️⃣</span>
                    <p className="text-gray-200">Crie seu cadastro com seu e-mail e senha.</p>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5">
                    <span className="text-2xl">3️⃣</span>
                    <p className="text-gray-200">Acesse todos os módulos do Método Lovable Infinito.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6">
                  <p className="text-yellow-400 font-semibold text-center text-sm">
                    ⚠️ IMPORTANTE: Salve esse link — ele é seu acesso permanente.
                  </p>
                </div>

                <a
                  href="https://area-de-membros-produto-lovable-inf.vercel.app/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105 transition-all duration-300"
                >
                  <Check className="w-5 h-5" />
                  Acessar Área de Membros
                </a>

                <p className="mt-6 text-center text-sm text-gray-400">
                  Se tiver qualquer dúvida, pode chamar nosso suporte via WhatsApp.
                  <br />
                  <span className="text-gray-300">Vamos escalar juntos! 🚀🔥</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
