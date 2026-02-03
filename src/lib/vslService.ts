// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from "@/integrations/supabase/client";

// Chave do localStorage para VSL Principal
const PRIMARY_VSL_KEY = "primary_vsl_slug";

// Getter/Setter para VSL Principal
export const getPrimaryVSLSlug = (): string => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem(PRIMARY_VSL_KEY) || "default";
};

export const setPrimaryVSLSlug = (slug: string): void => {
    localStorage.setItem(PRIMARY_VSL_KEY, slug);
};

// Tipos
export interface VSLVariant {
    id: string;
    name: string;
    slug: string;
    book_reference: string | null;
    description: string | null;
    headline: string | null;
    hero_subheadline: string | null;
    video_url: string | null;
    benefits_copy: string | null;
    method_explanation_copy: string | null;
    pricing_copy: string | null;
    guarantee_copy: string | null;
    faq_copy: any | null;
    status: "draft" | "active" | "paused" | "winner";
    is_control: boolean;
    is_template: boolean;
    created_at: string;
    updated_at: string;
}

export interface VSLVariantWithMetrics extends VSLVariant {
    sessions: number;
    clicks: number;
    ctr: number;
}

export interface CreateVSLInput {
    name: string;
    slug: string;
    book_reference?: string;
    description?: string;
    headline?: string;
    hero_subheadline?: string;
    video_url?: string;
    benefits_copy?: string;
    method_explanation_copy?: string;
    pricing_copy?: string;
    guarantee_copy?: string;
    faq_copy?: any;
    status?: "draft" | "active" | "paused" | "winner";
    is_template?: boolean;
}

// Lista de livros de referência
export const BOOK_REFERENCES = [
    { value: "expert-secrets", label: "Expert Secrets - Russell Brunson" },
    { value: "dotcom-secrets", label: "DotCom Secrets - Russell Brunson" },
    { value: "traffic-secrets", label: "Traffic Secrets - Russell Brunson" },
    { value: "breakthrough-advertising", label: "Breakthrough Advertising - Eugene Schwartz" },
    { value: "boron-letters", label: "The Boron Letters - Gary Halbert" },
    { value: "influence", label: "Influence - Robert Cialdini" },
    { value: "ogilvy-advertising", label: "Ogilvy on Advertising - David Ogilvy" },
    { value: "cashvertising", label: "Cashvertising - Drew Eric Whitman" },
    { value: "persuasao", label: "As Armas da Persuasão - Robert Cialdini" },
    { value: "os-codigos-do-milhao", label: "Os Códigos do Milhão - Pablo Marçal" },
    { value: "original", label: "Original / Próprio" },
];

// Helper para acessar tabelas que ainda não estão nos tipos
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Buscar VSL pelo slug
export const getVSLBySlug = async (slug: string): Promise<VSLVariant | null> => {
    const { data, error } = await db
        .from("vsl_variants")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    if (error) {
        console.error("[VSL] Error fetching VSL by slug:", error);
        return null;
    }

    return data as VSLVariant;
};

// Buscar VSL ID pelo slug (para tracking)
export const getVSLIdBySlug = async (slug: string): Promise<string | null> => {
    const vsl = await getVSLBySlug(slug);
    return vsl?.id || null;
};

// Listar todas as VSLs
export const listVSLs = async (): Promise<VSLVariant[]> => {
    const { data, error } = await db
        .from("vsl_variants")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[VSL] Error listing VSLs:", error);
        return [];
    }

    return (data || []) as VSLVariant[];
};

// Criar nova VSL
export const createVSL = async (input: CreateVSLInput): Promise<VSLVariant | null> => {
    const { data, error } = await db
        .from("vsl_variants")
        .insert({
            ...input,
            status: input.status || "draft",
        })
        .select()
        .single();

    if (error) {
        console.error("[VSL] Error creating VSL:", error);
        return null;
    }

    return data as VSLVariant;
};

// Atualizar VSL
export const updateVSL = async (id: string, input: Partial<CreateVSLInput>): Promise<boolean> => {
    const { error } = await db
        .from("vsl_variants")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        console.error("[VSL] Error updating VSL:", error);
        return false;
    }

    return true;
};

// Deletar VSL
export const deleteVSL = async (id: string): Promise<boolean> => {
    const { error } = await db
        .from("vsl_variants")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("[VSL] Error deleting VSL:", error);
        return false;
    }

    return true;
};

