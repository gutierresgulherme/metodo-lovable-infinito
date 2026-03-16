// ==========================================
// UTMIFY ONLY ANALYTICS (PURIFIED)
// ==========================================

const getUtmify = () => (window as any).Utmify || (window as any).__utmify || (window as any).utmify;

export const trackButtonClick = async (buttonId: string): Promise<void> => {
    try {
        const utmify = getUtmify();
        if (utmify && utmify.track) {
            utmify.track('click', { button_id: buttonId });
            console.log(\"[UTMIFY] Click tracked:\", buttonId);
        }
    } catch (error) {
        console.error(\"[Analytics] UTMify track error:\", error);
    }
};

export const trackVideoEvent = async (
    eventType: \"play\" | \"pause\" | \"progress\" | \"ended\",
    currentTimeSeconds: number,
    durationSeconds: number
): Promise<void> => {
    try {
        const utmify = getUtmify();
        if (utmify && utmify.track) {
            const percent = durationSeconds > 0 ? Math.round((currentTimeSeconds / durationSeconds) * 100) : 0;
            utmify.track('video_' + eventType, { 
                current_time: Math.round(currentTimeSeconds),
                percent: percent 
            });
            console.log(\"[UTMIFY] Video event:\", eventType, percent + \"%\");
        }
    } catch (error) {
        console.error(\"[Analytics] Video track error:\", error);
    }
};

export const initPageSession = async (): Promise<void> => {
    // UTMify scripts in index.html handle this automatically
    console.log(\"[Analytics] Page session handled by UTMify SDK\");
};

export const setupButtonTracking = (): void => {
    if ((window as any)._trackingInitialized) return;
    document.addEventListener(\"click\", (event) => {
        const target = event.target as HTMLElement;
        const button = target.closest(\"[id^='btn-comprar-']\");
        if (button) {
            const buttonId = button.getAttribute(\"id\");
            if (buttonId) trackButtonClick(buttonId);
        }
    }, true);
    (window as any)._trackingInitialized = true;
};

// Mock para evitar erros no AdminDashboard
export const fetchAnalyticsData = async (): Promise<any> => {
    return {
        buttonClicks: [],
        videoRetention: [],
        totalSessions: 0,
        totalClicks: 0,
        ctr: 0,
        topUtmSources: [],
    };
};
