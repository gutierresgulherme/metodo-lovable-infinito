# 🗺️ MAPA DO PROJETO - VSL DE VENDAS

> **Data de Criação:** 04/02/2026  
> **Versão:** 1.3 (Dashboard Completo + Mapa Visual)
> **Status:** Em Produção (com tráfego ativo)

---

## 📋 VISÃO GERAL

### O que é este projeto?
Sistema de VSL (Video Sales Letter) para vendas com painel administrativo integrado.

### Objetivo Principal
Exibir páginas de vendas com vídeos para capturar leads através de tráfego pago, com tracking de conversões via Utmify.

### Público-Alvo
Leads que chegam via Meta Ads (Facebook/Instagram) de 2 Business Managers diferentes (um em Real, outro em Dólar).

---

## 🏗️ ARQUITETURA DO SISTEMA

### Stack Técnica Completa

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| **Frontend** | Next.js / React | Interface das VSLs e Admin |
| **Backend** | Supabase | Banco de dados + Auth + Storage |
| **Hospedagem** | Vercel | Deploy do site |
| **Código** | GitHub + Antigravity | Versionamento e edição |
| **Domínios** | Dinadot (registro) | Compra dos .vip |
| **DNS/Proxy** | Cloudflare | Gestão de DNS e segurança |
| **Tracking** | Utmify (scripts) | Rastreamento de vendas |

### Fluxo de Tráfego

```
Meta Ads (BM Real) → Domínio .vip #1 → VSL Home/Thank You
Meta Ads (BM Dólar) → Domínio .vip #2 → VSL Home/Thank You
```

**Lógica:** Cada domínio representa um Business Manager diferente.

---

## 📁 ESTRUTURA DE PASTAS (DETALHADA)

### Raiz do Projeto (`/VSL`)

```
VSL/
├── 📁 .env                      # Variáveis de ambiente (NÃO COMMITAR)
├── 📁 src/                      # CÓDIGO-FONTE PRINCIPAL
├── 📁 supabase/                 # Configurações do Supabase
├── 📁 dist/                     # Arquivos de build (gerados automaticamente)
├── 📁 node_modules/             # Dependências (NÃO COMMITAR)
├── 📁 public/                   # Arquivos públicos estáticos
├── 📁 scripts/                  # Scripts auxiliares
├── 📁 docs/                     # DOCUMENTAÇÃO
│   └── 📁 historico/            # Arquivo de scripts e auditorias antigas
├── 📄 components.json           # Configuração de componentes
├── 📄 eslint.config.js          # Regras de código
├── 📄 full_schema.sql           # Schema completo do banco
├── 📄 HOW_TO_PUSH_...           # Guia de deploy
├── 📄 index.html                # HTML principal
├── 📄 manifest.json             # Configuração PWA
├── 📄 package.json              # Dependências do projeto
├── 📄 package-lock.json         # Lock de versões
├── 📄 postcss.config.js         # Config do PostCSS
├── 📄 README.md                 # Documentação geral
├── 📄 registerSW.js             # Service Worker
├── 📄 robots.txt                # SEO - instruções para bots
├── 📄 sw.js                     # Service Worker principal
├── 📄 tailwind.config.js        # Config do Tailwind CSS
├── 📄 tsconfig.json             # Config do TypeScript
├── 📄 tsconfig.node.json        # Config do Node
└── 📄 vite.config.ts            # Config do Vite
```

---

### Pasta `docs/historico/` - ARQUIVO MORTO (Mas útil)

Contém scripts SQL de correções anteriores ("nuclear fixes", "anon fixes"), PRDs antigos e auditorias passadas. Consulte se precisar reverter algo crítico.

---

### Pasta `src/` - CÓDIGO PRINCIPAL

```
src/
├── 📁 assets/                   # MÍDIAS E RECURSOS
│   ├── faviconico               # Ícone do site
│   ├── index.html               # ??? (verificar necessidade)
│   ├── manifest.json            # ??? (duplicado da raiz?)
│   ├── placeholder.svg          # Imagem placeholder
│   └── registerSW.js            # ??? (duplicado?)
│
├── 📁 components/               # COMPONENTES REUTILIZÁVEIS
│   ├── components.json          # Configuração de componentes
│   ├── eslint.config.js         # Linter
│   └── package-lock.json        # Lock de versões
│
├── 📁 supabase/                 # INTEGRAÇÃO COM SUPABASE
│   ├── .env                     # Variáveis de ambiente Supabase
│   ├── .gitignore               # Arquivos ignorados
│   ├── .npmrc                   # Config do NPM
│   ├── 📁 components.json       # ??? (verificar)
│   ├── eslint.config.js         # Linter
│   ├── full_schema.sql          # Schema do banco
│   ├── HOW_TO_PUSH...           # Guia
│   ├── index.html               # ???
│   ├── package.json             # Dependências
│   ├── package-lock.json        # Lock
│   ├── 📄 README.md             # Docs
│   └── 📄 database.sql          # Schema do banco
│
├── 📄 index.html                # HTML principal da aplicação
├── 📄 package.json              # Dependências
├── 📄 package-lock.json         # Lock de versões
├── 📄 tailwind.config.js        # Estilos
└── 📄 tsconfig.json             # TypeScript config
```

