import { useEffect, useRef, lazy, Suspense, useCallback } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import lovableInfinitoTitle from "@/assets/lovable-infinito-title.png";
import feedback1 from "@/assets/feedback-1.png";
import feedback2 from "@/assets/feedback-2.png";
import feedback3 from "@/assets/feedback-3.png";
import chatgptBonus from "@/assets/chatgpt-bonus.png";
import canvaBonus from "@/assets/canva-bonus.png";
import garantia7dias from "@/assets/garantia-7dias.png";
import { initPageSession, setupButtonTracking, trackVideoEvent, trackButtonClick } from "@/lib/analytics";

// Lazy load components for better initial load performance
const PricingCard = lazy(() => import("@/components/PricingCard").then(m => ({ default: m.PricingCard })));
const FAQItem = lazy(() => import("@/components/FAQItem").then(m => ({ default: m.FAQItem })));

// Configuração Multi-BM / Domínios
const CONFIG = {
  BR: {
    domain: 'metodo-lovable-infinito.vip',
    prata: 'https://go.pepperpay.com.br/lonsw',
    gold: 'https://go.pepperpay.com.br/ukrg2',
  },
  USA: {
    domain: 'lovable-app.vip',
    // Fallbacks para BR enquanto os novos links não são gerados
    prata: 'https://go.pepperpay.com.br/lonsw',
    gold: 'https://go.pepperpay.com.br/ukrg2',
  }
};

const getCheckoutLink = (plan: 'prata' | 'gold') => {
  const hostname = window.location.hostname;
  const isUSA = hostname.includes('lovable-app.vip');
  const target = isUSA ? CONFIG.USA : CONFIG.BR;
  return target[plan];
};

