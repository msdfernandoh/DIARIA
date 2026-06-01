# Deploy: Vercel primeiro, Supabase conectado pela integração

Ordem recomendada para este repo: **criar projeto na Vercel → conectar Supabase pela integração → só então migrations e Edge Functions**.

Assim as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` entram no projeto Vercel automaticamente e o build gera `web/js/config.js` para os formulários de lead.

---

## Pré-requisito

- Código em um repositório Git (GitHub, GitLab ou Bitbucket).
- Conta na [Vercel](https://vercel.com) e na [Supabase](https://supabase.com) (a integração pode criar o projeto Supabase por você).

---

## Passo 1 — Projeto na Vercel (só web)

1. Acesse [vercel.com/new](https://vercel.com/new).
2. **Import** do repositório `DIARIA` (ou o nome do seu repo).
3. Configuração do projeto (importante):

| Campo | Valor |
|--------|--------|
| **Root Directory** | `.` (raiz do repo) |
| **Framework Preset** | Other |
| **Build Command** | `npm run vercel-build` (já está no `vercel.json`) |
| **Output Directory** | `web` (já está no `vercel.json`) |
| **Install Command** | `npm install` (opcional; o `package.json` da raiz só roda o script de inject) |

4. **Deploy** (pode ser o primeiro deploy **sem** Supabase — as landings abrem, mas os formulários avisam que falta config até o passo 2).

5. Domínios de produção:
   - **Site:** `https://diariadacidade.com.br` (este projeto Vercel, pasta `web/`)
   - **App / deep links:** `https://diariadacidade.app.br` (segundo projeto Vercel, pasta `web/redirect/` — ver `web/redirect/vercel.json`)

### Alternativa: CLI

Na raiz do repo:

```bash
npx vercel login
npx vercel
npx vercel --prod
```

---

## Passo 2 — Integração Supabase na Vercel

1. No painel Vercel: abra o **projeto** que você acabou de criar.
2. Aba **Integrations** (ou **Marketplace** → Supabase).
3. Instale **[Supabase](https://vercel.com/integrations/supabase)**.
4. Escolha uma opção:
   - **Create new Supabase project** — cria o banco ligado a este deploy Vercel (ideal para começar).
   - **Link existing project** — se já tiver um projeto Supabase vazio.
5. Associe ao **mesmo** projeto Vercel da Diária da Cidade.
6. Região: preferir **South America (São Paulo)** se disponível, alinhado ao público BR.

A integração adiciona variáveis ao projeto Vercel, em geral incluindo:

- `SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (não vai para o browser; use só local/CI para migrations)

7. **Redeploy** obrigatório: Deployments → último deploy → **Redeploy** (ou push vazio no Git).

   O script `scripts/inject-web-config.js` roda no build e grava `web/js/config.js` com URL + anon key.

8. Teste: abra `/trabalhe`, envie o formulário de teste → depois das migrations (passo 3) o lead aparece em `web_leads`.

---

## Passo 3 — Supabase: schema e Edge Function (após integração)

Com o projeto Supabase já criado/ligado:

1. No Supabase Dashboard → **Project Settings → General** → copie **Reference ID** (`project-ref`).

2. Na sua máquina, na raiz do repo:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
npx supabase functions deploy submit-web-lead
```

3. Confirme a function: **Edge Functions** → `submit-web-lead` (JWT verification desligado para POST público com anon key — já configurado em `supabase/config.toml`).

4. **Auth (app Expo):** Dashboard → Authentication → URL Configuration — adicione redirect URLs se for usar magic link depois; e-mail/senha já funciona com confirmação desligada no config local.

---

## Passo 4 — Variáveis no app Expo (mesmo Supabase)

Copie do Vercel (Settings → Environment Variables) ou do Supabase (Settings → API):

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Arquivo: `app/.env` (não commitar).

---

## Passo 5 — Domínio (opcional)

Vercel → Project → **Domains**:

- `diaria.cidade.com.br` → raiz (`/`)
- Mesmo projeto serve `/trabalhe`, `/contrate`, `/parceiro` via `vercel.json`.

---

## Checklist rápido

- [ ] Projeto Vercel importado e deploy OK
- [ ] Integração Supabase instalada no projeto Vercel
- [ ] Redeploy após integração
- [ ] `supabase db push` + `functions deploy submit-web-lead`
- [ ] Formulário em `/parceiro` grava linha em `web_leads`
- [ ] `app/.env` com as mesmas credenciais para o mobile

---

## Problemas comuns

**Formulário: “Configure Supabase em web/js/config.js”**  
→ Integração não aplicada ou redeploy não feito. Confira env vars no Vercel e redeploy.

**Lead 500 / CORS**  
→ Rode `supabase functions deploy submit-web-lead` e confira se a migration criou `web_leads`.

**Build Vercel: SUPABASE_URL missing no log**  
→ Normal no primeiro deploy; após integração + redeploy deve aparecer `(URL ok)`.

---

*Stack deste repo: só Vercel + Supabase + APIs públicas (ViaCEP). Sem Zapier.*