---

## 🎯 FUNCIONALIDADES DO SISTEMA

### 1️⃣ VSLs (Páginas de Venda)

#### VSL Home
- **URL:** `[dominio.vip]/` ou `[dominio.vip]/home`
- **Elementos:**
  - Vídeo de vendas
  - Copy de vendas
  - Botão de CTA (Call-to-Action) → redireciona pro checkout
  - Botão escondido de acesso ao Admin (⭐ ADOREI ISSO!)

#### VSL Thank You (Obrigado)
- **URL:** `[dominio.vip]/thankyou` ou `/obrigado`
- **Elementos:**
  - Vídeo de vendas
  - Imagem de banner
  - Copy de agradecimento
  - Botão de CTA secundário

**Lógica de Domínios:**
- Domínio 1 (.vip) → BM com pagamento em Real
- Domínio 2 (.vip) → BM com pagamento em Dólar
- Ambos mostram as mesmas VSLs, só muda o tracking

---

### 2️⃣ Painel Administrativo

#### Acesso
- **Como entrar:** Clique no botão escondido na VSL Home
- **Login:** Autenticação via Supabase Auth
- **URL:** `[dominio.vip]/admin` ou `/dashboard`

#### Funcionalidades que FUNCIONAM ✅

##### Dashboard Principal
- Visualização de métricas gerais
- Cards com dados de performance

##### Mapa Visual das VSLs
- **⚠️ BUG PARCIAL:** Mostra apenas os botões da VSL Home
- **Faltando:** Botões da VSL Thank You não aparecem no mapa

##### Editor de Links de Checkout
- Permite alterar o link de redirecionamento do botão CTA
- Funciona para Home e Thank You separadamente
- Salva no banco de dados (Supabase)

##### Página de Integrações
- Gerenciamento dos scripts Utmify
- Visualização de configurações de tracking

##### 🆕 Mapa Visual e Gestão de Checkouts
- **Mapa da VSL:** Cards coloridos (Scarcity, Hero, Video, CTAs) gerados automaticamente.
- **Gestão de Links:** Edição de URLs de checkout para casa botão identificado.
- **Ticket Médio:** Cálculo automático do valor médio das ofertas.


---

### 3️⃣ Sistema de Upload (🐛 COM BUGS)

#### Upload de Vídeos
- **Onde:** Painel Admin → Mídias
- **Função:** Admin faz upload de vídeos para as VSLs
- **Status:** ❌ NÃO FUNCIONA em produção (funciona no localhost)

#### Upload de Imagens
- **Onde:** Painel Admin → Mídias
- **Função:** Admin faz upload de banner pra Thank You page
- **Status:** ❌ NÃO FUNCIONA em produção (funciona no localhost)

---

## 🐛 BUGS CONHECIDOS (PRIORIDADE)

### � BUG #1: Upload Não Funciona em Produção (RESOLVIDO)
**Status:** ✅ Corrigido
**Solução:** 
- A lógica de upload foi simplificada para usar **exclusivamente o cliente público** (`supabasePublic`) para interagir com o Storage. 
- Isso elimina a dependência de tokens JWS autenticados que estavam expirando ou falhando em produção.
- Adicionado timestamp (`?t=...`) nas URLs para evitar cache persistente.


---

### � BUG #2: Exibição Incorreta de Mídias nas VSLs (RESOLVIDO)
**Status:** ✅ Corrigido
**Solução:** 
- A lógica de exibição em `vslService.ts` foi sincronizada com a nova estrutura de Buckets e Nomenclatura.
- Adicionado **Timestamp Cache-Busting** (`?t=...`) tanto nas buscas do banco quanto nos fallbacks diretos do Storage.
- Separação estrita de mídias por região (BR/USA) e tipo (Home/ThankYou) validada.


---

### � BUG #3: Mapa Visual Incompleto no Dashboard (RESOLVIDO)
**Status:** ✅ Corrigido
**Solução:** 
- O Dashboard agora exibe dois cards principais sob a seção "MAPA ESTRATÉGICO": VSL Home e VSL Thank You.
- O card da Thank You mostra preview duplo (Vídeo + Banner) para facilitar a conferência visual.
- Layout responsivo garantido para ambas as VSLs.


---

## 📊 FLUXO DE DADOS

### Como Funciona o Sistema Completo

