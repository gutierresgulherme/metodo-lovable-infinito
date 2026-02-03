import { useEffect, useRef, lazy, Suspense, useCallback, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentVSLInfo, VSLVariant } from "@/lib/vslService";
import lovableIcon from "@/assets/lovable-icon-heart.jpg";
import lovableInfinitoTitle from "@/assets/lovable-infinito-title.png";
import feedback1 from "@/assets/feedback-1.png";
import feedback2 from "@/assets/feedback-2.png";
import feedback3 from "@/assets/feedback-3.png";
import chatgptBonus from "@/assets/chatgpt-bonus.png";
import canvaBonus from "@/assets/canva-bonus.png";
import garantia7dias from "@/assets/garantia-7dias.png";
import { initPageSession, setupButtonTracking, trackVideoEvent } from "@/lib/analytics";

const db = supabase as any;

// Lazy load components
const PricingCard = lazy(() => import("@/components/PricingCard").then(m => ({ default: m.PricingCard })));
const FAQItem = lazy(() => import("@/components/FAQItem").then(m => ({ default: m.FAQItem })));

// Configuração Default (Fallback)
const DEFAULT_CONFIG = {
    BR: { domain: 'metodo-lovable-infinito.vip', prata: 'https://go.pepperpay.com.br/lonsw', gold: 'https://go.pepperpay.com.br/ukrg2' },
    USA: { domain: 'lovable-app.vip', prata: 'https://go.pepperpay.com.br/lonsw', gold: 'https://go.pepperpay.com.br/ukrg2' }
};

