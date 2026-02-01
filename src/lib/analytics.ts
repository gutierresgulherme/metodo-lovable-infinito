import { supabase } from "@/integrations/supabase/client";

// Mapeamento de IDs de botões para labels legíveis
const BUTTON_LABELS: Record<string, string> = {
    "btn-comprar-13-1": "Plano Prata - Abaixo do Vídeo",
    "btn-comprar-24-1": "Plano Gold - Seção Bônus",
    "btn-comprar-24-2": "Plano Gold - Tabela de Preços",
    "btn-comprar-13-2": "Plano Prata - Tabela de Preços",
};

// Gerar ou recuperar session ID
export const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem("vsl_session_id");
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem("vsl_session_id", sessionId);
    }
    return sessionId;
};

// Capturar parâmetros UTM da URL
export const getUtmParams = (): Record<string, string> => {
    const params = new URLSearchParams(window.location.search);
    return {
        utm_source: params.get("utm_source") || "",
        utm_medium: params.get("utm_medium") || "",
        utm_campaign: params.get("utm_campaign") || "",
        utm_content: params.get("utm_content") || "",
        utm_term: params.get("utm_term") || "",
    };
};

// Registrar clique em botão
export const trackButtonClick = async (buttonId: string): Promise<void> => {
    try {
        const sessionId = getSessionId();
        const utms = getUtmParams();
        const buttonLabel = BUTTON_LABELS[buttonId] || buttonId;

        await supabase.from("button_clicks").insert({
            button_id: buttonId,
            button_label: buttonLabel,
            page_url: window.location.href,
            session_id: sessionId,
            ...utms,
        });

        console.log("[Analytics] Button click tracked:", buttonId);
    } catch (error) {
        console.error("[Analytics] Error tracking button click:", error);
    }
};

// Registrar evento de vídeo
export const trackVideoEvent = async (
    eventType: "play" | "pause" | "progress" | "ended",
    currentTimeSeconds: number,
    durationSeconds: number
): Promise<void> => {
    try {
        const sessionId = getSessionId();
        const percentWatched = durationSeconds > 0
            ? Math.round((currentTimeSeconds / durationSeconds) * 100)
            : 0;

        await supabase.from("video_watch_events").insert({
            session_id: sessionId,
            video_id: "vsl_main",
            event_type: eventType,
            current_time_seconds: Math.round(currentTimeSeconds),
            duration_seconds: Math.round(durationSeconds),
            percent_watched: percentWatched,
        });

        console.log("[Analytics] Video event tracked:", eventType, `${percentWatched}%`);
    } catch (error) {
        console.error("[Analytics] Error tracking video event:", error);
    }
};

// Iniciar sessão de página
export const initPageSession = async (): Promise<void> => {
    try {
        const sessionId = getSessionId();
        const utms = getUtmParams();

        // Verificar se sessão já existe
        const { data: existing } = await supabase
            .from("page_sessions")
            .select("id")
            .eq("session_id", sessionId)
            .maybeSingle();

        if (!existing) {
            await supabase.from("page_sessions").insert({
                session_id: sessionId,
                page_url: window.location.href,
                referrer: document.referrer || null,
                user_agent: navigator.userAgent,
                ...utms,
            });
            console.log("[Analytics] Page session started:", sessionId);
        } else {
            // Atualizar última atividade
            await supabase
                .from("page_sessions")
                .update({ last_activity_at: new Date().toISOString() })
                .eq("session_id", sessionId);
        }
    } catch (error) {
        console.error("[Analytics] Error initializing page session:", error);
    }
};

// Hook para adicionar tracking a um botão
export const setupButtonTracking = (): void => {
    const buttons = document.querySelectorAll("[id^='btn-comprar-']");

    buttons.forEach((button) => {
        const buttonId = button.getAttribute("id");
        if (buttonId && !button.getAttribute("data-tracking-attached")) {
            button.addEventListener("click", () => {
                trackButtonClick(buttonId);
            });
            button.setAttribute("data-tracking-attached", "true");
        }
    });
};