```
1. LEAD CLICA NO ANÚNCIO
   ↓
2. Meta Ads redireciona pro Domínio .vip
   (já com UTMs no link)
   ↓
3. Cloudflare roteia pro Vercel
   ↓
4. Vercel serve a VSL (Home ou Thank You)
   ↓
5. VSL carrega:
   - Busca vídeo/imagem no Supabase Storage
   - Busca link do checkout no Supabase DB
   - Carrega scripts Utmify pra tracking
   ↓
6. LEAD CLICA NO CTA
   ↓
7. Redireciona pro checkout (link editável no admin)
   ↓
8. Utmify registra a conversão
```

---

## 🔧 SUPABASE - ESTRUTURA DO BANCO

### Tabelas Principais (presumidas)

```sql
-- VSLs (páginas)
vsls
  - id
  - tipo (home | thankyou)
  - video_url (URL do Supabase Storage)
  - banner_url (URL do Supabase Storage - só pra thankyou)
  - copy_texto
  - checkout_link
  - created_at
  - updated_at

-- Uploads (controle de arquivos)
uploads
  - id
  - tipo (video | imagem)
  - vsl_id (referência pra qual VSL)
  - storage_path (caminho no Supabase Storage)
  - filename
  - size
  - uploaded_at

-- Métricas (tracking)
metrics
  - id
  - dominio
  - utm_source
  - utm_medium
  - utm_campaign
  - conversao (boolean)
  - created_at
```

### Storage Buckets

```
supabase-storage/
├── videos/
│   ├── home_video.mp4
│   └── thankyou_video.mp4
└── banners/
    └── thankyou_banner.jpg
```

---

## 📝 HISTÓRICO DE IMPLEMENTAÇÕES

### Últimas Correções Aplicadas (segundo walkthrough)

1. ✅ **Separação Estrita de Mídias**
   - Home e Thank You agora têm vídeos separados
   - Removido fallback de "pegar qualquer vídeo"

2. ✅ **Blind Storage Fallback (Videos)**
   - Se banco não retornar vídeo, frontend tenta carregar direto do CDN
   - Path: `videos/vsl/thankyou_upsell_br.mp4`

3. ✅ **Blind Storage Fallback (Imagens)**
   - Se banco não retornar banner, frontend constrói URL direta
   - Path: `banners/thankyou_banner_br`

4. ⚠️ **Padronização de Nomes de Arquivos**
   - Imagens agora salvam com nomes fixos (ex: `banners/thankyou_banner_br`)

5. ✅ **Correção Definitiva de Upload (JWS Bypass)**
   - Removida lógica de upload autenticado em `VideoSlotCard` e `ImageSlotCard`.
   - Implementado upload 100% via cliente público (`supabasePublic`).
   - Adicionado cache-busting rigoroso nos uploads.


---

## 🚨 PROBLEMAS DE ORGANIZAÇÃO RESOLVIDOS

**Arquivos Movidos para `docs/historico/`:**
- `AUDITORIA_INTEGRACOES.md`
- `AUDITORIA_PROJETO.md`
- `PRD_VSL_COMPLETO.md`
- Todos os `supabase_fix_*.sql`

## ✅ PRÓXIMOS PASSOS (RECOMENDADOS)

### Prioridade CRÍTICA
1. 🔴 Resolver Bug #1 (Upload em Produção)
   - Verificar permissões RLS no Supabase
   - Checar CORS e políticas de Storage
   - Testar com logs detalhados

2. 🔴 Resolver Bug #2 (Exibição de Mídias)
   - Validar queries do banco
   - Conferir lógica de separação Home/Thank You
   - Testar URLs presigned

### Prioridade ALTA
3. 🟡 Resolver Bug #3 (Mapa Visual)
   - Adicionar renderização da Thank You no dashboard

### Organização
4. 📁 Limpar Estrutura de Pastas
   - DELETAR duplicatas em `src/assets` e `src/supabase` se não usados
   - Consolidar configs em um lugar só

---

## 🎯 COMO USAR ESTE MAPA

### Para Você (Desenvolvedor)
- Use este documento como referência rápida
- Sempre atualize quando fizer mudanças importantes
- Consulte antes de pedir ajuda pra IA

### Para a IA (Antigravity/Claude)
- Este documento é a "fonte única de verdade"
- Sempre consulte este mapa antes de fazer alterações
- Siga a estrutura descrita aqui
- Atualize este arquivo quando implementar correções

### Para Debugging
- Identifique o bug na seção "BUGS CONHECIDOS"
- Veja os "Arquivos Envolvidos"
- Consulte o "Fluxo de Dados" pra entender o contexto
- Aplique correções e documente aqui

---

## 🔄 CONTROLE DE VERSÃO DESTE MAPA

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 04/02/2026 | Criação inicial do mapa completo |
| 1.1 | 04/02/2026 | Organização da pasta docs/historico |

---
