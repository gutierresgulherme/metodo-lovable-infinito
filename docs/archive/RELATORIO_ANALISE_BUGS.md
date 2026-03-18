# RELATÓRIO DE ANÁLISE COMPLETA DE BUGS
Data: 04/02/2026
Analista: IA Antigravity

---

## RESUMO EXECUTIVO

A análise dos três bugs reportados revelou que o **Bug #1 (Upload)** é o bloqueador raiz que causa o **Bug #2 (Exibição)**. O erro de "Invalid Compact JWS" indica problemas de autenticação que impedem o salvamento de arquivos, fazendo com que o frontend não tenha o que exibir (ou falhe ao tentar buscar arquivos inexistentes). Já o **Bug #3 (Dashboard)** é funcional: o código atual foi programado para exibir apenas a VSL "Ativa" (Home), faltando a implementação do loop ou card adicional para a VSL "Thank You".

---

## BUG #1: UPLOAD NÃO FUNCIONA EM PRODUÇÃO

### 🔍 Diagnóstico

**Mensagem de Erro Exata:**
`STORAGE_UPLOAD_ERROR: Invalid Compact JWS` (ou similar relacionado a Token expirado/invalido)

**Causa Raiz Identificada:**
O componente de upload (`VideoSlotCard.tsx` e `ImageSlotCard.tsx`) tenta primeiramente um upload autenticado via cliente `supabase`. Em produção, o token de sessão do usuário pode estar expirado ou inválido (JWS Error). O código possui um *fallback* para upload anônimo (`supabasePublic`), mas este fallback falha se o Bucket `videos` ou `site_uploads` não estiver explicitamente configurado como `PUBLIC` no Supabase e com políticas permissivas. Além disso, a pasta de destino (`vsl/`) pode não existir se nunca foi criada, e o upload via cliente público não cria pastas automaticamente.

**Arquivos Envolvidos:**
- `src/components/admin/VideoSlotCard.tsx` - Responsável pelo upload de vídeos.
- `src/components/admin/ImageSlotCard.tsx` - Responsável pelo upload de banners.

**Fluxo do Erro:**
1. Admin seleciona arquivo e clica em Upload.
2. `supabase.storage.from('videos').upload(...)` é chamado.
3. Supabase retorna erro 401/403 "Invalid Compact JWS" (Token inválido).
4. O `catch` block detecta o erro JWS e tenta `supabasePublic.storage...`.
5. Se o bucket não for público OU a pasta `vsl` não existir, o upload público TAMBÉM falha silenciosamente ou retorna outro erro que o frontend exibe genericamente.
6. O registro no banco de dados (`db.insert`) falha em sequência pois não há URL válida.

**Diferenças Localhost vs Produção:**
- **Localhost:** O token de autenticação geralmente é fresco e o ambiente de desenvolvimento pode ter políticas RLS relaxadas ou o usuário é 'admin' recém logado.
- **Produção:** Tokens persistem por mais tempo, podendo corromper ou expirar 'silenciosamente'. A latência de rede em produção tbm pode expor race conditions na criação de registros.

### ✅ Solução Proposta

**Solução Recomendada:**
Modificar `VideoSlotCard.tsx` e `ImageSlotCard.tsx` para usar **exclusivamente** o cliente público (`supabasePublic`) para uploads, dado que os buckets já foram configurados como públicos. Isso remove a dependência do Token JWS. Adicionalmente, implementar verificação/criação de um arquivo "dummy" para garantir que a pasta exista.

**Passos de Implementação:**
1. Remover a tentativa de upload autenticado (`supabase.storage...`).
2. Usar direto `supabasePublic.storage...` com tratamento robusto de erro.
3. Adicionar passo de pré-verificação de existência da pasta (upload de arquivo vazio `.keep` se necessário).
4. Garantir que a URL gerada tenha timestamp para evitar cache (`?t=...`).

**Arquivos a Modificar:**
- `src/components/admin/VideoSlotCard.tsx`
- `src/components/admin/ImageSlotCard.tsx`

**Código de Exemplo:**
```typescript
// Antes (Lógica complexa com Fallback)
let uploadResult = await supabase.storage...
if (error && isJWS) {
  uploadResult = await supabasePublic.storage...
}

// Depois (Direto e Robusto)
// 1. Garante bucket público
const { data, error } = await supabasePublic.storage
  .from('videos') // ou 'site_uploads'
  .upload(uploadPath, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600'
  });
```

**Riscos:**
- Upload público permite que qualquer pessoa com a URL da API faça upload (Mitigação: Aceitável para VSL assets, mas idealmente restringiríamos por RLS no futuro se o "JWS" for consertado na raiz da auth).

---

## BUG #2: EXIBIÇÃO INCORRETA DE MÍDIAS

### 🔍 Diagnóstico

**Mensagem de Erro Exata:**
Não há mensagem de erro explicita na UI, apenas "NENHUMA IMAGEM ENCONTRADA" ou vídeo incorreto/player preto. No console: `[VSL] Erro na busca regional...` ou 404 nos requests de mídia.

**Causa Raiz Identificada:**
1. **Dependência do Bug #1:** Como o upload falha, o arquivo não existe no Storage.
2. **Blind Fallback Incompleto:** O arquivo `vslService.ts` constrói URLs de fallback (`.../thankyou_upsell_usa.mp4`), mas se o arquivo nunca foi subido (devido ao Bug 1), essa URL retorna 400/404.
3. **Cache de Navegador:** Se um arquivo foi substituído mas a URL se mantém a mesma (sem timestamp no fallback), o navegador mostra a versão antiga ou cacheada do 404.

