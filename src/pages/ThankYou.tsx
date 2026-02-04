import { useEffect, useRef, useState } from "react";
import lovableInfinitoTitle from "@/assets/lovable-infinito-title.png";
import lovableIcon from "@/assets/lovable-icon.png";
import lovableInfinitoLogoNew from "@/assets/lovable-infinito-thankyou.jpg";
import { Check, Zap, Users, TrendingUp, Shield, ArrowRight, Play, ImageIcon, Mountain } from "lucide-react";
import { supabase, supabasePublic } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

export default function ThankYou() {
  const { role, isLoading: isRoleLoading } = useUserRole();
  const isSubAdmin = role === 'moderator';
  const videoRef = useRef<HTMLVideoElement>(null);
  const unmuteListenersAdded = useRef(false);
  const [upsellVideoUrl, setUpsellVideoUrl] = useState<string | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);

  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const getRegionKey = () => {
      const host = window.location.hostname;
      // Se for localhost, podemos forçar um sufixo para teste ou deixar vazio
      if (host.includes('lovable-app.vip')) return '_usa';
      if (host.includes('metodo-lovable-infinito.vip')) return '_br';
      return '';
    };

    const fetchMedia = async () => {
      try {
        const suffix = getRegionKey();
        console.log(`[THANKYOU-MEDIA] Iniciando busca | Host: ${window.location.hostname} | Sufixo: "${suffix}"`);

        // --- FETCH VIDEO ---
        const vKeys = [`thankyou_upsell${suffix}`, 'thankyou_upsell'];
        let videoUrlFound = null;

        for (const key of vKeys) {
          console.log(`[THANKYOU-MEDIA] Tentando chave de vídeo: ${key}`);
          const { data, error } = await supabase
            .from('vsl_video')
            .select('video_url')
            .eq('page_key', key)
            .maybeSingle();

          if (data?.video_url) {
            console.log(`[THANKYOU-MEDIA] SUCESSO VÍDEO encontrada chave "${key}":`, data.video_url);
            videoUrlFound = data.video_url;
            break;
          }
          if (error) console.error(`[THANKYOU-MEDIA] Erro na chave ${key}:`, error.message);
        }

        // Ultravariante: Pega o primeiro vídeo se nada foi achado
        if (!videoUrlFound) {
          console.log(`[THANKYOU-MEDIA] Nenhuma chave específica funcionou, pegando primeiro vídeo disponível no banco...`);
          const { data } = await supabase.from('vsl_video').select('video_url').limit(1).maybeSingle();
          if (data?.video_url) videoUrlFound = data.video_url;
        }

        if (videoUrlFound) setUpsellVideoUrl(videoUrlFound);

        // --- FETCH BANNER ---
        const bKeys = [`thankyou_banner${suffix}`, 'thankyou_banner'];
        let bannerUrlFound = null;

        for (const key of bKeys) {
          console.log(`[THANKYOU-MEDIA] Tentando chave de banner: ${key}`);
          const { data } = await supabase
            .from('banner_images')
            .select('image_url')
            .eq('page_key', key)
            .maybeSingle();

          if (data?.image_url) {
            console.log(`[THANKYOU-MEDIA] SUCESSO BANNER encontrada chave "${key}":`, data.image_url);
            bannerUrlFound = data.image_url;
            break;
          }
        }

        if (bannerUrlFound) setBannerImageUrl(bannerUrlFound);

      } catch (err) {
        console.error("[THANKYOU-MEDIA] Erro catastrófico:", err);
      }
    };

    fetchMedia();
  }, []);

  // Initialize video player with autoplay
  useEffect(() => {
    if (!upsellVideoUrl || !videoRef.current || isSubAdmin) return;

    const videoElement = videoRef.current;

    const attemptPlay = async () => {
      try {
        videoElement.muted = true;
        await videoElement.play();
        setIsVideoPlaying(true);
      } catch (e) {
        console.warn("[THANKYOU] Autoplay blocked, waiting for interaction", e);
        setIsVideoPlaying(false);
      }
    };

    attemptPlay();

    // Sound Unlocker
    if (!unmuteListenersAdded.current) {
      const unlockSound = () => {
        if (videoRef.current) {
          videoRef.current.muted = false;
          videoRef.current.play().catch(console.warn);
          setIsVideoPlaying(true);
          console.log("[THANKYOU] Sound unlocked");
        }
        window.removeEventListener('click', unlockSound);
        window.removeEventListener('touchstart', unlockSound);
      };

      window.addEventListener('click', unlockSound);
      window.addEventListener('touchstart', unlockSound);
      unmuteListenersAdded.current = true;
    }
  }, [upsellVideoUrl, isSubAdmin]);


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

        {/* Divisor Animado - Hidden for sub-admins */}
        {!isSubAdmin && (
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            </div>
            <div className="relative flex justify-center">
              <div className="px-6 py-2 bg-[#0A0A0F] border border-purple-500/30 rounded-full">
                <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider">
                  ⚡ Oferta Exclusiva Detectada
                </span>
              </div>
            </div>
          </div>
        )}

        {/* UPSELL SECTION - Hidden for sub-admins */}
        {!isSubAdmin && (
          <section className="py-8 px-4">
            <div className="max-w-4xl mx-auto">
              {/* Hook */}
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  <span className="text-white">Você vai dominar o Lovable.</span>
                  <br />
                  <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                    Agora é hora de escalar de verdade.
                  </span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Ferramenta sem comunidade não gera receita. É aqui que a maioria empaca.
                </p>
              </div>

              {/* Video Section */}
              <div className="relative mb-10">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 rounded-2xl blur-lg opacity-30" />
                <div className="relative bg-black/80 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer"
                  onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.paused) {
                        videoRef.current.play();
                        setIsVideoPlaying(true);
                      } else {
                        videoRef.current.pause();
                        setIsVideoPlaying(false);
                      }
                    }
                  }}
                >
                  {upsellVideoUrl ? (
                    <>
                      <video
                        ref={videoRef}
                        src={upsellVideoUrl}
                        controls={false}
                        autoPlay
                        muted
                        playsInline
                        preload="auto"
                        crossOrigin="anonymous"
                        className="w-full aspect-video"
                      />

                      {/* Play Button Overlay */}
                      {!isVideoPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                          <div className="w-20 h-20 rounded-full bg-purple-600/80 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse">
                            <Play className="w-8 h-8 text-white ml-1 fill-white" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-black flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1 fill-white" />
                        </div>
                        <p className="text-gray-400 text-sm">
                          VSL da Comunidade Lovable Brasil
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          (Faça upload via /admin/videos)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Apresentação da Oferta */}
              <div className="text-center mb-8">
                <a
                  href="https://pay.kirvano.com/1057f5fc-5244-4aef-b660-f1f5de214113"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 text-black font-bold text-lg hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] hover:scale-105 transition-all duration-300 mb-4 animate-pulse-slow"
                >
                  Entrar na Comunidade Lovable Brasil
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 bg-clip-text text-transparent">
                    Comunidade Lovable Brasil
                  </span>
                </h3>
                <p className="text-gray-300 text-base sm:text-lg text-center max-w-xl mx-auto">Grupo exclusivo no WhatsApp — Lado a lado com quem está faturando alto construindo apps e sistemas no-code com Lovable</p>
              </div>

              {/* O que é */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="text-red-400 text-sm font-semibold mb-2">❌ Se você seguir Sozinho:</div>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">→</span>
                      Gasta semanas testando o que já foi validado
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">→</span>
                      Perde as melhores práticas e atalhos do mercado
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">→</span>
                      Tem créditos infinitos no Lovable, mas não sabe transformar isso em dinheiro
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">→</span>
                      Vai cobrar barato e perder clientes para quem domina posicionamento
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                  <div className="text-emerald-400 text-sm font-semibold mb-2">✅ Se você seguir com a maior comunidade de Lovable do Brasil:</div>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">→</span>
                      Encurta meses de aprendizado
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">→</span>
                      Evita erros que custam clientes
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">→</span>
                      Aprende a precificar, vender e entregar projetos que pagam bem
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">→</span>
                      Faz seus primeiros R$5k~10k em projetos no primeiro mês
                    </li>
                  </ul>
                </div>
              </div>

              {/* Benefícios */}
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {[
                  { icon: Zap, text: "Como estruturar propostas que vendem sozinhas" },
                  { icon: TrendingUp, text: "Projetos validados que clientes pagam R$3k a R$15k" },
                  { icon: Users, text: "Bastidores e cases reais de quem já fatura com Lovable" },
                  { icon: Shield, text: "Suporte direto que economiza horas de tentativa e erro" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-gray-200 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Banner Image */}
              <div className="relative mb-8">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-pink-500/30 rounded-xl blur-lg opacity-40" />
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  {bannerImageUrl ? (
                    <img
                      src={bannerImageUrl}
                      alt="Comunidade Lovable Brasil"
                      className="w-full h-auto max-h-[280px] sm:max-h-[400px] md:max-h-none object-cover object-top"
                    />
                  ) : (
                    <div className="aspect-[16/9] sm:aspect-square bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-yellow-400" />
                        </div>
                        <p className="text-gray-400 text-sm">
                          Banner da Comunidade Lovable Brasil
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          (Faça upload via /admin/videos)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preço */}
              <div className="relative mb-8">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 rounded-2xl blur opacity-20" />
                <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border border-yellow-500/30">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Valor normal: <span className="line-through">R$100</span></p>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-gray-400 text-xl">Por apenas</span>
                      <span className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 bg-clip-text text-transparent">
                        R$50
                      </span>
                    </div>
                    <p className="text-emerald-400 text-sm font-semibold mb-6">
                      ✓ Sem mensalidade • ✓ Acesso imediato • ✓ Grupo fechado no WhatsApp
                    </p>

                    {/* CTA Button */}
                    <a
                      href="https://pay.kirvano.com/1057f5fc-5244-4aef-b660-f1f5de214113"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 text-black font-bold text-lg hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] hover:scale-105 transition-all duration-300 animate-pulse-slow"
                    >
                      Entrar na Comunidade Lovable Brasil
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>

                    <p className="text-gray-500 text-xs mt-4">
                      ⚠️ Essa condição existe apenas nesta página, apenas agora.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

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