const Index = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const unmuteListenersAdded = useRef(false);
  const videoTrackingRef = useRef<{ lastTrackedPercent: number }>({ lastTrackedPercent: 0 });

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  useEffect(() => {
    const initVSLPlayer = async () => {
      if (!videoRef.current) return;

      try {
        // 1. Buscar vídeo do Supabase
        const { data: videoData, error } = await supabase
          .from('vsl_video')
          .select('video_url')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !videoData?.video_url) {
          console.warn('[VSL] No video found in database');
          return;
        }

        const videoUrl = videoData.video_url;
        const videoElement = videoRef.current;

        // 2. Lazy load Shaka Player apenas quando necessário
        const shaka = await import('shaka-player/dist/shaka-player.ui.js').then(m => m.default);

        // 3. Verificar suporte do Shaka Player
        if (!shaka.Player.isBrowserSupported()) {
          console.error('[VSL] Shaka Player not supported');
          return;
        }

        // 4. Inicializar Shaka Player
        const player = new shaka.Player(videoElement);

        // Configurar player
        player.configure({
          streaming: {
            bufferingGoal: 30,
            rebufferingGoal: 2
          }
        });

        // 5. Carregar vídeo
        await player.load(videoUrl);

        // 6. Forçar autoplay com múltiplas tentativas
        if (videoElement) {
          videoElement.muted = true;

          const tryPlay = async () => {
            try {
              await videoElement.play();
            } catch (e) {
              console.log('[VSL] Autoplay attempt prevented:', e);
            }
          };

          // Múltiplas tentativas para garantir autoplay
          tryPlay();
          setTimeout(tryPlay, 300);
          setTimeout(tryPlay, 800);
        }

        // 7. Ativar áudio na primeira interação
        if (!unmuteListenersAdded.current) {
          const tryPlayWithSound = () => {
            if (videoElement) {
              videoElement.muted = false;
              videoElement.play().catch(() => { });
            }
            // Remover listeners após ativação
            document.removeEventListener('click', tryPlayWithSound);
            document.removeEventListener('touchstart', tryPlayWithSound);
            document.removeEventListener('scroll', tryPlayWithSound);
          };

          document.addEventListener('click', tryPlayWithSound);
          document.addEventListener('touchstart', tryPlayWithSound);
          document.addEventListener('scroll', tryPlayWithSound);
          unmuteListenersAdded.current = true;
        }

        // Cleanup ao desmontar
        return () => {
          try {
            player.destroy();
          } catch (e) {
            console.error('[VSL] Error destroying player:', e);
          }
        };

      } catch (error) {
        console.error('[VSL] Error initializing player:', error);
      }
    };

    initVSLPlayer();

    // Iniciar sessão de analytics
    initPageSession();

    // Configurar tracking de botões após renderização
    const trackingTimeout = setTimeout(() => {
      setupButtonTracking();
    }, 1000);

    return () => clearTimeout(trackingTimeout);
  }, []);

  // Handler para eventos de vídeo (tracking de retenção)
  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.duration === 0) return;

    const currentPercent = Math.floor((video.currentTime / video.duration) * 100);
    const lastTracked = videoTrackingRef.current.lastTrackedPercent;

    // Rastrear a cada 25% de progresso
    if (currentPercent >= 25 && lastTracked < 25) {
      trackVideoEvent('progress', video.currentTime, video.duration);
      videoTrackingRef.current.lastTrackedPercent = 25;
    } else if (currentPercent >= 50 && lastTracked < 50) {
      trackVideoEvent('progress', video.currentTime, video.duration);
      videoTrackingRef.current.lastTrackedPercent = 50;
    } else if (currentPercent >= 75 && lastTracked < 75) {
      trackVideoEvent('progress', video.currentTime, video.duration);
      videoTrackingRef.current.lastTrackedPercent = 75;
    } else if (currentPercent >= 95 && lastTracked < 95) {
      trackVideoEvent('progress', video.currentTime, video.duration);
      videoTrackingRef.current.lastTrackedPercent = 95;
    }
  }, []);

  const handleVideoPlay = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      trackVideoEvent('play', video.currentTime, video.duration);
    }
  }, []);

  const handleVideoPause = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      trackVideoEvent('pause', video.currentTime, video.duration);
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      trackVideoEvent('ended', video.currentTime, video.duration);
      videoTrackingRef.current.lastTrackedPercent = 100;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(240,10%,3.9%)] via-[hsl(267,50%,10%)] to-[hsl(190,50%,10%)] text-foreground relative">
      {/* Top Banner */}
      <div className="bg-[hsl(0,100%,50%)] py-2 text-center sticky top-0 z-50 shadow-[0_8px_30px_rgba(255,0,0,0.5)] animate-pulse-glow">
        <p className="text-white font-bold text-xs md:text-sm">
          🎯 DESCONTO VÁLIDO SOMENTE HOJE — {getCurrentDate()}
        </p>
      </div>

      {/* Hero Section */}
      <section className="relative py-8 md:py-12 px-6 md:px-4 overflow-hidden z-0">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4 mb-8">
          <img
            src={lovableInfinitoTitle}
            alt="Lovable Infinito"
            loading="eager"
            fetchPriority="high"
            className="w-[60%] md:w-[75%] max-w-[340px] md:max-w-[450px] mx-auto rounded-xl shadow-[0_0_18px_rgba(255,255,255,0.15)] animate-pulse-glow"
            style={{
              filter: "contrast(1.05) saturate(1.1)",
            }}
          />
          <h2 className="text-2xl md:text-4xl font-bold text-[hsl(267,100%,65%)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            VOCÊ AINDA PAGA PRA USAR O LOVABLE?
          </h2>
          <p className="text-base md:text-2xl text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            até quando você vai continuar
          </p>
          <p className="text-lg md:text-3xl font-bold text-foreground uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            ESPERANDO VIRAR O DIA PARA CONTINUAR SEU PROJETO…
          </p>
          <p className="text-base md:text-2xl text-[hsl(var(--neon-gold))] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Tenha acesso ao Método Lovable Ilimitado
          </p>
          <div className="space-y-2">
            <p className="text-lg md:text-2xl text-[#ff2d2d] line-through font-semibold">
              De: R$49,90
            </p>
            <p className="text-2xl md:text-5xl font-black drop-shadow-[0_0_15px_rgba(0,255,115,0.6)]">
              Por apenas <span className="text-[#00ff73]">R$13,90</span>
            </p>
          </div>

        </div>
      </section>

      {/* Video Section */}
      <section className="py-8 md:py-12 px-6 md:px-4 bg-black/30 mt-6 relative z-0">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            ASSISTA AO VÍDEO DA OFERTA
          </h2>
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "100%",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <video
              ref={videoRef}
              id="vsl-player"
              autoPlay
              muted
              playsInline
              preload="metadata"
              controls
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "360px",
                borderRadius: "12px",
                contentVisibility: "auto"
              }}
            ></video>
          </div>

          <div className="flex flex-col items-center gap-4 mt-6 relative z-10 pointer-events-auto">
            <a
              id="btn-comprar-13-1"
              href={getCheckoutLink('prata')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-checkout-yampi block w-full max-w-[360px] mx-auto rounded-full px-6 py-3 text-base sm:text-lg font-semibold text-white text-center leading-snug whitespace-normal break-words bg-red-600 hover:bg-red-700 shadow-md active:scale-[0.99] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 cursor-pointer"
            >
              QUERO O MÉTODO LOVABLE ILIMITADO POR R$13,90
            </a>
          </div>
        </div>
      </section>

      {/* What You'll Receive Section */}
      <section className="py-8 md:py-12 px-6 md:px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            O QUE VOU RECEBER:
          </h2>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
            {[
              "Acesso ILIMITADO ao Lovable",
              "Criar SITES E APLICATIVOS ilimitadas com IA",
              "Sem bloqueio, sem limite, sem trava",
              "Método testado e aprovado pelos GRINGOS",
              "Suporte se tiver qualquer dúvida",
              "Chegou o fim da palhaçada",
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-black/40 p-4 md:p-5 rounded-lg border border-[hsl(267,100%,65%,0.3)] hover:border-[hsl(267,100%,65%)] transition-colors"
              >
                <Check className="w-5 md:w-6 h-5 md:h-6 text-[hsl(94,100%,73%)] shrink-0 mt-1" />
                <span className="text-base md:text-lg text-foreground font-medium">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-[hsl(267,100%,65%,0.1)] to-[hsl(190,100%,50%,0.1)] p-6 md:p-8 rounded-xl border border-[hsl(267,100%,65%,0.3)] mb-8">
            <p className="text-base md:text-lg mb-4 text-foreground">
              A gente descobriu uma brecha limpa no sistema do Lovable.
            </p>
            <p className="text-base md:text-lg text-foreground">
              E agora você pode ter acesso completo, vitalício, sem limite de
              páginas, sem pagar NADA todo mês.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-center mb-8">
            <div className="bg-black/40 p-4 md:p-6 rounded-lg border border-[hsl(190,100%,50%)] shadow-[0_0_20px_hsl(190,100%,50%/0.3)]">
              <p className="text-base md:text-lg font-bold text-[hsl(190,100%,50%)]">
                📌 Não precisa cartão internacional
              </p>
            </div>
            <div className="bg-black/40 p-4 md:p-6 rounded-lg border border-[hsl(190,100%,50%)] shadow-[0_0_20px_hsl(190,100%,50%/0.3)]">
              <p className="text-base md:text-lg font-bold text-[hsl(190,100%,50%)]">
                📌 Não é pirataria
              </p>
            </div>
            <div className="bg-black/40 p-4 md:p-6 rounded-lg border border-[hsl(190,100%,50%)] shadow-[0_0_20px_hsl(190,100%,50%/0.3)]">
              <p className="text-base md:text-lg font-bold text-[hsl(190,100%,50%)]">
                📌 Funciona AGORA
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bonus Section */}
      <section className="py-8 md:py-12 px-6 md:px-4 bg-black/30">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Por apenas{" "}
            <span className="text-[#00ff73] font-black">R$24,90</span> receba o
            Método Lovable Infinito
            <br className="hidden md:block" />
            e de BRINDE VÃO MAIS 2 BÔNUS EXCLUSIVOS…
          </h2>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
            <div className="bg-black/50 p-6 md:p-8 rounded-xl border-2 border-[hsl(267,100%,65%)] hover:border-[hsl(267,100%,75%)] transition-colors shadow-[0_0_30px_hsl(267,100%,65%/0.3)]">
              <div className="w-24 md:w-32 h-24 md:h-32 mx-auto mb-4 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.08)]">
                <img
                  src={chatgptBonus}
                  alt="ChatGPT 5 Plus"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                ChatGPT 5 Plus
              </h3>
            </div>
            <div className="bg-black/50 p-6 md:p-8 rounded-xl border-2 border-[hsl(190,100%,50%)] hover:border-[hsl(190,100%,60%)] transition-colors shadow-[0_0_30px_hsl(190,100%,50%/0.3)]">
              <div className="w-24 md:w-32 h-24 md:h-32 mx-auto mb-4 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.08)]">
                <img
                  src={canvaBonus}
                  alt="Canva PRO"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                Canva PRO
              </h3>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[hsl(45,100%,60%)] to-[hsl(36,100%,50%)] p-1 md:p-2 rounded-xl shadow-[0_0_40px_hsl(45,100%,60%/0.5)] mb-8 animate-pulse-glow">
            <div className="bg-[hsl(240,10%,8%)] p-6 md:p-8 rounded-lg">
              <div className="inline-block bg-gradient-to-r from-[hsl(45,100%,60%)] to-[hsl(36,100%,50%)] text-black px-4 py-2 rounded-full font-bold mb-4 text-sm md:text-base">
                🎁 BÔNUS EXCLUSIVO
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Aula Bônus: Como remover a marca d&apos;água do Lovable
              </h3>
              <p className="text-muted-foreground">(Grátis)</p>
            </div>
          </div>

          <div className="relative z-10 pointer-events-auto">
            <a
              id="btn-comprar-24-1"
              href={getCheckoutLink('gold')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-checkout-yampi block w-full max-w-[360px] mx-auto rounded-full px-6 py-3 text-base sm:text-lg font-semibold text-white text-center leading-snug whitespace-normal break-words bg-emerald-600 hover:bg-emerald-700 shadow-md active:scale-[0.99] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 cursor-pointer"
            >
              QUERO O MÉTODO + 2 BÔNUS E AULA EXCLUSIVA POR R$24,90
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-8 md:py-12 px-6 md:px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            FEEDBACK DA GALERA QUE COMPROU:
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {[feedback1, feedback2, feedback3].map((imageUrl, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.25)] md:transition-transform md:duration-300 md:hover:scale-105"
              >
                <img
                  src={imageUrl}
                  alt={`Feedback ${index + 1}`}
                  className="w-full h-full object-cover max-h-[360px] md:max-h-[360px]"
                  style={{
                    maxHeight: "280px",
                    contentVisibility: "auto"
                  }}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decision Section */}
      <section className="py-8 md:py-12 px-6 md:px-4 bg-black/30">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            SÓ EXISTEM 2 TIPOS DE PESSOAS AQUI:
          </h2>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-12">
            <div className="bg-gradient-to-br from-[hsl(190,100%,50%,0.2)] to-[hsl(267,100%,65%,0.2)] p-4 md:p-6 rounded-xl border-2 border-[hsl(190,100%,50%)]">
              <p className="text-base md:text-lg text-foreground">
                ✅ As que pegam agora esse método e desbloqueiam o Lovable de
                forma ilimitada
              </p>
            </div>
            <div className="bg-muted/10 p-4 md:p-6 rounded-xl border-2 border-muted">
              <p className="text-base md:text-lg text-muted-foreground">
                ❌ As que vão continuar presas no plano gratuito, empacadas nos
                projetos sem poder testar logo
              </p>
            </div>
          </div>

          <div className="bg-black/50 p-6 md:p-8 rounded-xl border-2 border-[hsl(267,100%,65%,0.3)]">
            <h3 className="text-xl md:text-2xl font-bold mb-6 text-center text-foreground">
              SE FOSSE PAGAR O PREÇO REAL POR TUDO ISSO…
            </h3>
            <div className="space-y-3 mb-6">
              <p className="text-base md:text-lg text-foreground">
                💰{" "}
                <span className="text-[hsl(0,100%,59%)]">US$20</span> por mês só
                pra ter acesso ao Lovable
              </p>
              <p className="text-base md:text-lg text-foreground">
                💰{" "}
                <span className="text-[hsl(0,100%,59%)]">US$15</span> mensais
                pra usar o Gamma PRO sem limitações
              </p>
              <p className="text-base md:text-lg text-foreground">
                💰{" "}
                <span className="text-[hsl(0,100%,59%)]">US$20</span> mensais
                pra liberar o verdadeiro poder do ChatGPT PRO
              </p>
              <p className="text-base md:text-lg text-foreground">
                💰{" "}
                <span className="text-[hsl(0,100%,59%)]">US$58</span> mensais
                pra liberar todos os recursos do Canva PRO ANUAL
              </p>
            </div>
            <div className="border-t border-[hsl(267,100%,65%,0.3)] pt-6 mb-6">
              <p className="text-xl md:text-2xl font-bold text-center text-foreground mb-2">
                Soma total?{" "}
                <span className="text-[hsl(0,100%,59%)]">US$103/mês</span>
              </p>
              <p className="text-lg md:text-xl text-center text-muted-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                (+ de <span className="text-[#00ff73] font-bold">R$570</span>{" "}
                por mês, fácil.)
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg md:text-xl mb-2 text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                E o que você vai pagar aqui?
              </p>
              <p className="text-4xl md:text-5xl font-black drop-shadow-[0_0_20px_rgba(0,255,115,0.6)]">
                Apenas <span className="text-[#00ff73]">R$13,90</span>
              </p>
              <p className="text-xl md:text-2xl font-bold text-[hsl(45,100%,60%)] mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Uma Única Vez.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="py-8 md:py-12 px-6 md:px-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            ESCOLHA SEU PLANO
          </h2>
          <Suspense fallback={<div className="grid md:grid-cols-2 gap-6 md:gap-8"><div className="h-96 animate-pulse bg-black/20 rounded-xl" /><div className="h-96 animate-pulse bg-black/20 rounded-xl" /></div>}>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <PricingCard
                title="🟡 PLANO GOLD"
                price="R$24,90"
                features={[
                  "Método Lovable Infinito",
                  "Acesso ilimitado Lovable",
                  "Bônus ChatGPT 5 Plus",
                  "Bônus Canva PRO",
                  "🎁 Aula: Como remover a marca d'água do Lovable",
                  "Suporte premium",
                ]}
                variant="gold"
                buttonText="QUERO PLANO GOLD"
                checkoutLink={getCheckoutLink('gold')}
                buttonId="btn-comprar-24-2"
              />
              <PricingCard
                title="⚙️ PLANO PRATA"
                price="R$13,90"
                features={[
                  "Método Lovable Infinito",
                  "Acesso ilimitado Lovable",
                  "Suporte básico",
                ]}
                variant="silver"
                buttonText="QUERO PLANO PRATA"
                checkoutLink={getCheckoutLink('prata')}
                buttonId="btn-comprar-13-2"
              />
            </div>
          </Suspense>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-8 md:py-12 px-6 md:px-4 bg-black/30">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-block mb-6">
            <img
              src={garantia7dias}
              alt="Garantia 7 dias"
              loading="lazy"
              decoding="async"
              className="w-auto max-w-[200px] md:max-w-[200px] mx-auto rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.1)]"
            />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold mb-6 text-foreground">
            Garantia de 7 dias ou seu dinheiro de volta
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-4">
            Se não funcionar pra você, devolvemos seu dinheiro.
          </p>
          <p className="text-base md:text-lg text-foreground">
            Sem desculpa, sem enrolação.
            <br />
            Ou funciona, ou o dinheiro volta. Simples assim.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 md:py-12 px-6 md:px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            PERGUNTAS FREQUENTES
          </h2>
          <Suspense fallback={<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse bg-black/20 rounded-lg" />)}</div>}>
            <div className="space-y-4">
              <FAQItem
                question="Isso é golpe?"
                answer="Não. O método é legítimo e validado por diversos usuários reais."
              />
              <FAQItem
                question="Precisa baixar algo?"
                answer="Não, tudo é feito online, direto no Lovable."
              />
              <FAQItem
                question="Posso tomar ban?"
                answer="Não. O método é uma brecha limpa, 100% segura."
              />
              <FAQItem
                question="E se não funcionar?"
                answer="Funciona. Mas se não funcionar com você, devolvemos seu dinheiro. Simples."
              />
            </div>
          </Suspense>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-4 border-t border-[hsl(267,100%,65%,0.3)] bg-black/40">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm md:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            © 2025 — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