// Buscar métricas de uma VSL (Opcionalmente filtrada por região)
export const getVSLMetrics = async (vslId: string, domain?: string): Promise<{ sessions: number; clicks: number; ctr: number }> => {
    try {
        let sessionQuery = db
            .from("page_sessions")
            .select("id", { count: "exact", head: true })
            .eq("vsl_slug", (await getVSLById(vslId))?.slug); // Fallback logic might be needed if vsl_slug is not consistent

        // Workaround: We should use vsl_slug for tracking, but previous impl used vsl_id in some places
        // New structure prefers vsl_slug in page_sessions

        // Let's refine based on the new schema which adds vsl_slug column
        // If vslId is UUID, we first get the slug
        const vsl = await getVSLById(vslId);
        if (!vsl) return { sessions: 0, clicks: 0, ctr: 0 };

        sessionQuery = db.from("page_sessions").select("id", { count: "exact", head: true }).eq("vsl_slug", vsl.slug);
        let clickQuery = db.from("button_clicks").select("id", { count: "exact", head: true }).eq("vsl_slug", vsl.slug);


        // Filtrar por domínio se especificado
        if (domain) {
            sessionQuery = sessionQuery.eq("domain", domain);
            clickQuery = clickQuery.eq("domain", domain);
        }

        const { count: sessions } = await sessionQuery;
        const { count: clicks } = await clickQuery;

        const sessionsCount = sessions || 0;
        const clicksCount = clicks || 0;
        const ctr = sessionsCount > 0 ? Math.round((clicksCount / sessionsCount) * 10000) / 100 : 0;

        return { sessions: sessionsCount, clicks: clicksCount, ctr };
    } catch (error) {
        console.error("[VSL] Error fetching metrics:", error);
        return { sessions: 0, clicks: 0, ctr: 0 };
    }
};

const getVSLById = async (id: string): Promise<VSLVariant | null> => {
    const { data } = await db.from("vsl_variants").select("*").eq("id", id).single();
    return data;
}

// Listar VSLs com métricas (Opcionalmente filtradas por região)
export const listVSLsWithMetrics = async (domain?: string): Promise<VSLVariantWithMetrics[]> => {
    const vsls = await listVSLs();

    const vslsWithMetrics = await Promise.all(
        vsls.map(async (vsl) => {
            const metrics = await getVSLMetrics(vsl.id, domain);
            return { ...vsl, ...metrics };
        })
    );

    return vslsWithMetrics;
};

// Gerar slug a partir do nome
export const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
};

export interface VSLTestCenter {
    id: string;
    name: string;
    domain: string;
    active_vsl_id: string | null;
    vsl_slug: string | null; // Keep for backward compatibility
    status: "active" | "paused";
    currency?: string;
    created_at: string;
    updated_at: string;
    active_vsl?: VSLVariant; // Joined data
}

export interface CreateTestCenterInput {
    name: string;
    domain: string;
    vsl_slug?: string;
    active_vsl_id?: string;
    status?: "active" | "paused";
    currency?: string;
}

// Listar todos os centros de teste (domínios)
export const listTestCenters = async (): Promise<VSLTestCenter[]> => {
    const { data, error } = await db
        .from("vsl_test_centers")
        .select(`
            *,
            active_vsl:vsl_variants!active_vsl_id (*)
        `)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[VSL] Error listing test centers:", error);
        // Fallback if relation fails or doesn't exist yet
        const { data: fallbackData, error: fallbackError } = await db.from("vsl_test_centers").select("*");
        if (fallbackError) throw fallbackError;
        return fallbackData as VSLTestCenter[];
    }

    return (data || []) as VSLTestCenter[];
};

// Criar novo centro de teste
export const createTestCenter = async (input: CreateTestCenterInput): Promise<VSLTestCenter | null> => {
    const { data, error } = await db
        .from("vsl_test_centers")
        .insert({
            ...input,
            status: input.status || "active",
        })
        .select()
        .single();

    if (error) {
        console.error("[VSL] Error creating test center:", error);
        throw error; // Throw so the UI can catch it
    }

    return data as VSLTestCenter;
};

// Atualizar centro de teste
export const updateTestCenter = async (id: string, input: Partial<CreateTestCenterInput>): Promise<boolean> => {
    const { error } = await db
        .from("vsl_test_centers")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        console.error("[VSL] Error updating test center:", error);
        return false;
    }

    return true;
};

// Deletar centro de teste
export const deleteTestCenter = async (id: string): Promise<boolean> => {
    const { error } = await db
        .from("vsl_test_centers")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("[VSL] Error deleting test center:", error);
        return false;
    }

    return true;
};

// Buscar centro de teste pelo domínio
export const getTestCenterByDomain = async (domain: string): Promise<VSLTestCenter | null> => {
    const { data, error } = await db
        .from("vsl_test_centers")
        .select(`
            *,
            active_vsl:vsl_variants!active_vsl_id (*)
        `)
        .eq("domain", domain)
        .maybeSingle();

    if (error) {
        console.error("[VSL] Error fetching test center by domain:", error);
        return null;
    }

    return data as VSLTestCenter;
};

// Detectar região pelo domínio (Legado - Mantendo para compatibilidade)
export const getRegionByDomain = (): "BR" | "USA" => {
    if (typeof window === "undefined") return "BR";
    const hostname = window.location.hostname;
    if (hostname.includes("lovable-app.vip")) return "USA";
    if (hostname.includes("metodolovalbe.com") && !hostname.includes(".br")) return "USA";
    return "BR";
};

// Buscar slug da VSL ativa
export const getRegionVSL = async (region: "BR" | "USA"): Promise<string> => {
    return "default"; // Deprecated fallback
};

