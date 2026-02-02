# 📋 AUDITORIA CONTÍNUA — VSL "Método Lovable Infinito"

> **Documento de rastreamento de todas as atualizações do projeto**  
> Iniciado em: **01 de Fevereiro de 2026**

---

## 📊 Resumo do Projeto

| Campo | Valor |
|-------|-------|
| **Nome** | Método Lovable Infinito (VSL de Vendas) |
| **Tipo** | Landing Page de VSL |
| **Stack** | React 18 + TypeScript + Vite + Tailwind + Supabase |
| **Status** | ✅ Produção Ativa |
| **URL Local** | http://localhost:8080 |

---

## 📁 Estrutura Atual do Projeto

```
metodo-lovable-infinito-main/
├── 📄 index.html              # HTML com pixel UTMify
├── 📄 package.json            # 67 dependências
├── 📄 .env                    # Variáveis Supabase
├── 📂 src/
│   ├── 📂 assets/             # 7 imagens
│   ├── 📂 components/         # 60 componentes (6 custom + 49 ui + 5 admin)
│   ├── 📂 hooks/              # 3 hooks
│   ├── 📂 integrations/       # Cliente Supabase
│   └── 📂 pages/              # 6 páginas
├── 📂 supabase/
│   ├── 📂 functions/          # 9 Edge Functions
│   └── 📂 migrations/         # 8 migrações
└── 📂 public/                 # Assets estáticos
```

---

## 🗂️ Páginas

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/` | `Index.tsx` | Landing page VSL principal |
| `/thankyou` | `ThankYou.tsx` | Obrigado + Upsell |
| `/pending` | `Pending.tsx` | Pagamento pendente |
| `/admin/videos` | `AdminVideos.tsx` | Admin de vídeos |
| `/admin/analytics` | `AdminAnalytics.tsx` | **📊 Dashboard Analytics** |
| `/utmify-debug` | `TestUtmify.tsx` | Debug UTM |
| `*` | `NotFound.tsx` | 404 |

---

## 💰 Produtos/Ofertas

| Produto | Preço | Link Checkout |
|---------|-------|---------------|
| Plano Prata | R$13,90 | go.pepperpay.com.br/lonsw |
| Plano Gold | R$24,90 | go.pepperpay.com.br/ukrg2 |
| Club Copy & Scale (Upsell) | R$50,00 | pay.kirvano.com/... |

---

## 🗄️ Banco de Dados (Supabase)

| Tabela | Campos Principais |
|--------|-------------------|
| `payments` | payment_id, payer_email, status, amount |
| `user_roles` | user_id, role (admin/moderator/user) |
| `vsl_video` | video_url, page_key, created_at |
| `banner_images` | image_url, page_key |
| `button_clicks` | **🆕** button_id, button_label, session_id, UTMs |
| `video_watch_events` | **🆕** session_id, event_type, percent_watched |
| `page_sessions` | **🆕** session_id, page_url, UTMs |

---

## ⚡ Edge Functions

| Função | Descrição |
|--------|-----------|
| `create-checkout` | Cria checkout Mercado Pago |
| `mp-webhook` | Webhook MP + Email |
| `yampi-webhook` | Webhook Yampi |
| `utmify-track` | Tracking UTMify |
| `utmify-proxy` | Proxy UTMify |
| `check-payment` | Verifica pagamento |
| `purchase-fallback` | Fallback compra |
| `init-fallback` | Init fallback |
| `test-mp-token` | Teste token MP |

---

## 📊 Integrações

| Plataforma | Status | ID/Config |
|------------|--------|-----------|
| UTMify | ✅ Ativo | `694193c8edf1b9da77b48e2b` |
| Facebook Pixel | ✅ Via MP | `1535934207721343` |
| Mercado Pago | ✅ Ativo | Webhook configurado |
| EmailJS | ✅ Ativo | Entrega automática |
| Supabase | ✅ Ativo | zshzrnkhxqksfaphfqyi |

---

# 📝 CHANGELOG — Histórico de Atualizações

---

## 🔄 ATUALIZAÇÃO #003 — Gestão Dinâmica de Domínios VSL
**Data:** 02/02/2026 às 00:15 (horário de Brasília)  
**Responsável:** Antigravity AI

### 📋 Descrição
Refatoração completa do Testador de VSLs para suportar múltiplos domínios de forma dinâmica, eliminando as configurações estáticas (BR/USA).
- Implementação da tabela `vsl_test_centers` para gestão de domínios.
- Auto-seeding automático dos domínios padrão (Brasil e USA) no primeiro carregamento, preservando os slugs ativos.
- Interface de gerenciamento para adicionar, excluir e pausar domínios individualmente.
- Dashboards de métricas e carrosséis agora renderizam dinamicamente para cada domínio cadastrado.

### ✏️ Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AdminVSLTester.tsx` | Refatoração total para renderização dinâmica e auto-seeding |
| `src/lib/vslService.ts` | Adicionadas funções CRUD para centers e detecção dinâmica de domínio |
| `src/pages/Index.tsx` | Atualizado para detectar status do domínio (Ativo/Pausado) |

---

