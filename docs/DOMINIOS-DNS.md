# Domínios Diária da Cidade — DNS e Vercel

Enquanto o DNS não propaga, o app e os links no código já usam os domínios oficiais. Até lá, teste com as URLs `*.vercel.app` dos projetos ou IP local no Expo.

## 1. `diariadacidade.com.br` (site institucional)

**Projeto Vercel:** raiz do repositório, `outputDirectory: web` (`vercel.json`).

| Tipo | Nome / Host | Valor (exemplo Vercel) |
|------|-------------|-------------------------|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

No painel Vercel → projeto → **Settings → Domains** → adicionar `diariadacidade.com.br` e `www.diariadacidade.com.br`. A Vercel mostra os registros exatos para o seu registrador (Registro.br, etc.).

**Rotas:** `/`, `/trabalhe`, `/contrate`, `/parceiro`, `/admin`.

---

## 2. `diariadacidade.app.br` (deep links / redirect)

**Projeto Vercel separado** com **Root Directory** = `web/redirect` (ver `web/redirect/vercel.json`).

| Tipo | Nome / Host | Valor |
|------|-------------|--------|
| `A` | `@` | `76.76.21.21` (ou o que a Vercel indicar) |
| `CNAME` | `www` | `cname.vercel-dns.com` (opcional) |

**Comportamento:**

- `/` → redirect 301 para `https://diariadacidade.com.br`
- `/ref/:codigo`, `/qr/:token`, `/vaga/:id` → `index.html` (abre `diariadacidade://…` ou loja/site)

---

## 3. App mobile (Universal / App Links)

No `app/app.json` já estão:

- Scheme: `diariadacidade`
- iOS: `associatedDomains: applinks:diariadacidade.app.br`
- Android: intent filter `https://diariadacidade.app.br`

**Quando o DNS estiver no ar**, publique na Vercel (projeto `.app.br`) os arquivos de verificação:

- `https://diariadacidade.app.br/.well-known/apple-app-site-association`
- `https://diariadacidade.app.br/.well-known/assetlinks.json`

(Expo EAS / documentação App Links — bundle `com.diariacidade.app`.)

Até lá, deep links `diariadacidade://ref/CODIGO` funcionam no Expo Go / build dev.

---

## 4. Propagação DNS

- TTL comum: 5 min a 48 h.
- Teste: `nslookup diariadacidade.com.br` e `curl -I https://diariadacidade.com.br`
- SSL: certificado Let's Encrypt automático na Vercel após DNS OK.

---

## 5. Migrations Supabase (F2-03)

Se ainda não rodou após o deploy de avaliações:

- `20260603100000_physical_opportunities.sql`
- `20260603110000_redeem_opportunity_rpc.sql`

`supabase db push` ou SQL Editor.

---

## 6. Storage `avatars` (Supabase)

Bucket **`avatars`** (público), limite **20 MB** por arquivo. Caminho no app: `{userId}/avatar.jpg` (`app/src/lib/profile.ts`).

Políticas RLS: migration `20260530720000_storage_avatars_policies.sql` (leitura pública; insert/update/delete só na pasta do `auth.uid()`).

Se o bucket já foi criado no painel, rode só essa migration no SQL Editor para aplicar as políticas (ou confira se já batem com o painel).
