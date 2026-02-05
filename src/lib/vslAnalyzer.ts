
export interface VSLElement {
    type: 'scarcity' | 'hero' | 'video' | 'cta';
    text?: string;
    subText?: string;
    value?: number; // Para ofertas
    order: number;
    color: string; // 'red' | 'purple' | 'blue' | 'green'
}

export interface VSLAnalysisResult {
    elements: VSLElement[];
    ticketAverage: number;
    totalOffers: number;
}

/**
 * Analisa a estrutura de uma VSL (Home ou Thank You)
 * identificando elementos visuais e ofertas.
 */
export async function analyzeVSL(vslType: 'home' | 'thankyou'): Promise<VSLAnalysisResult> {
    try {
        // 1. Determinar URL correta
        const path = vslType === 'home' ? '/' : '/thankyou';
        const url = `${window.location.origin}${path}`;

        console.log(`[VSL ANALYZER] Analisando URL: ${url}`);

        // 2. Fetch do HTML real da página
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Falha ao carregar VSL: ${response.statusText}`);

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // 3. Identificar Elementos
        const elements: VSLElement[] = [];
        let orderCounter = 1;

        // --- A. SCARCITY BAR ---
        // Procura por elementos comuns de barra de escassez
        const scarcitySelectors = ['.scarcity-bar', '[class*="scarcity"]', '[class*="countdown"]', '.bg-red-600', '.bg-red-700'];
        let scarcityFound = false;

        for (const selector of scarcitySelectors) {
            const el = doc.querySelector(selector);
            // Verifica se é um elemento de topo e tem texto
            if (el && el.textContent && el.textContent.length > 5 && !scarcityFound) {
                elements.push({
                    type: 'scarcity',
                    text: el.textContent.substring(0, 50) + (el.textContent.length > 50 ? '...' : ''),
                    order: orderCounter++,
                    color: 'red'
                });
                scarcityFound = true;
                break;
            }
        }

        // --- B. HERO SECTION ---
        const h1 = doc.querySelector('h1');
        if (h1) {
            // Tenta achar subtítulo próximo
            let subText = '';
            let nextEl = h1.nextElementSibling;
            if (nextEl && (nextEl.tagName === 'P' || nextEl.tagName === 'H2')) {
                subText = nextEl.textContent || '';
            }

            elements.push({
                type: 'hero',
                text: h1.textContent || 'Título Principal',
                subText: subText.substring(0, 60) + (subText.length > 60 ? '...' : ''),
                order: orderCounter++,
                color: 'purple'
            });
        }

        // --- C. VIDEO PLAYER ---
        const videoSelectors = ['video', 'iframe[src*="youtube"]', 'iframe[src*="vimeo"]', 'iframe[src*="panda"]', '.aspect-video'];
        for (const selector of videoSelectors) {
            if (doc.querySelector(selector)) {
                elements.push({
                    type: 'video',
                    text: '[ PLAYER DE VÍDEO DETECTADO ]',
                    order: orderCounter++,
                    color: 'blue'
                });
                break; // Assume 1 vídeo principal no topo
            }
        }

        // --- D. BOTÕES CTA ---
        const ctaSelectors = ['button', 'a[href*="checkout"]', 'a[href*="pay"]', '.btn-cta', '[class*="button"]'];
        const foundCTAs = new Set<string>(); // Evitar duplicatas exatas
        const buttons = Array.from(doc.querySelectorAll(ctaSelectors.join(',')));

        const offers: number[] = [];

        buttons.forEach((btn) => {
            const text = btn.textContent?.trim() || '';
            const href = btn.getAttribute('href') || '';

            // Filtros para ignorar botões de navegação/admin
            if (text.length < 3 || text.includes('Admin') || text.includes('Login') || foundCTAs.has(text)) return;

            // Se for um link e não tiver cara de checkout, ignora (exceto se tiver classe explícita)
            const isExplicitCTA = btn.className.includes('cta') || btn.className.includes('checkout') || btn.className.includes('pulse');
            if (btn.tagName === 'A' && !href.includes('http') && !isExplicitCTA) return;

            // Extrair Valor
            const value = extractOfferValue(btn);
            if (value) offers.push(value);

            elements.push({
                type: 'cta',
                text: text.substring(0, 40),
                value: value || undefined,
                order: orderCounter++,
                color: 'green'
            });

            foundCTAs.add(text);
        });

        // 4. Calcular Ticket Médio
        const ticketAverage = calculateTicket(offers);

        return {
            elements,
            ticketAverage,
            totalOffers: offers.length
        };

    } catch (error) {
        console.error('[VSL ANALYZER] Erro crítico:', error);
        return {
            elements: [],
            ticketAverage: 0,
            totalOffers: 0
        };
    }
}

/**
 * Extrai valor monetário (R$ XX,XX) de um elemento ou vizinhos próximos
 */
export function extractOfferValue(element: Element): number | null {
    const moneyRegex = /R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/i;

    // 1. Busca no próprio texto do botão
    let match = element.textContent?.match(moneyRegex);

    // 2. Se não achar, busca no elemento pai (ex: div.pricing-card > button)
    if (!match && element.parentElement) {
        match = element.parentElement.textContent?.match(moneyRegex);
    }

    // 3. Se ainda não achar, busca no avô (ex: section > div > button)
    if (!match && element.parentElement?.parentElement) {
        match = element.parentElement.parentElement.textContent?.match(moneyRegex);
    }

    if (match) {
        // Converte "1.234,56" para 1234.56
        const valueStr = match[1].replace('.', '').replace(',', '.');
        return parseFloat(valueStr);
    }

    return null;
}

/**
 * Calcula média aritmética dos valores encontrados
 */
export function calculateTicket(offers: number[]): number {
    if (offers.length === 0) return 0;
    const sum = offers.reduce((acc, val) => acc + val, 0);
    return parseFloat((sum / offers.length).toFixed(2));
}