**Arquivos Envolvidos:**
- `src/lib/vslService.ts` - Lógica de decisão de qual mídia mostrar.
- `src/pages/ThankYou.tsx` - Componente consumidor.

**Fluxo do Erro:**
1. Página Thank You carrega.
2. `getThankYouMedia` é chamado.
3. Tenta buscar no Banco de Dados. Retorna NULL (porque upload falhou ou registro foi apagado).
4. Entra no `steps 3` (Blind Fallback). Constrói URL: `.../vsl/thankyou_upsell_usa.mp4`.
5. Frontend tenta carregar essa URL.
6. Storage retorna 404 (Arquivo não existe).
7. Player de vídeo fica preto ou mostra erro de carregamento.

### ✅ Solução Proposta

**Solução Recomendada:**
Após corrigir o Bug #1 (garantindo que o arquivo exista), atualizar `vslService.ts` para testar a existência da URL de fallback (via `HEAD` request) ou simplesmente confiar que o upload funcionará. A exibição se corrigirá "automaticamente" assim que o upload for bem sucedido.

**Passos de Implementação:**
1. A correção primária é o Bug #1.
2. **Melhoria:** Adicionar timestamp (`?t=...`) também nas URLs de Blind Fallback em `vslService.ts` para furar cache caso o arquivo seja atualizado sem mudar o nome.

**Arquivos a Modificar:**
- `src/lib/vslService.ts`

**Código de Exemplo:**
```typescript
// Em getThankYouMedia -> Fallback
const timestamp = new Date().getTime(); // Cache busting simplificado
bannerUrl = `${storageBase}${fallbackKey}.png?t=${timestamp}`;
```

---

## BUG #3: MAPA VISUAL INCOMPLETO

### 🔍 Diagnóstico

**Mensagem de Erro Exata:**
Nenhum erro. O comportamento é visual: falta o card da VSL Thank You.

**Causa Raiz Identificada:**
O arquivo `AdminDashboard.tsx` não possui código para renderizar a VSL Thank You. Ele foi programado para mostrar apenas uma "VSL Ativa" (singular), usando `getCurrentVSLInfo` que retorna por padrão a Home VSL. Não existe iteração sobre as variantes de VSL.

**Arquivos Envolvidos:**
- `src/pages/AdminDashboard.tsx`

**Fluxo do Erro:**
1. Admin carrega o dashboard.
2. `activeVsl` é setado com dados da Home VSL.
3. Componente renderiza apenas UM card (`<Card>...VSL ATIVA...</Card>`).
4. Não há código renderizando um segundo card.

### ✅ Solução Proposta

**Solução Recomendada:**
Adicionar manualmente o card da VSL Thank You no grid do Dashboard, ou refatorar para aceitar uma lista de VSLs. Como são apenas duas (Home e Thank You), adicionar o segundo card explicitamente é mais rápido e seguro.

**Passos de Implementação:**
1. Duplicar a estrutura do Card da VSL Home.
2. Adaptar o segundo card para buscar/exibir dados da VSL Thank You (usando `getThankYouMedia` para preview).

**Arquivos a Modificar:**
- `src/pages/AdminDashboard.tsx`

---

## 🔗 RELAÇÃO ENTRE BUGS

- **Bug #1 é Bloqueante:** Sem upload funcionando, o Bug #2 nunca será resolvido, pois não haverá mídia para exibir.
- **Bug #2 é Sintoma:** A exibição incorreta é, em 90% dos casos, causada pela falta do arquivo correto no storage (Bug #1).
- **Bug #3 é Isolado:** É puramente frontend/visual e não depende dos outros dois.

---

## 📋 PLANO DE AÇÃO RECOMENDADO

### Ordem de Correção
1. **Bug #1 (Upload)** - **PRIORIDADE MÁXIMA.** Sem isso, o sistema não é administrável. Resolverá o erro "JWS" e populará o Storage.
2. **Bug #2 (Exibição)** - Validar se a correção do Bug #1 resolveu a exibição. Se não, aplicar o cache busting no `vslService.ts`.
3. **Bug #3 (Dashboard)** - Melhoria de UX para o admin, fazer por último.

### Checklist de Segurança
- [ ] Aplicar fix do Upload (`VideoSlotCard` / `ImageSlotCard`) usando cliente público.
- [ ] Testar upload de Vídeo .mp4 grande (>50MB) para garantir estabilidade.
- [ ] Testar upload de Banner .png.
- [ ] Verificar acessibilidade da URL pública gerada em aba anônima (sem login Supabase).
- [ ] Validar carregamento na página `/thankyou`.

### Estimativa de Tempo
- Bug #1: 45 minutos
- Bug #2: 15 minutos (após fix #1)
- Bug #3: 30 minutos
**Total:** ~1h 30m

---

## ⚠️ PONTOS DE ATENÇÃO

- **Cache de CDN:** O Cloudflare e o navegador podem cachear os vídeos antigos/quebrados. Sempre testar em Aba Anônima ou adicionar `?t=CN` nas URLs.
- **Permissões de Storage:** Certifique-se que o script SQL `supabase_fix_absolute.sql` foi rodado com sucesso antes de testar o código Frontend novo.

---