## 🔄 ATUALIZAÇÃO #002 — Dashboard de Analytics
**Data:** 01/02/2026 às 02:35 (horário de Brasília)  
**Responsável:** Auditoria Automatizada

### 📋 Descrição
Implementação completa do Dashboard de Analytics para análise de performance da VSL, incluindo:
- Tracking de cliques em 4 botões de checkout
- Tracking de retenção de vídeo (play, pause, 25%, 50%, 75%, 95%, ended)
- Sessões de página com captura de UTMs
- Dashboard visual com gráficos e mini-mapa da VSL

### ✅ Arquivos Criados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/pages/AdminAnalytics.tsx` | NOVO | Dashboard completo com gráficos recharts |
| `src/lib/analytics.ts` | NOVO | Serviço de tracking centralizado |
| `supabase/migrations/20260201023300_create_analytics_tables.sql` | NOVO | 3 tabelas de analytics |

### ✏️ Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Adicionada rota `/admin/analytics` |
| `src/pages/Index.tsx` | Adicionado tracking de cliques e vídeo |

### 🗄️ Novas Tabelas no Banco

| Tabela | Campos |
|--------|--------|
| `button_clicks` | id, button_id, button_label, page_url, session_id, utm_* |
| `video_watch_events` | id, session_id, video_id, event_type, current_time_seconds, percent_watched |
| `page_sessions` | id, session_id, page_url, referrer, user_agent, utm_* |

### 🎯 Botões Rastreados

| ID | Localização | Oferta |
|----|-------------|--------|
| `btn-comprar-13-1` | Abaixo do vídeo | Plano Prata R$13,90 |
| `btn-comprar-24-1` | Seção de Bônus | Plano Gold R$24,90 |
| `btn-comprar-24-2` | Tabela de Preços (Gold) | Plano Gold R$24,90 |
| `btn-comprar-13-2` | Tabela de Preços (Prata) | Plano Prata R$13,90 |

### 📊 Recursos do Dashboard

- **Cards de Métricas:** Sessões, Cliques, CTR, Top UTM
- **Gráfico de Barras:** Cliques por botão
- **Gráfico de Área:** Retenção de vídeo (0-100%)
- **Mini-mapa:** Visualização da posição dos botões na página
- **Tabela de UTMs:** Top 5 fontes de tráfego
- **Filtros:** 7 dias, 30 dias, Tudo

### 🌐 URLs do Projeto

| Destino | URL |
|---------|-----|
| VSL Principal | http://localhost:8080 |
| Dashboard Analytics | http://localhost:8080/admin/analytics |
| Admin Vídeos | http://localhost:8080/admin/videos |

---

## 🔄 ATUALIZAÇÃO #001 — Inicial
**Data:** 01/02/2026 às 01:30 (horário de Brasília)  
**Responsável:** Auditoria Automatizada

### 📋 Descrição
Criação do documento de auditoria contínua para rastrear todas as futuras modificações do projeto.

### ✅ Estado Inicial do Projeto

#### Páginas (6 total):
- [x] `Index.tsx` — 556 linhas — Landing page VSL completa
- [x] `ThankYou.tsx` — 481 linhas — Página de obrigado + Upsell
- [x] `Pending.tsx` — ~70 linhas — Pagamento pendente
- [x] `AdminVideos.tsx` — ~150 linhas — Admin de vídeos
- [x] `TestUtmify.tsx` — ~200 linhas — Debug UTM
- [x] `NotFound.tsx` — ~25 linhas — 404

#### Componentes Custom (6):
- [x] `VSLPlayer.tsx` — Player Shaka
- [x] `PricingCard.tsx` — Cards de preço
- [x] `FAQItem.tsx` — Acordeão FAQ
- [x] `TestimonialCarousel.tsx` — Carrossel
- [x] `CheckoutButton.tsx` — Botão checkout
- [x] `AuthProvider.tsx` — Auth provider

#### Componentes Admin (5):
- [x] `AdminRoute.tsx` — Proteção de rotas
- [x] `VideoSlotCard.tsx` — Card de slot vídeo
- [x] `VideoUpload.tsx` — Upload vídeos
- [x] `ImageSlotCard.tsx` — Card de slot imagem
- [x] `ImageUpload.tsx` — Upload imagens

#### Componentes UI (49):
- [x] shadcn/ui completo

#### Hooks (3):
- [x] `use-mobile.tsx` — Detecção mobile
- [x] `use-toast.ts` — Sistema de toast
- [x] `useUserRole.ts` — Role do usuário

---

# 📈 Métricas Atuais do Projeto

| Métrica | Valor |
|---------|-------|
| Total de arquivos `.tsx/.ts` | ~80 |
| Total de linhas de código | ~4.500+ |
| Dependências npm | 67 |
| Edge Functions | 9 |
| Migrações SQL | 9 |
| Páginas | 7 |
| Tabelas no Banco | 7 |

---

# 📌 Notas Importantes

1. **Toda alteração** em arquivos do projeto será registrada neste documento
2. Cada atualização inclui: data, hora, descrição, arquivos afetados
3. O documento é ordenado da mais recente para a mais antiga
4. Mudanças no banco de dados/Edge Functions também são rastreadas

---

**Última Atualização:** 01/02/2026 às 02:35  
**Versão do Documento:** 1.1.0
