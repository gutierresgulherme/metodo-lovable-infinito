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

        let { data: videoData, error: regError } = await db.from("vsl_video")
            .select("*")
            .eq("page_key", regionalKey)
            .maybeSingle();

        if (regError) console.error("[VSL] Erro na busca regional:", regError.message);

        // 2. FALLBACK 1: TENTA VÍDEO GLOBAL (EX: home_vsl)
        if (!videoData) {
            console.log(`[VSL] Sem vídeo regional, buscando global: home_vsl`);
            const { data: globalData, error: globError } = await db.from("vsl_video")
                .select("*")
                .eq("page_key", "home_vsl")
                .maybeSingle();
            videoData = globalData;
            if (globError) console.error("[VSL] Erro na busca global:", globError.message);
        }

        // 3. FALLBACK 2: TENTA QUALQUER VÍDEO DO BANCO (ULTRA FALLBACK)
        if (!videoData) {
            console.log(`[VSL] Sem vídeo global, buscando QUALQUER registro...`);
            const { data: anyVideo, error: anyError } = await db.from("vsl_video")
                .select("*")
                .limit(1)
                .maybeSingle();
            videoData = anyVideo;
            if (anyError) console.error("[VSL] Erro no ultra fallback:", anyError.message);
        }

        // 4. SE AINDA NÃO ACHOU NADA (Banco Vazio ou Bloqueado), USA URL DE EMERGÊNCIA
        if (!videoData) {
            console.warn("[VSL] NADA ENCONTRADO NO BANCO. Usando URL de redundância máxima.");
            const vsl: VSLVariant = {
                id: "fallback",
                name: "Vídeo de Emergência",
                slug: "home-vsl",
                video_url: "https://eidcxqxjmraargwhrdai.supabase.co/storage/v1/object/public/videos/vsl/home_vsl.mp4",
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
        return { vsl: null, slug: "default", isActive: true, currency: region === 'USA' ? 'USD' : 'BRL' };
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
        // Tenta Regional > Global > Qualquer > Fallback
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
            console.log(`[THANKYOU-SERVICE] Vídeo não encontrado por chave, tentando qualquer um...`);
            const { data } = await db.from("vsl_video").select("video_url").limit(1).maybeSingle();
            if (data?.video_url) videoUrl = data.video_url;
        }

        if (!videoUrl) {
            console.warn(`[THANKYOU-SERVICE] NENHUM vídeo encontrado no banco. Tentando URL direta do Storage (Blind Fallback).`);
            // Construir URL baseada no padrão do bucket 'videos/vsl/'
            const storageBase = "https://eidcxqxjmraargwhrdai.supabase.co/storage/v1/object/public/videos/vsl/";

            // Tenta usar a chave regional (upsell BR ou USA) como nome do arquivo
            // Se o usuário fez upload no Admin, o arquivo tem esse nome.
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
        return {
            videoUrl: "https://eidcxqxjmraargwhrdai.supabase.co/storage/v1/object/public/videos/vsl/home_vsl.mp4",
            bannerUrl: null
        };
    }
}

export const getCurrentVSLSlug = async (): Promise<string> => "home-vsl";