const Index = () => {
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [vslData, setVslData] = useState<VSLVariant | null>(null);
    const [currency, setCurrency] = useState("BRL");
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);
    const videoTrackingRef = useRef<{ lastTrackedPercent: number }>({ lastTrackedPercent: 0 });
    const unmuteListenersAdded = useRef(false);

    const [videoError, setVideoError] = useState<string | null>(null);


    // --- Initial Data Fetching ---
    useEffect(() => {
        const initPage = async () => {
            try {
                console.log("[VSL] Initializing page...");
                // 1. Get Active VSL & Domain Config
                const { vsl, isActive: domainActive, currency: domainCurrency, slug } = await getCurrentVSLInfo();

                console.log("[VSL] Info retrieved:", { slug, isActive: domainActive, currency: domainCurrency, vslName: vsl?.name, videoUrl: vsl?.video_url });

                setIsActive(domainActive);
                setCurrency(domainCurrency);

                if (vsl) {
                    setVslData(vsl);

                    // Track Session
                    const params = new URLSearchParams(window.location.search);
                    await db.from('page_sessions').insert({
                        domain: window.location.hostname,
                        vsl_slug: vsl.slug,
                        utm_source: params.get('utm_source'),
                        utm_medium: params.get('utm_medium'),
                        utm_campaign: params.get('utm_campaign')
                    });
                } else {
                    console.warn("[VSL] No VSL data found for this context.");
                    setVideoError("Nenhuma VSL configurada para este domínio/contexto.");
                }

                // 2. Load Checkout Links
                const { data } = await db.from('checkout_configs').select('*');
                if (data && data.length > 0) {
                    setConfig(prev => {
                        const newConfig = JSON.parse(JSON.stringify(prev));
                        data.forEach((item: any) => {
                            if (item.key === 'br_prata') newConfig.BR.prata = item.url;
                            if (item.key === 'br_gold') newConfig.BR.gold = item.url;
                            if (item.key === 'usa_prata') newConfig.USA.prata = item.url;
                            if (item.key === 'usa_gold') newConfig.USA.gold = item.url;
                        });
                        return newConfig;
                    });
                }
            } catch (err) {
                console.error("Error initializing page:", err);
            } finally {
                setLoading(false);
            }
        };

        initPage();
        setupButtonTracking();
    }, []);

    // --- Video Player Logic ---
    useEffect(() => {
        if (!vslData) return;

        if (!vslData.video_url) {
            console.warn("[VSL] VSL data loaded but video_url is missing.", vslData);
            setVideoError("URL do vídeo não configurada nesta VSL.");
            return;
        }

        if (!videoRef.current) return;

        const initPlayer = async () => {
            const videoElement = videoRef.current;
            if (!videoElement) return;

            console.log("[VSL] Attempting to load video:", vslData.video_url);

            try {
                // Basic HTML5 Video
                videoElement.src = vslData.video_url;
                videoElement.load();
                videoElement.muted = true;
                videoElement.play().catch(e => console.warn("[VSL] Autoplay blocked", e));

                // Attempt Shaka only IF it really looks like a stream
                if (vslData.video_url?.includes('.m3u8')) {
                    console.log("[VSL] HLS detected, loading Shaka...");
                    const shaka = await import('shaka-player/dist/shaka-player.ui.js').then(m => m.default);
                    if (shaka.Player.isBrowserSupported()) {
                        const player = new shaka.Player(videoElement);
                        await player.load(vslData.video_url);
                    }
                }
            } catch (e: any) {
                console.error("Video load error", e);
                setVideoError(`Erro ao carregar vídeo: ${e.message}`);
            }
        };

        initPlayer();

        // Sound Unlocker
        if (!unmuteListenersAdded.current) {
            const unlockSound = () => {
                if (videoRef.current) {
                    videoRef.current.muted = false;
                    videoRef.current.play().catch(() => { });
                }
                document.removeEventListener('click', unlockSound);
                document.removeEventListener('touchstart', unlockSound);
                document.removeEventListener('scroll', unlockSound);
            };
            document.addEventListener('click', unlockSound);
            document.addEventListener('touchstart', unlockSound);
            document.addEventListener('scroll', unlockSound);
            unmuteListenersAdded.current = true;
        }
    }, [vslData?.video_url]);


    // --- Helper Functions ---
    const getCurrentDate = () => {
        return new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    };

    const getCheckoutLink = useCallback((plan: 'prata' | 'gold') => {
        const hostname = window.location.hostname;
        // Se for o domínio de contingência, usa o set de links "USA" (Segunda BM)
        // Mesmo que a moeda exibida seja R$
        if (hostname.includes('lovable-app.vip')) {
            return config.USA[plan];
        }
        // Caso contrário, usa o set "BR" (Principal)
        return config.BR[plan];
    }, [config]);

    // Track Clicks with VSL Slug
    const handleCheckoutClick = async (buttonId: string, url: string) => {
        await db.from('button_clicks').insert({
            button_id: buttonId,
            domain: window.location.hostname,
            vsl_slug: vslData?.slug || 'default'
        });
        window.location.href = url;
    };

    // --- Video Tracking Handlers ---
    const handleVideoTimeUpdate = () => {
        const video = videoRef.current;
        if (!video) return;
        const percent = Math.floor((video.currentTime / video.duration) * 100);
        const last = videoTrackingRef.current.lastTrackedPercent;

        if ([25, 50, 75, 95].some(p => percent >= p && last < p)) {
            trackVideoEvent('progress', video.currentTime, video.duration);
            videoTrackingRef.current.lastTrackedPercent = percent;
        }
    };

    if (!isActive) return <div className="fixed inset-0 bg-black z-[9999]" />;
    // Removido o bloqueio de 'loading' para abertura instantânea

    // Defaults if VSL data is missing fields
    const HEADLINE = vslData?.headline || "VOCÊ AINDA PAGA PRA USAR O LOVABLE?";
    // const SUBHEADLINE = vslData?.hero_subheadline || "A verdade que ninguém te contou..."; // If added to DB

    // Pricing Display
    const PRICE_PRATA = currency === 'USD' ? '$13.90' : 'R$13,90';
    const PRICE_GOLD = currency === 'USD' ? '$24.90' : 'R$24,90';
    const OLD_PRICE = currency === 'USD' ? '$49.90' : 'R$49,90';

    return (
        <div className="min-h-screen bg-gradient-to-br from-[hsl(240,10%,3.9%)] via-[hsl(267,50%,10%)] to-[hsl(190,50%,10%)] text-foreground relative">
            <div className="bg-[hsl(0,100%,50%)] py-2 text-center sticky top-0 z-50 shadow-[0_8px_30px_rgba(255,0,0,0.5)] animate-pulse-glow">
                <p className="text-white font-bold text-xs md:text-sm">🎯 DESCONTO VÁLIDO SOMENTE HOJE — {getCurrentDate()}</p>
            </div>

            <div className="fixed top-2 right-0 w-8 h-8 z-[100] cursor-default opacity-0 hover:cursor-pointer" onClick={() => window.location.href = '/login'} />

            {/* HERO SECTION */}
            <section className="relative pt-12 pb-6 px-6 md:px-4 overflow-hidden">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    {/* Floating Title with Deep Shadow */}
                    <div className="mb-8 transform hover:scale-105 transition-transform duration-700">
                        <img
                            src={lovableInfinitoTitle}
                            alt="Lovable Infinito"
                            className="w-[60%] md:w-[75%] max-w-[320px] md:max-w-[440px] mx-auto rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.1)] filter brightness-110"
                        />
                    </div>

                    {/* AI-Inspired Headline: High Legibility & Impact */}
                    <div className="space-y-4 mb-10">
                        <h1 className="text-3xl md:text-6xl font-[900] uppercase tracking-tight leading-[0.95] perspective-1000">
                            <span className="block text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                {HEADLINE.split('?')[0]}?
                            </span>
                            <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent filter saturate-150 drop-shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                                DESTRAVE O SEU
                            </span>
                        </h1>

                        <p className="text-lg md:text-2xl font-light text-gray-400 max-w-2xl mx-auto leading-relaxed tracking-wider font-orbitron">
                            VOCÊ ESTAVA ESPERANDO <span className="text-rose-500 font-black border-b-2 border-rose-500/50 italic">
                                VIRAR O DIA
                            </span> PARA CONTINUAR SEU PROJETO?
                        </p>
                    </div>

                    {/* Integrated Price Card: Cyberpunk Aesthetic */}
                    <div className="relative inline-block group mb-2">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-cyan-600 to-purple-600 rounded-[1.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-all duration-1000"></div>
                        <div className="relative bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[1.2rem] p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
                            {/* Decorative Corner */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent -rotate-45 translate-x-8 -translate-y-8 opacity-50"></div>

                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                    <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.4em] text-rose-500">
                                        Liberação Instantânea
                                    </span>
                                </div>

                                <p className="text-xs md:text-sm text-gray-500 line-through font-medium mb-1">Original: {OLD_PRICE}</p>

                                <div className="flex flex-col items-center justify-center gap-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest italic opacity-50">Por apenas</span>
                                        <span className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] tracking-tighter">
                                            {PRICE_PRATA}
                                        </span>
                                    </div>
                                    <span className="text-[10px] md:text-xs text-emerald-400 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                        <div className="w-3 h-px bg-emerald-400/50"></div>
                                        ACESSO VITALÍCIO
                                        <div className="w-3 h-px bg-emerald-400/50"></div>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* VIDEO PLAYER */}
            <section className="pb-12 pt-4 px-6 md:px-4 relative z-0">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent flex-1" />
                        <h2 className="text-sm md:text-base font-bold text-center text-gray-400 uppercase tracking-[0.3em]">Assista à Apresentação</h2>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent flex-1" />
                    </div>
                    <div className="relative w-full max-w-[100%] rounded-xl overflow-hidden shadow-2xl bg-black aspect-video flex items-center justify-center">
                        {videoError && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
                                <p className="text-red-500 font-bold mb-2">⚠️ Eita! O vídeo não carregou.</p>
                                <p className="text-sm font-mono text-gray-300 mb-4">{videoError}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold"
                                >
                                    RECARREGAR PÁGINA
                                </button>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            id="vsl-player"
                            src={vslData?.video_url || undefined}
                            autoPlay muted playsInline controls
                            onTimeUpdate={handleVideoTimeUpdate}
                            onError={(e) => {
                                console.error("[VSL] Native video element error:", e);
                                // Only set error if we don't already have one from Shaka or logic
                                if (!videoError) {
                                    setVideoError("Erro nativo do player de vídeo. O formato pode não ser suportado.");
                                }
                            }}
                            className="w-full h-auto max-h-[500px] rounded-xl"
                        />
                    </div>

                    {/* CTA 1 - PREMIUM FUTURISTIC RED BUTTON */}
                    <div className="flex justify-center mt-8 relative z-10">
                        <div className="relative group">
                            {/* Outer Glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-red-600/50 to-rose-600/50 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 opacity-60"></div>

                            <button
                                onClick={() => handleCheckoutClick('btn-comprar-13-1', getCheckoutLink('prata'))}
                                className="btn-checkout-yampi relative flex items-center justify-center gap-3 w-full max-w-[300px] px-6 py-3.5 rounded-full bg-gradient-to-b from-red-500 to-red-700 border border-white/20 text-white font-black text-base md:text-lg uppercase tracking-tighter shadow-[0_10px_30px_rgba(185,28,28,0.4)] active:scale-95 transition-all duration-300 overflow-hidden"
                            >
                                {/* Shine effect */}
                                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-1000 group-hover:left-[100%]"></div>

                                <span className="relative z-10 flex flex-col items-center leading-tight">
                                    <span className="block italic text-[9px] opacity-70 tracking-widest mb-0.5">Garanta Agora</span>
                                    QUERO O MÉTODO LOVABLE ILIMITADO
                                    <span className="text-xs font-black text-white/90 drop-shadow-md">POR APENAS {PRICE_PRATA}</span>
                                </span>

                                {/* Pulse indicator */}
                                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white] animate-pulse"></div>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* DYNAMIC COPY SECTIONS */}
            {vslData?.benefits_copy && (
                <section className="py-8 md:py-12 px-6 md:px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground mb-8">O QUE VOU RECEBER:</h2>
                        <div className="whitespace-pre-wrap text-lg text-gray-300 leading-relaxed bg-black/40 p-6 rounded-xl border border-white/10">
                            {vslData.benefits_copy}
                        </div>
                    </div>
                </section>
            )}

            {/* DEFAULT STATIC CONTENT (If no dynamic copy provided) */}
            {!vslData?.benefits_copy && (
                <section className="py-8 md:py-12 px-6 md:px-4">
                    <div className="max-w-5xl mx-auto space-y-4">
                        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
                            {["Acesso ILIMITADO ao Lovable", "Criar SITES E APLICATIVOS ilimitadas com IA", "Sem bloqueio, sem limite", "Método testado e aprovado", "Suporte incluso"].map((feature, i) => (
                                <div key={i} className="flex items-start gap-3 bg-black/40 p-4 rounded-lg border border-[hsl(267,100%,65%,0.3)]">
                                    <Check className="w-5 h-5 text-[hsl(94,100%,73%)] mt-1" />
                                    <span className="text-base text-foreground font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FEEDBACK SECTION */}
            <section className="py-8 md:py-12 px-6 md:px-4 bg-black/20">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-white uppercase">
                        FEEDBACK DA GALERA QUE <br /> COMPROU:
                    </h2>
                    <div className="space-y-4">
                        <img src={feedback1} alt="Feedback 1" className="w-full rounded-xl border border-white/10 shadow-lg" />
                        <img src={feedback2} alt="Feedback 2" className="w-full rounded-xl border border-white/10 shadow-lg" />
                        <img src={feedback3} alt="Feedback 3" className="w-full rounded-xl border border-white/10 shadow-lg" />
                    </div>
                </div>
            </section>

            {/* CTA BONUS - PREMIUM FUTURISTIC GREEN BUTTON */}
            <div className="flex flex-col items-center py-8 relative z-10 px-6">
                <div className="relative group">
                    {/* Outer Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/50 to-green-600/50 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 opacity-60"></div>

                    <button
                        onClick={() => handleCheckoutClick('btn-comprar-bonus', getCheckoutLink('gold'))}
                        className="btn-checkout-yampi relative flex items-center justify-center gap-3 w-full max-w-[340px] px-6 py-3.5 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 border border-white/20 text-white font-black text-base md:text-lg uppercase tracking-tight shadow-[0_10px_30px_rgba(5,150,105,0.4)] active:scale-95 transition-all duration-300 overflow-hidden"
                    >
                        {/* Shine effect */}
                        <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-1000 group-hover:left-[100%]"></div>

                        <span className="relative z-10 text-center leading-tight">
                            QUERO O MÉTODO + 2 BÔNUS <br />
                            <span className="text-xs font-black text-white/90">E AULA EXCLUSIVA POR {PRICE_GOLD}</span>
                        </span>

                        {/* Pulse indicator */}
                        <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white] animate-pulse"></div>
                    </button>
                </div>
            </div>

            {/* COMPARISON TYPES */}
            <section className="py-8 md:py-12 px-6 md:px-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-white uppercase mb-8">
                        SÓ EXISTEM 2 TIPOS DE <br /> PESSOAS AQUI:
                    </h2>

                    <div className="bg-black/40 border border-[#00ff73]/30 p-6 rounded-xl flex items-start gap-4">
                        <div className="bg-[#00ff73] text-black p-1 rounded-sm min-w-6 min-h-6 flex items-center justify-center">
                            <Check className="w-4 h-4 font-bold" />
                        </div>
                        <p className="text-gray-200 text-lg">As que pegam agora esse método e desbloqueiam o Lovable de forma ilimitada</p>
                    </div>

                    <div className="bg-black/40 border border-red-500/30 p-6 rounded-xl flex items-start gap-4">
                        <div className="bg-red-500 text-white p-1 rounded-sm min-w-6 min-h-6 flex items-center justify-center font-bold">
                            X
                        </div>
                        <p className="text-gray-400 text-lg">As que vão continuar presas no plano gratuito, empacadas nos projetos sem poder testar logo</p>
                    </div>
                </div>
            </section>

            {/* REAL PRICE ANCHOR */}
            <section className="py-8 md:py-12 px-6 md:px-4">
                <div className="max-w-4xl mx-auto bg-black/40 border border-purple-500/20 rounded-2xl p-8 space-y-6">
                    <h3 className="text-xl md:text-2xl font-bold text-center text-white uppercase">
                        SE FOSSE PAGAR O PREÇO REAL <br /> POR TUDO ISSO...
                    </h3>

                    <div className="space-y-4 max-w-lg mx-auto">
                        <div className="flex items-center gap-3 text-lg text-gray-300">
                            <span className="text-2xl shrink-0">🇺🇸</span>
                            <span><strong className="text-red-400">R$ 120,00/mês</strong> (US$20) só para assinar o Lovable</span>
                        </div>
                        <div className="flex items-center gap-3 text-lg text-gray-300">
                            <span className="text-2xl shrink-0">🤖</span>
                            <span><strong className="text-red-400">R$ 120,00/mês</strong> (US$20) para ter o ChatGPT Plus</span>
                        </div>
                        <div className="flex items-center gap-3 text-lg text-gray-300">
                            <span className="text-2xl shrink-0">🎨</span>
                            <span><strong className="text-red-400">R$ 34,90/mês</strong> assinatura do Canva PRO</span>
                        </div>
                        <div className="flex items-center gap-3 text-lg text-gray-300 pt-4 border-t border-white/10">
                            <span className="text-2xl shrink-0">❌</span>
                            <span>Total real: Mais de <strong className="text-red-500">R$ 270,00 POR MÊS</strong></span>
                        </div>
                    </div>
                </div>
            </section>

            {/* BONUS SECTION */}
            <section className="py-8 md:py-12 px-6 md:px-4">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <p className="text-xl md:text-2xl text-white">
                            Por apenas <strong className="text-[#00ff73]">{PRICE_GOLD}</strong> receba o <br />
                            Método Lovable Infinito e de <br />
                            <strong className="text-white">BRINDE VÃO MAIS 2 BÔNUS <br /> EXCLUSIVOS...</strong>
                        </p>
                    </div>

                    {/* CARD LOVABLE (MAIN) */}
                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-rose-500/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 hover:border-rose-500/60 transition-all duration-300 hover:shadow-[0_0_40px_rgba(244,63,94,0.2)]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(244,63,94,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 w-32 h-32 rounded-full border-2 border-white/10 group-hover:scale-110 transition-transform duration-300 overflow-hidden shadow-2xl flex items-center justify-center bg-black">
                                <img src={lovableIcon} alt="Lovable Infinito" className="w-full h-full object-cover" />
                            </div>

                            <div className="relative z-10 text-center space-y-2">
                                <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-bold rounded-full uppercase tracking-wider border border-rose-500/20">
                                    O Método Principal
                                </span>
                                <h3 className="text-3xl font-bold text-white group-hover:text-rose-300 transition-colors">Lovable Ilimitado</h3>
                                <p className="text-gray-400 text-base">Crie softwares, apps e automações sem limites. A chave mestra do método.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* CARD CHATGPT */}
                        <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 hover:border-purple-500/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(168,85,247,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 w-28 h-28 rounded-full border-2 border-white/10 group-hover:scale-110 transition-transform duration-300 overflow-hidden shadow-2xl bg-black">
                                <img
                                    src={chatgptBonus}
                                    alt="ChatGPT 5 Plus"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="relative z-10 text-center space-y-2">
                                <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full uppercase tracking-wider border border-purple-500/20">
                                    Inteligência Suprema
                                </span>
                                <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">ChatGPT 5 Plus</h3>
                                <p className="text-gray-400 text-sm">O cérebro mais avançado do mundo trabalhando para você.</p>
                            </div>
                        </div>

                        {/* CARD CANVA */}
                        <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 hover:border-cyan-500/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 w-28 h-28 rounded-full border-2 border-white/10 group-hover:scale-110 transition-transform duration-300 overflow-hidden shadow-2xl flex items-center justify-center bg-black">
                                <img src={canvaBonus} alt="Canva PRO" className="w-full h-full object-contain" />
                            </div>

                            <div className="relative z-10 text-center space-y-2">
                                <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-full uppercase tracking-wider border border-cyan-500/20">
                                    Design Profissional
                                </span>
                                <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">Canva PRO</h3>
                                <p className="text-gray-400 text-sm">Crie artes de nível estúdio em segundos, sem pagar nada.</p>
                            </div>
                        </div>
                    </div>

                    {/* AULA BÔNUS */}
                    <div className="bg-[#0f0f0f] border-2 border-yellow-500/80 rounded-2xl p-8 relative mt-8">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-extrabold px-6 py-2 rounded-full text-xs sm:text-sm uppercase flex items-center justify-center gap-2 text-center z-20 shadow-[0_4px_15px_rgba(234,179,8,0.4)] border border-yellow-400/50 min-w-[200px] leading-tight">
                            <span className="flex items-center justify-center gap-1.5 w-full">
                                🎁 Bônus Exclusivo
                            </span>
                        </div>
                        <div className="text-center space-y-2 mt-2">
                            <h3 className="text-xl md:text-2xl font-bold text-white">Aula Bônus: Como remover a marca d'água do Lovable</h3>
                            <p className="text-gray-400">(Grátis)</p>
                        </div>
                    </div>

                </div>
            </section>

            {/* PLANS */}
            <section id="pricing" className="py-8 md:py-12 px-6 md:px-4">
                <div className="max-w-6xl mx-auto space-y-4">
                    <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">ESCOLHA SEU PLANO</h2>
                    <Suspense fallback={<div className="h-96 animate-pulse bg-black/20" />}>
                        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                            <PricingCard
                                title="🟡 PLANO GOLD"
                                price={PRICE_GOLD}
                                features={["Método Lovable Infinito", "Acesso Ilimitado", "Bônus ChatGPT 5 Plus", "Bônus Canva PRO", "Suporte Premium"]}
                                variant="gold"
                                buttonText="QUERO PLANO GOLD"
                                onCheckout={() => handleCheckoutClick('btn-comprar-24-2', getCheckoutLink('gold'))}
                            />
                            <PricingCard
                                title="⚙️ PLANO PRATA"
                                price={PRICE_PRATA}
                                features={["Método Lovable Infinito", "Acesso Ilimitado", "Suporte Básico"]}
                                variant="silver"
                                buttonText="QUERO PLANO PRATA"
                                onCheckout={() => handleCheckoutClick('btn-comprar-13-2', getCheckoutLink('prata'))}
                            />
                        </div>
                    </Suspense>
                </div>
            </section>


            {/* GUARANTEE */}
            <section className="py-8 md:py-12 px-6 md:px-4 bg-black/30">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                    <img src={garantia7dias} alt="Garantia" className="w-[200px] mx-auto" />
                    <h2 className="text-2xl font-bold text-foreground">Garantia de 7 dias ou seu dinheiro de volta</h2>
                    <p className="text-lg text-muted-foreground">{vslData?.guarantee_copy || "Se não funcionar pra você, devolvemos seu dinheiro. Simples assim."}</p>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-8 md:py-12 px-6 md:px-4">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-white uppercase">
                        PERGUNTAS FREQUENTES
                    </h2>

                    <div className="space-y-4">
                        <Suspense fallback={<div className="h-20 bg-white/5 rounded-xl animate-pulse" />}>
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
                        </Suspense>
                    </div>
                </div>
            </section>

            <footer className="py-8 px-6 border-t border-white/10 bg-black/40 text-center">
                <p className="text-gray-500 text-sm">© 2025 — Todos os direitos reservados</p>
            </footer>
        </div>
    );
};

export default Index;
