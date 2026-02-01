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
    status: "draft" | "active" | "paused" | "winner";
    is_control: boolean;
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
    status?: "draft" | "active" | "paused" | "winner";
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

// Buscar métricas de uma VSL
export const getVSLMetrics = async (vslId: string): Promise<{ sessions: number; clicks: number; ctr: number }> => {
    try {
        // Buscar sessões
        const { count: sessions } = await db
            .from("page_sessions")
            .select("id", { count: "exact", head: true })
            .eq("vsl_id", vslId);

        // Buscar cliques
        const { count: clicks } = await db
            .from("button_clicks")
            .select("id", { count: "exact", head: true })
            .eq("vsl_id", vslId);

        const sessionsCount = sessions || 0;
        const clicksCount = clicks || 0;
        const ctr = sessionsCount > 0 ? Math.round((clicksCount / sessionsCount) * 10000) / 100 : 0;

        return { sessions: sessionsCount, clicks: clicksCount, ctr };
    } catch (error) {
        console.error("[VSL] Error fetching metrics:", error);
        return { sessions: 0, clicks: 0, ctr: 0 };
    }
};

// Listar VSLs com métricas
export const listVSLsWithMetrics = async (): Promise<VSLVariantWithMetrics[]> => {
    const vsls = await listVSLs();

    const vslsWithMetrics = await Promise.all(
        vsls.map(async (vsl) => {
            const metrics = await getVSLMetrics(vsl.id);
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

// Detectar VSL ativa da URL
export const getCurrentVSLSlug = (): string => {
    if (typeof window === "undefined") return "default";
    const params = new URLSearchParams(window.location.search);
    return params.get("vsl") || "default";
};