// Definir VSL ativa para uma região
export const setRegionVSL = async (region: "BR" | "USA", slug: string): Promise<boolean> => {
    return true; // Deprecated fallback
};

// Interface para retorno da VSL ativa com status
export interface ActiveVSLInfo {
    vsl: VSLVariant | null;
    slug: string;
    isActive: boolean;
    currency: string;
}

// Detectar VSL ativa da URL ou do Banco (por Domínio Dinâmico)
export const getCurrentVSLInfo = async (): Promise<ActiveVSLInfo> => {
    if (typeof window === "undefined") return { vsl: null, slug: "default", isActive: true, currency: "BRL" };

    // 1. URL Parameter (Highest Priority)
    const params = new URLSearchParams(window.location.search);
    const urlVslSlug = params.get("vsl");

    let targetSlug = "default";
    let activeVslObj: VSLVariant | null = null;
    let currency: string | null = null;
    let isActive = true;

    // A. Check URL
    if (urlVslSlug) {
        targetSlug = urlVslSlug;
        activeVslObj = await getVSLBySlug(targetSlug);
        console.log("[VSL] Using URL Param VSL:", targetSlug);
    }

    // B. Check Legacy Video (Admin Panel Upload) - HIGH PRIORITY
    // We check this here but might use it only if URL didn't specify one
    let legacyVsl: VSLVariant | null = null;
    try {
        const { data: legacyVideo } = await db.from("vsl_video").select("*").eq("page_key", "home_vsl").maybeSingle();
        if (legacyVideo) {
            legacyVsl = {
                id: legacyVideo.id || "legacy-id",
                name: "Vídeo Principal (Gestão de Mídias)",
                slug: "home-custom-video",
                video_url: legacyVideo.video_url,
                status: "active",
                is_template: false,
                headline: "VOCÊ AINDA PAGA PRA USAR O LOVABLE?",
                hero_subheadline: null,
                book_reference: null,
                description: "Vídeo carregado via painel de Gestão de Mídias",
                benefits_copy: null,
                method_explanation_copy: null,
                pricing_copy: null,
                guarantee_copy: null,
                faq_copy: null,
                is_control: false,
                created_at: legacyVideo.created_at || new Date().toISOString(),
                updated_at: legacyVideo.created_at || new Date().toISOString()
            } as VSLVariant;
        }
    } catch (e) {
        console.error("[VSL] Error checking legacy video slot", e);
    }

    // DECISION LOGIC
    if (activeVslObj) {
        // Fallback to legacy video if current variant has no URL
        if (!activeVslObj.video_url && legacyVsl?.video_url) {
            console.log("[VSL] Requested variant has no video, falling back to legacy video slot");
            activeVslObj.video_url = legacyVsl.video_url;
        }
    } else if (legacyVsl) {
        // Use Legacy/Admin Panel Upload
        console.log("[VSL] Using Legacy/Admin Video Slot (Priority)");
        activeVslObj = legacyVsl;
        targetSlug = legacyVsl.slug;
    } else {
        // C. Dynamic Domain Check (Test Centers)
        const hostname = window.location.hostname.replace('www.', '');
        let testCenter = await getTestCenterByDomain(hostname);

        // Developer Experience: If localhost and no domain found, pick the first one
        if (!testCenter && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('0.0.0.0'))) {
            // REMOVED AUTOMATIC FALLBACK TO PREVENT CONFUSION
            // We only fallback if strictly needed later
        }

        if (testCenter) {
            isActive = testCenter.status === "active";
            currency = testCenter.currency || "BRL";

            if (testCenter.active_vsl) {
                activeVslObj = testCenter.active_vsl;
                targetSlug = testCenter.active_vsl.slug;
            } else if (testCenter.vsl_slug) {
                targetSlug = testCenter.vsl_slug;
                activeVslObj = await getVSLBySlug(targetSlug);
            }
        }
    }

    // D. Global Fallbacks (if still nothing)
    if (!activeVslObj) {
        // Fallback 1: Template
        try {
            const { data: template } = await db.from("vsl_variants").select("*").eq("is_template", true).maybeSingle();
            if (template) {
                console.log("[VSL] Falling back to Template");
                activeVslObj = template as VSLVariant;
                targetSlug = template.slug;
            }
        } catch (e) { }

        // Fallback 2: Latest
        if (!activeVslObj) {
            try {
                const { data: latest } = await db.from("vsl_variants").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
                if (latest) {
                    console.log("[VSL] Falling back to Latest");
                    activeVslObj = latest as VSLVariant;
                    targetSlug = latest.slug;
                }
            } catch (e) { }
        }
    }

    // Update currency/active if not set by test center
    if (!currency) currency = (getRegionByDomain() === "USA" ? "USD" : "BRL");

    return {
        vsl: activeVslObj,
        slug: targetSlug,
        isActive: isActive,
        currency: currency
    };
};

// Manter getCurrentVSLSlug para evitar quebras imediatas
export const getCurrentVSLSlug = async (): Promise<string> => {
    const info = await getCurrentVSLInfo();
    return info.slug;
};
