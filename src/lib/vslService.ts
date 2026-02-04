// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabasePublic } from "@/integrations/supabase/client";

export interface VSLVariant {
    id: string;
    name: string;
    slug: string;
    video_url: string | null;
    headline: string | null;
    benefits_copy: string | null;
    method_explanation_copy: string | null;
    pricing_copy: string | null;
    guarantee_copy: string | null;
    created_at: string;
    updated_at: string;
}

const db = supabasePublic as any;

export interface ActiveVSLInfo {
    vsl: VSLVariant | null;
    slug: string;
    isActive: boolean;
    currency: string;
}

export const getRegionByDomain = () => {
    const hostname = window.location.hostname;
    if (hostname.includes('lovable-app.vip')) return 'USA';
    return 'BR';
};

export const getCurrentVSLInfo = async (): Promise<ActiveVSLInfo> => {
    try {
        const region = getRegionByDomain();
        const currency = region === 'USA' ? 'USD' : 'BRL';
        const suffix = region === 'USA' ? '_usa' : '_br';

        console.log(`[VSL] Detectado: Região ${region} | Suffix ${suffix} | Host ${window.location.hostname}`);

        // 1. TENTA VÍDEO REGIONAL (EX: home_vsl_br)
        const regionalKey = `home_vsl${suffix}`;
        console.log(`[VSL] Buscando chave regional: ${regionalKey}`);

        let videoData = null;

        // Use maybeSingle and explicitly check against the keys, avoid fetching "any"
        let { data: regionalData, error: regError } = await db.from("vsl_video")
            .select("*")
            .eq("page_key", regionalKey)
            .maybeSingle();

        if (regionalData) {
            videoData = regionalData;
        } else {
            if (regError) console.error("[VSL] Erro na busca regional:", regError.message);

            // 2. FALLBACK 1: TENTA VÍDEO GLOBAL (EX: home_vsl)
            console.log(`[VSL] Sem vídeo regional, buscando global: home_vsl`);
            const { data: globalData, error: globError } = await db.from("vsl_video")
                .select("*")
                .eq("page_key", "home_vsl")
                .maybeSingle();

            if (globalData) {
                videoData = globalData;
            } else {
                if (globError) console.error("[VSL] Erro na busca global:", globError.message);
            }
        }

        // 3. FALLBACK DE STORAGE (BLIND FALLBACK)
        // Se não achou nada no banco, NÃO PEGA QUALQUER VÍDEO. Constrói a URL esperada.
        if (!videoData) {
            console.warn("[VSL] NADA ENCONTRADO NO BANCO. Tentando URL direta do Storage (Blind Fallback).");
            const storageBase = "https://eidcxqxjmraargwhrdai.supabase.co/storage/v1/object/public/videos/vsl/";

            // Assume que se o admin subiu para "Home VSL Brasil", o arquivo é home_vsl_br.mp4
            const fallbackKey = regionalKey;
            const fallbackUrl = `${storageBase}${fallbackKey}.mp4`;

            // Mockando um objeto VSLVariant com a URL direta
            const vsl: VSLVariant = {
                id: "fallback-storage",
                name: "Vídeo Recuperado (Storage)",
                slug: "home-vsl",
                video_url: fallbackUrl,
                headline: "VOCÊ AINDA PAGA PRA USAR O LOVABLE?",
                benefits_copy: null,
                method_explanation_copy: null,
                pricing_copy: null,
                guarantee_copy: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            return { vsl, slug: "home-vsl", isActive: true, currency };
        }

        const vsl: VSLVariant = {
            id: videoData.id,
            name: videoData.name || "Vídeo Principal",
            slug: "home-vsl",
            video_url: videoData.video_url,
            headline: videoData.headline || "VOCÊ AINDA PAGA PRA USAR O LOVABLE?",
            benefits_copy: videoData.benefits_copy || null,
            method_explanation_copy: null,
            pricing_copy: null,
            guarantee_copy: null,
            created_at: videoData.created_at,
            updated_at: videoData.created_at
        };

        return { vsl, slug: "home-vsl", isActive: true, currency };
    } catch (e: any) {
        console.error("[VSL] Erro catastrófico no service:", e);
        const region = getRegionByDomain();
        const suffix = region === 'USA' ? '_usa' : '_br';
        const storageBase = "https://eidcxqxjmraargwhrdai.supabase.co/storage/v1/object/public/videos/vsl/";

        // Em caso de erro total, tenta construir URL também, não força home_vsl padrão se for BR
        const fallbackUrl = `${storageBase}home_vsl${suffix}.mp4`;

        return {
            vsl: {
                id: 'catastrophic',
                video_url: fallbackUrl,
                slug: 'home-vsl',
                headline: "VOCÊ AINDA PAGA PRA USAR O LOVABLE?",
                benefits_copy: null,
                method_explanation_copy: null,
                pricing_copy: null,
                guarantee_copy: null,
                name: 'Fallback',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            slug: "home-vsl",
            isActive: true,
            currency: region === 'USA' ? 'USD' : 'BRL'
        };
    }
};

export const getThankYouMedia = async (): Promise<{ videoUrl: string | null, bannerUrl: string | null }> => {
    try {
        const region = getRegionByDomain();
        const suffix = region === 'USA' ? '_usa' : '_br';
        console.log(`[THANKYOU-SERVICE] Buscando Mídias | Região: ${region} | Host: ${window.location.hostname}`);

        let videoUrl: string | null = null;
        let bannerUrl: string | null = null;

        // --- 1. BUSCA VÍDEO (Upsell) ---
        // Tenta Regional > Global

        const videoKeys = [`thankyou_upsell${suffix}`, 'thankyou_upsell'];

        for (const key of videoKeys) {
            const { data } = await db.from("vsl_video").select("video_url").eq("page_key", key).maybeSingle();
            if (data?.video_url) {
                console.log(`[THANKYOU-SERVICE] Vídeo encontrado (${key}):`, data.video_url);
                videoUrl = data.video_url;
                break;
            }
        }

        if (!videoUrl) {
            console.warn(`[THANKYOU-SERVICE] NENHUM vídeo encontrado no banco. Tentando URL direta do Storage (Blind Fallback).`);
            // Construir URL baseada no padrão do bucket 'videos/vsl/'
            const storageBase = "https://eidcxqxjmraargwhrdai.supabase.co/storage/v1/object/public/videos/vsl/";

            // Se estou no BR, tento thankyou_upsell_br.mp4
            const fallbackKey = `thankyou_upsell${suffix}`;
            videoUrl = `${storageBase}${fallbackKey}.mp4`;

            console.log(`[THANKYOU-SERVICE] URL Construída (Fallback): ${videoUrl}`);
        }

        // --- 2. BUSCA BANNER ---
        // Tenta Regional > Global
        const bannerKeys = [`thankyou_banner${suffix}`, 'thankyou_banner'];

        for (const key of bannerKeys) {
            const { data } = await db.from("banner_images").select("image_url").eq("page_key", key).maybeSingle();
            if (data?.image_url) {
                console.log(`[THANKYOU-SERVICE] Banner encontrado (${key}):`, data.image_url);
                bannerUrl = data.image_url;
                break;
            }
        }

        return { videoUrl, bannerUrl };

    } catch (error) {
        console.error("[THANKYOU-SERVICE] Erro crítico:", error);
        // Fallback de emergência (Catastrófico) - Tenta o Upsell Global
        return {
            videoUrl: "https://eidcxqxjmraargwhrdai.supabase.co/storage/v1/object/public/videos/vsl/thankyou_upsell.mp4",
            bannerUrl: null
        };
    }
}

export const getCurrentVSLSlug = async (): Promise<string> => "home-vsl";
