# Próximos passos — Vercel + Supabase conectados

Use esta ordem. Marque conforme for fazendo.

---

## 1. Redeploy na Vercel (se ainda não fez)

1. Projeto **diaria-da-cidade** → **Deployments**
2. Último deploy → **⋯** → **Redeploy** → Production
3. Abra o **Build log** e confira: `Wrote ... config.js (URL ok)`

Se aparecer `SUPABASE_URL missing`, vá ao passo 2.

---

## 2. Conferir variáveis na Vercel

**Settings → Environment Variables**

Deve existir (nomes podem variar):

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` ou `SUPABASE_URL` | Site + app |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `SUPABASE_ANON_KEY` | Site + app |
| `SUPABASE_SERVICE_ROLE_KEY` | Só servidor/CLI (não commitar) |

**Custom Prefix** deve estar **vazio** (sem `STORAGE_`).

Copie URL e **anon key** para o passo 5 (Expo).

---

## 3. Banco de dados (schema)

### Opção A — Supabase CLI (recomendado)

Instalar CLI no Windows (PowerShell **como administrador**):

```powershell
winget install Supabase.CLI
```

Ou: https://github.com/supabase/cli/releases (baixar `supabase_windows_amd64.exe`).

Depois, na pasta do projeto:

```powershell
cd c:\Users\msdfe\Downloads\DIARIAS-2026\DIARIA
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
supabase functions deploy submit-web-lead
```

**Project ref:** Supabase Dashboard → **Project Settings → General → Reference ID**

### Opção B — SQL no Dashboard (sem CLI)

1. Supabase → **SQL Editor** → **New query**
2. Cole e execute, **na ordem**:
   - Conteúdo de `supabase/migrations/20260530120000_phase1_foundation.sql`
   - Conteúdo de `supabase/migrations/20260530200000_empregado_onboarding.sql`
3. Edge Function: **Edge Functions** → deploy manual ou use CLI só para a function

---

## 4. Edge Function `submit-web-lead`

Necessária para formulários das landings.

Com CLI:

```powershell
supabase functions deploy submit-web-lead
```

No Dashboard: **Edge Functions** → verifique se `submit-web-lead` existe após deploy.

Config local: `verify_jwt = false` em `supabase/config.toml` (já está).

---

## 5. App Expo (mesmo Supabase)

```powershell
cd app
copy .env.example .env
```

Edite `app/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

```powershell
npm install
npx expo start
```

Fluxo: **Quero trabalhar** → cadastro → onboarding 7 passos → home.

---

## 6. Auth no Supabase (e-mail)

Dashboard → **Authentication → Providers → Email**

- Confirmação de e-mail: pode **desligar** no MVP (cadastro imediato)
- **Authentication → URL Configuration**: adicione depois URLs do app se usar deep link

---

## 7. Testes

| Teste | Esperado |
|-------|----------|
| Site `/trabalhe` → enviar formulário | 200, mensagem de sucesso |
| Supabase → **Table Editor → web_leads** | Nova linha |
| App → cadastro empregado | Linha em `users` + onboarding |
| App → concluir onboarding | `onboarding_completo = true` |

---

## 8. Domínio (quando quiser)

Vercel → **Settings → Domains** → `diaria.cidade.com.br`

---

## Problemas comuns

**Formulário: erro ao enviar**  
→ Redeploy Vercel (config.js com URL/anon). Leads usam **REST `/rest/v1/web_leads`** (não exige Edge Function). Se 403, rode `20260530300000_web_leads_rls_fix.sql` no SQL Editor.

**App: coluna onboarding_completo**  
→ Rode a migration `20260530200000_empregado_onboarding.sql`

**CLI npx supabase falha no Windows**  
→ Use `winget install Supabase.CLI` ou SQL Editor (opção B)
