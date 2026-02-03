// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabasePublic } from "@/integrations/supabase/client";

// Tipos simplificados
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

// Helper para acessar tabelas
const db = supabasePublic as any;

// Buscar VSL ativa (Simplificado: apenas do slot 'home_vsl')
export interface ActiveVSLInfo {
    vsl: VSLVariant | null;
    slug: string;
    isActive: boolean;
    currency: string;
}

export const getCurrentVSLInfo = async (): Promise<ActiveVSLInfo> => {
    try {
        console.log("[VSL] Início da busca de vídeo. Client URL:", (supabasePublic as any).supabaseUrl);

        // Tentativa 1: Busca por page_key 'home_vsl' (Padrão Novo)
        let { data: videoData, error } = await db.from("vsl_video")
            .select("*")
            .eq("page_key", "home_vsl")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("[VSL] Erro na consulta 1 (page_key):", error);
        }

        // Tentativa 2: Fallback - Pega o vídeo mais recente independente da chave
        if (!videoData) {
            console.log("[VSL] Fallback: Buscando qualquer vídeo disponível...");
            const { data: fallbackData } = await db.from("vsl_video")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            videoData = fallbackData;
        }

        if (videoData && videoData.video_url) {
            console.log("[VSL] Sucesso! Vídeo encontrado:", videoData.video_url);
            const vsl: VSLVariant = {
                id: videoData.id,
                name: "Vídeo Principal",
                slug: "home-vsl",
                video_url: videoData.video_url,
                headline: "VOCÊ AINDA PAGA PRA USAR O LOVABLE?",
                benefits_copy: null,
                method_explanation_copy: null,
                pricing_copy: null,
                guarantee_copy: null,
                created_at: videoData.created_at,
                updated_at: videoData.created_at
            };

            return { vsl, slug: "home-vsl", isActive: true, currency: "BRL" };
        }

        console.warn("[VSL] Nenhum registro encontrado na tabela vsl_video.");
        return { vsl: null, slug: "default", isActive: true, currency: "BRL" };
    } catch (e) {
        console.error("[VSL] Erro crítico no service:", e);
        return { vsl: null, slug: "default", isActive: true, currency: "BRL" };
    }
};

// Mantido para compatibilidade
export const getCurrentVSLSlug = async (): Promise<string> => "home-vsl";
export const getRegionByDomain = () => "BR";
