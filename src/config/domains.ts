/**
 * CONFIGURAÇÃO CENTRALIZADA DE DOMÍNIOS
 * =====================================
 *
 * Arquivo: src/config/domains.ts
 *
 * Este arquivo centraliza TODA a configuração de domínios do seu projeto.
 * Qualquer novo domínio deve ser adicionado aqui.
 *
 * Benefícios:
 * - Sem hardcoding espalhado pelo código
 * - Fácil adicionar novos domínios
 * - Type-safe com TypeScript
 * - Single source of truth
 */

export const DOMAIN_CONFIG = {
  'lovable-app.vip': {
    region: 'USA',
    pixelId: '697269d827f998dc679f772f',
    currency: 'USD',
    timezone: 'America/New_York',
    apiEndpoint: 'https://api.lovable-app.vip',
    bm: 'BM_USA_01', // Identificador da Banca de Marketing
  },
  'metodo-lovable-infinito.vip': {
    region: 'BR',
    pixelId: '694193c8edf1b9da77b48e2b',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    apiEndpoint: 'https://api.metodo-lovable-infinito.vip',
    bm: 'BM_BR_01',
  },
  // ============================================
  // ADICIONAR NOVOS DOMÍNIOS ABAIXO
  // ============================================
  // 'seu-novo-dominio.vip': {
  //   region: 'NOVA_REGIAO',
  //   pixelId: 'NOVO_PIXEL_ID',
  //   currency: 'NOVA_MOEDA',
  //   timezone: 'Timezone/Correto',
  //   apiEndpoint: 'https://api.seu-novo-dominio.vip',
  //   bm: 'BM_NOVA_01',
  // },
} as const;

// ============================================
// TIPOS E INTERFACES
// ============================================

export type DomainKey = keyof typeof DOMAIN_CONFIG;
export type DomainConfig = (typeof DOMAIN_CONFIG)[DomainKey];

export interface DomainInfo {
  key: DomainKey;
  config: DomainConfig;
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Retorna a configuração completa do domínio atual
 * @throws Error se domínio não estiver configurado
 */
export const getDomainConfig = (): DomainConfig => {
  const hostname = window.location.hostname;
  
  // Suporte a localhost/dev
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return DOMAIN_CONFIG['metodo-lovable-infinito.vip']; // Default for dev
  }

  const config = DOMAIN_CONFIG[hostname as DomainKey];

  if (!config) {
    console.error(`❌ Domínio não configurado: ${hostname}`);
    console.error('Domínios disponíveis:', Object.keys(DOMAIN_CONFIG));
    // Fallback instead of throwing
    return DOMAIN_CONFIG['metodo-lovable-infinito.vip'];
  }

  return config;
};

/**
 * Retorna a informação completa do domínio (chave + config)
 */
export const getDomainInfo = (): DomainInfo => {
  const hostname = window.location.hostname;
  return {
    key: hostname as DomainKey,
    config: getDomainConfig(),
  };
};

/**
 * Retorna apenas a região do domínio atual
 * @example 'USA' | 'BR'
 */
export const getRegionByDomain = (): string => {
  return getDomainConfig().region;
};

/**
 * Retorna apenas o Pixel ID do domínio atual
 */
export const getPixelId = (): string => {
  return getDomainConfig().pixelId;
};

/**
 * Retorna apenas a moeda do domínio atual
 * @example 'USD' | 'BRL'
 */
export const getCurrency = (): string => {
  return getDomainConfig().currency;
};

/**
 * Retorna o timezone do domínio atual
 */
export const getTimezone = (): string => {
  return getDomainConfig().timezone;
};

/**
 * Retorna o endpoint da API do domínio atual
 */
export const getApiEndpoint = (): string => {
  return getDomainConfig().apiEndpoint;
};

/**
 * Retorna o identificador da Banca de Marketing
 */
export const getBM = (): string => {
  return getDomainConfig().bm;
};

// ============================================
// VERIFICAÇÕES E HELPERS
// ============================================

/**
 * Verifica se o domínio está configurado
 */
export const isDomainConfigured = (): boolean => {
  try {
    const hostname = window.location.hostname;
    return !!DOMAIN_CONFIG[hostname as DomainKey];
  } catch {
    return false;
  }
};

/**
 * Retorna lista de todos os domínios configurados
 */
export const getAllConfiguredDomains = (): DomainKey[] => {
  return Object.keys(DOMAIN_CONFIG) as DomainKey[];
};

/**
 * Retorna configuração para um domínio específico
 */
export const getConfigForDomain = (domain: DomainKey): DomainConfig | null => {
  return DOMAIN_CONFIG[domain] || null;
};

/**
 * Log com informações do domínio (útil para debugging)
 */
export const logDomainInfo = (): void => {
  try {
    const info = getDomainInfo();
    console.log('📍 Domain Configuration:', {
      hostname: window.location.hostname,
      key: info.key,
      ...info.config,
    });
  } catch (error) {
    console.error('❌ Erro ao obter informações do domínio:', error);
  }
};

// ============================================
// INICIALIZAÇÃO (Executar ao carregar)
// ============================================

// Validar domínio assim que o módulo carrega
if (typeof window !== 'undefined') {
  try {
    logDomainInfo();
    // Expor globalmente para facilitar o teste no console (opcional)
    (window as any).getRegionByDomain = getRegionByDomain;
    (window as any).getDomainConfig = getDomainConfig;
  } catch (error) {
    console.error('⚠️ Domínio não está configurado corretamente!', error);
  }
}

export default {
  DOMAIN_CONFIG,
  getDomainConfig,
  getDomainInfo,
  getRegionByDomain,
  getPixelId,
  getCurrency,
  getTimezone,
  getApiEndpoint,
  getBM,
  isDomainConfigured,
  getAllConfiguredDomains,
  getConfigForDomain,
  logDomainInfo,
};
