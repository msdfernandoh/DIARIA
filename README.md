# Diária da Cidade — desenvolvimento

Stack: **Vercel** (web) · **Supabase** (DB, Auth, Edge Functions, Realtime) · **Expo** (app).

Documento mestre: `dev-briefing-completo.md`.

## Começar pelo deploy (ordem correta)

**1. Vercel → 2. Integração Supabase na Vercel → 3. Migrations CLI**

Guia passo a passo: **[docs/DEPLOY-VERCEL-SUPABASE.md](docs/DEPLOY-VERCEL-SUPABASE.md)**

Resumo:

1. Importe o repo na Vercel (build: `npm run vercel-build`, output: `web`).
2. Instale a integração **Supabase** no projeto Vercel e faça **Redeploy**.
3. `supabase link` + `supabase db push` + `supabase functions deploy submit-web-lead`.

## Estrutura

```
web/                 Páginas estáticas (Vercel)
app/                 React Native (Expo) — Fase 1 + onboarding empregado
supabase/            Migrations + Edge Functions
scripts/             inject-web-config.js (build Vercel)
docs/                Deploy e operação
```

## Web — rotas

`/`` · `/trabalhe` · `/contrate` · `/parceiro`

Leads: POST para Edge Function `submit-web-lead` → tabela `web_leads`.

## App Expo

```bash
cd app
cp .env.example .env   # mesmas URL/anon key do Vercel/Supabase
npm install
npx expo start
```

- Cadastro/login Supabase Auth  
- Onboarding empregado (7 passos)  
- Empregador/empreendedor: home após cadastro (onboarding deles ainda no roadmap)

## Variáveis

Veja `.env.example` (raiz) e `app/.env.example`.
