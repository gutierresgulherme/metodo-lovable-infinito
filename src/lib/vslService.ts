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

        console.log(`[VSL] Detectado: Região ${region} | Moeda ${currency} | Host ${window.location.hostname}`);

        // 1. Tenta buscar o vídeo configurado
        const pageKey = region === 'USA' ? 'home_vsl_usa' : 'home_vsl';
        let { data: videoData, error } = await db.from("vsl_video")
            .select("*")
            .eq("page_key", pageKey)
            .maybeSingle();

        if (error) console.error("[VSL] Erro na busca por page_key:", error);

        // 2. Fallback: Qualquer vídeo se o específico da região não existir
        if (!videoData) {
            const { data: anyVideo } = await db.from("vsl_video")
                .select("*")
                .limit(1)
                .maybeSingle();
            videoData = anyVideo;
        }

        // 3. SE AINDA NÃO ACHOU NADA (Banco Vazio ou Bloqueado), USA URL PREVISÍVEL
        if (!videoData) {
            console.warn("[VSL] Banco vazio. Usando URL de emergência...");
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
            name: "Vídeo Principal",
            slug: "home-vsl",
            video_url: videoData.video_url,
            headline: videoData.headline || "VOCÊ AINDA PAGA PRA USAR O LOVABLE?",
            benefits_copy: null,
            method_explanation_copy: null,
            pricing_copy: null,
            guarantee_copy: null,
            created_at: videoData.created_at,
            updated_at: videoData.created_at
        };

        return { vsl, slug: "home-vsl", isActive: true, currency };
    } catch (e) {
        console.error("[VSL] Erro crítico no service:", e);
        const region = getRegionByDomain();
        const currency = region === 'USA' ? 'USD' : 'BRL';
        return { vsl: null, slug: "default", isActive: true, currency };
    }
};

export const getCurrentVSLSlug = async (): Promise<string> => "home-vsl";