// Tipo para dados de analytics
export interface AnalyticsData {
    buttonClicks: Array<{
        button_id: string;
        button_label: string;
        count: number;
    }>;
    videoRetention: Array<{
        percent: number;
        sessions: number;
    }>;
    totalSessions: number;
    totalClicks: number;
    ctr: number;
    topUtmSources: Array<{
        source: string;
        count: number;
    }>;
}

// Buscar dados de analytics (para o dashboard)
export const fetchAnalyticsData = async (
    startDate?: Date,
    endDate?: Date
): Promise<AnalyticsData> => {
    try {
        const start = startDate?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const end = endDate?.toISOString() || new Date().toISOString();

        // Buscar cliques por botão
        const { data: clicksRaw } = await supabase
            .from("button_clicks")
            .select("button_id, button_label")
            .gte("created_at", start)
            .lte("created_at", end);

        // Agrupar cliques por botão
        const clicksByButton: Record<string, { label: string; count: number }> = {};
        clicksRaw?.forEach((click) => {
            if (!clicksByButton[click.button_id]) {
                clicksByButton[click.button_id] = {
                    label: click.button_label || click.button_id,
                    count: 0,
                };
            }
            clicksByButton[click.button_id].count++;
        });

        const buttonClicks = Object.entries(clicksByButton).map(([id, data]) => ({
            button_id: id,
            button_label: data.label,
            count: data.count,
        }));

        // Buscar eventos de vídeo para retenção
        const { data: videoEvents } = await supabase
            .from("video_watch_events")
            .select("session_id, percent_watched, event_type")
            .gte("created_at", start)
            .lte("created_at", end);

        // Calcular retenção: máximo percent_watched por sessão
        const maxPercentBySession: Record<string, number> = {};
        videoEvents?.forEach((event) => {
            const current = maxPercentBySession[event.session_id] || 0;
            if ((event.percent_watched || 0) > current) {
                maxPercentBySession[event.session_id] = event.percent_watched || 0;
            }
        });

        // Agrupar em buckets de 10%
        const retentionBuckets: Record<number, number> = {};
        for (let i = 0; i <= 100; i += 10) {
            retentionBuckets[i] = 0;
        }

        Object.values(maxPercentBySession).forEach((percent) => {
            // Contar quantas sessões chegaram ATÉ cada ponto
            for (let bucket = 0; bucket <= 100; bucket += 10) {
                if (percent >= bucket) {
                    retentionBuckets[bucket]++;
                }
            }
        });

        const videoRetention = Object.entries(retentionBuckets).map(([percent, sessions]) => ({
            percent: parseInt(percent),
            sessions,
        }));

        // Total de sessões
        const { count: totalSessions } = await supabase
            .from("page_sessions")
            .select("id", { count: "exact", head: true })
            .gte("started_at", start)
            .lte("started_at", end);

        // Total de cliques
        const totalClicks = clicksRaw?.length || 0;

        // CTR
        const ctr = totalSessions && totalSessions > 0
            ? Math.round((totalClicks / totalSessions) * 10000) / 100
            : 0;

        // Top UTM sources
        const { data: sessionsWithUtm } = await supabase
            .from("page_sessions")
            .select("utm_source")
            .gte("started_at", start)
            .lte("started_at", end)
            .not("utm_source", "is", null)
            .not("utm_source", "eq", "");

        const utmCounts: Record<string, number> = {};
        sessionsWithUtm?.forEach((s) => {
            if (s.utm_source) {
                utmCounts[s.utm_source] = (utmCounts[s.utm_source] || 0) + 1;
            }
        });

        const topUtmSources = Object.entries(utmCounts)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            buttonClicks,
            videoRetention,
            totalSessions: totalSessions || 0,
            totalClicks,
            ctr,
            topUtmSources,
        };
    } catch (error) {
        console.error("[Analytics] Error fetching analytics data:", error);
        return {
            buttonClicks: [],
            videoRetention: [],
            totalSessions: 0,
            totalClicks: 0,
            ctr: 0,
            topUtmSources: [],
        };
    }
};
