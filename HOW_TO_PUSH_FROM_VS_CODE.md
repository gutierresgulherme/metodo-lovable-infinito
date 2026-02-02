Resumo rápido — passos para enviar suas alterações do VS Code para o GitHub e disparar deploy no Vercel

1) Verifique status e arquivos modificados

```bash
# no terminal do VS Code, na raiz do projeto
git status
git diff --name-only
```

2) Criar branch e empurrar (automático com o script PowerShell fornecido)

```powershell
# Exemplo de uso (PowerShell):
pwsh .\scripts\publish_changes.ps1 -BranchName "feat/local-preview-fixes" -CommitMsg "feat: atualizar preview host e ajustar UI"
```

Se preferir manualmente:

```bash
git checkout -b feat/local-preview-fixes
git add .
git commit -m "feat: atualizar preview host e ajustar UI"
git push -u origin feat/local-preview-fixes
```

3) Abrir Pull Request
- Se você tem `gh` CLI (GitHub CLI):
  ```bash
  gh pr create --title "feat: atualizar preview & UI" --body "Resumo das alterações..." --base master
  ```
- Ou abra o repositório no GitHub e clique em "Compare & pull request".

4) Validar deploy no Vercel
- Depois do PR aberto (ou após merge para `master`), o Vercel deve iniciar o deploy automaticamente se o projeto estiver conectado.
- Verifique em https://vercel.com/dashboard (se necessário, valide as variáveis de ambiente)

Variáveis importantes para configurar no Vercel (Environment Variables):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_FALLBACK_SECRET`

5) Testes locais antes de push (recomendado)

```bash
npm install
npm run dev   # abre em http://localhost:8080
# ou
npm run build
npm run preview -- --port 8080
```

6) Caso precise aplicar migrations no Supabase (se você adicionou arquivos em `supabase/migrations`):
- Copie o SQL do arquivo `supabase/migrations/20260202000000_vsl_test_centers.sql` e rode no SQL Editor do painel Supabase do seu projeto.

---
Se quiser, eu posso: ✅
- Gerar um branch e commit message pronto (já preparado)
- Criar o script (feito) para executar tudo automaticamente no seu PC

Diga se quer que eu gere uma mensagem de PR pronta com lista de arquivos modificados para copiar/colar no `gh pr create`.