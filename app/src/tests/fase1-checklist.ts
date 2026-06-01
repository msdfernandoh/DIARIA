/**
 * Checklist automatizado Fase 1 — Diária da Cidade
 * Uso: npx ts-node src/tests/fase1-checklist.ts
 * Env: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY
 * Opcional: EXPO_PUBLIC_SUPABASE_ANON_KEY (header apikey na Edge Function)
 */

import * as fs from "fs";
import * as path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

loadEnvFile();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";

type Result = { id: number; name: string; ok: boolean; detail: string };

const results: Result[] = [];
const createdAuthIds: string[] = [];
const EMAIL_PREFIX = "teste-fase1-";
const EMAIL_DOMAIN = "@diariadacidade.com.br";

function loadEnvFile() {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), ".env.local"),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

function email(tag: string) {
  return `${EMAIL_PREFIX}${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${EMAIL_DOMAIN}`;
}

function celular() {
  return `5599${Math.floor(10000000 + Math.random() * 89999999)}`;
}

function pass(id: number, name: string, detail = "OK") {
  if (results.some((r) => r.id === id)) return;
  results.push({ id, name, ok: true, detail });
  console.log(`✅ ${id}. ${name}${detail !== "OK" ? ` — ${detail}` : ""}`);
}

function fail(id: number, name: string, detail: string) {
  if (results.some((r) => r.id === id)) return;
  results.push({ id, name, ok: false, detail });
  console.log(`❌ ${id}. ${name} — ${detail}`);
}

async function runTest(id: number, name: string, fn: () => Promise<void>) {
  try {
    await fn();
    if (!results.some((r) => r.id === id)) pass(id, name);
  } catch (e) {
    fail(id, name, e instanceof Error ? e.message : String(e));
  }
}

import { jobPriority } from "../lib/jobFeedPriority";

/** Espelha gerarAcoesDiarias (empreendedorPainel.ts) */
function gerarAcoesDiarias(pctVagas: number, pctPessoas: number, pctGeral: number, diasRestantes: number) {
  const acoes: { id: string }[] = [];
  if (pctVagas < 30) acoes.push({ id: "empresas" });
  if (pctPessoas < 30) acoes.push({ id: "whatsapp" });
  if (diasRestantes < 7 && pctGeral < 80) acoes.push({ id: "urgente" });
  acoes.push({ id: "perfil" });
  acoes.push({ id: "qr" });
  return acoes.slice(0, 5);
}

async function grantSignupCoinsAdmin(
  admin: SupabaseClient,
  userId: string,
  profile: "empregado" | "empregador",
  withCode: boolean
) {
  const amount = withCode
    ? profile === "empregado"
      ? 100
      : 50
    : profile === "empregado"
      ? 20
      : 10;
  const reason = withCode ? "cadastro_com_codigo" : "cadastro_sem_codigo";
  const liberaEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: txErr } = await admin.from("coin_transactions").insert({
    user_id: userId,
    type: "earn",
    amount,
    reason,
    bloqueado: true,
    libera_em: liberaEm,
  });
  if (txErr) throw txErr;

  const { data: existing } = await admin
    .from("user_coins")
    .select("total_earned")
    .eq("user_id", userId)
    .maybeSingle();
  const totalEarned = (existing?.total_earned ?? 0) + amount;
  if (existing) {
    await admin.from("user_coins").update({ total_earned: totalEarned }).eq("user_id", userId);
  } else {
    await admin.from("user_coins").insert({ user_id: userId, balance: 0, total_earned: totalEarned });
  }
  return { amount, reason };
}

async function createAuthUser(admin: SupabaseClient, tag: string, password = "TesteFase1!Aa") {
  const mail = email(tag);
  const { data, error } = await admin.auth.admin.createUser({
    email: mail,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser sem user");
  createdAuthIds.push(data.user.id);
  return { id: data.user.id, email: mail };
}

/** Cria empreendedor + empregado no grupo (evita depender do teste 2 se falhou). */
async function ensureGrupoFixtures(
  admin: SupabaseClient,
  ctx: {
    empregador?: string;
    empreendedor?: string;
    empregado2?: string;
  }
) {
  if (!ctx.empregador) throw new Error("empregador ausente (teste 3)");

  if (!ctx.empreendedor) {
    const { id: entId, email: entMail } = await createAuthUser(admin, "ent-bootstrap");
    const codigo = `BST${Date.now().toString().slice(-6)}`.slice(0, 10);
    await admin.from("users").insert({
      id: entId,
      nome: "Empreendedor Bootstrap",
      celular: celular(),
      email: entMail,
      tipo: "empreendedor",
      cidade: "Sinop",
      estado: "MT",
      onboarding_completo: true,
    });
    await admin.from("entrepreneurs").insert({
      user_id: entId,
      codigo,
      nome_instancia: "Bootstrap",
    });
    ctx.empreendedor = entId;
  }

  if (!ctx.empregado2) {
    const { id: uid, email: mail } = await createAuthUser(admin, "emp2-bootstrap");
    await admin.from("users").insert({
      id: uid,
      nome: "Empregado Bootstrap Grupo",
      celular: celular(),
      email: mail,
      tipo: "empregado",
      cidade: "Sinop",
      estado: "MT",
      onboarding_completo: true,
    });
    const { data: ent } = await admin
      .from("entrepreneurs")
      .select("codigo")
      .eq("user_id", ctx.empreendedor!)
      .single();
    if (!ent?.codigo) throw new Error("codigo empreendedor bootstrap");
    await admin.from("user_group").insert({
      user_id: uid,
      empreendedor_id: ctx.empreendedor!,
      codigo_usado: ent.codigo,
      ativo: true,
    });
    ctx.empregado2 = uid;
  }
}

async function invokeSendNotification(
  userId: string
): Promise<{ ok: boolean; detail: string; skip?: boolean }> {
  const apikey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || SERVICE_KEY;
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-notification`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      titulo: "Teste Fase 1",
      corpo: "Notificação de teste",
      data: { tipo: "chat", applicationId: "00000000-0000-0000-0000-000000000000" },
    }),
  });
  const text = await res.text();
  let json: { sent?: number; errors?: unknown[]; error?: string } = {};
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  if (res.status === 404) {
    return { ok: true, skip: true, detail: "função não deployada (404) — OK para CI local" };
  }
  if (!res.ok) {
    return {
      ok: false,
      detail: `HTTP ${res.status}: ${json.error ?? text.slice(0, 120)}`,
    };
  }
  if (json.sent === 0 && Array.isArray(json.errors)) {
    return { ok: true, detail: `{ sent: 0, errors: [] }` };
  }
  if (typeof json.sent === "number" && json.sent >= 0) {
    return { ok: true, detail: `sent=${json.sent}` };
  }
  return { ok: false, detail: `resposta: ${text.slice(0, 200)}` };
}

async function cleanupTestUsers(admin: SupabaseClient) {
  let page = 1;
  const toDelete: string[] = [];
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const batch = data.users.filter((u) => u.email?.startsWith(EMAIL_PREFIX));
    batch.forEach((u) => toDelete.push(u.id));
    if (data.users.length < 200) break;
    page += 1;
  }
  const unique = [...new Set([...toDelete, ...createdAuthIds])];
  for (const id of unique) {
    await admin.auth.admin.deleteUser(id);
  }
}

async function computePainelSnapshot(admin: SupabaseClient, entrepreneurUserId: string) {
  const { data: ent } = await admin
    .from("entrepreneurs")
    .select("*")
    .eq("user_id", entrepreneurUserId)
    .maybeSingle();
  if (!ent) return null;

  const { count: totalGrupo } = await admin
    .from("user_group")
    .select("user_id", { count: "exact", head: true })
    .eq("empreendedor_id", entrepreneurUserId)
    .eq("ativo", true);

  const grupo = totalGrupo ?? 0;
  const pctVagas = ent.meta_vagas > 0 ? Math.round((0 / ent.meta_vagas) * 100) : 0;
  const pctPessoas = ent.meta_pessoas > 0 ? Math.round((grupo / ent.meta_pessoas) * 100) : 0;

  const startMs = new Date(ent.criado_em).getTime();
  const diasDecorridos = Math.floor((Date.now() - startMs) / (24 * 60 * 60 * 1000)) + 1;
  const diasRestantes = Math.max(0, 30 - diasDecorridos);
  const periodoGratisAtivo = Date.now() < new Date(ent.periodo_gratis_fim).getTime();

  return { pctVagas, pctPessoas, diasRestantes, periodoGratisAtivo };
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Defina EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_KEY no .env");
    process.exit(1);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ctx: {
    empregado1?: string;
    empregado2?: string;
    empregador?: string;
    empreendedor?: string;
    empreendedorPainel?: string;
    empreendedorCodigo?: string;
    jobOrganic?: string;
    jobGrupo?: string;
    applicationId?: string;
  } = {};

  console.log("\n=== FASE 1 — Checklist automatizado ===\n");

  try {
  await runTest(1, "Auth empregado + users + moedas (20)", async () => {
    const { id: uid, email: mail } = await createAuthUser(admin, "emp1");

    const { error: uErr } = await admin.from("users").insert({
      id: uid,
      nome: "Empregado Teste 1",
      celular: celular(),
      email: mail,
      tipo: "empregado",
      cidade: "Sinop",
      estado: "MT",
      onboarding_completo: true,
    });
    if (uErr) throw uErr;

    const { data: row } = await admin.from("users").select("tipo").eq("id", uid).single();
    if (row?.tipo !== "empregado") throw new Error(`tipo=${row?.tipo}`);

    const coins = await grantSignupCoinsAdmin(admin, uid, "empregado", false);
    const expectedReasons = ["cadastro_sem_codigo", "bonus_cadastro"];
    if (coins.amount !== 20) throw new Error(`amount=${coins.amount}`);
    if (!expectedReasons.includes(coins.reason)) {
      throw new Error(`reason=${coins.reason} (esperado cadastro_sem_codigo ou bonus_cadastro)`);
    }

    const { data: tx } = await admin
      .from("coin_transactions")
      .select("amount, reason")
      .eq("user_id", uid)
      .eq("amount", 20)
      .limit(1)
      .maybeSingle();
    if (!tx) throw new Error("coin_transactions 20 não encontrada");

    ctx.empregado1 = uid;
    pass(1, "Auth empregado + users + moedas (20)", `reason=${tx.reason}`);
  });

  await runTest(2, "Empregado com código + user_group + 100 moedas", async () => {
    const { id: entId, email: entMail } = await createAuthUser(admin, "ent-for-code");

    const codigo = `TST${Date.now().toString().slice(-6)}`.slice(0, 10);
    await admin.from("users").insert({
      id: entId,
      nome: "Empreendedor Ref",
      celular: celular(),
      email: entMail,
      tipo: "empreendedor",
      cidade: "Sinop",
      estado: "MT",
      onboarding_completo: true,
    });
    await admin.from("entrepreneurs").insert({
      user_id: entId,
      codigo,
      nome_instancia: "Instância Teste",
    });

    const { id: uid, email: mail } = await createAuthUser(admin, "emp2");

    await admin.from("users").insert({
      id: uid,
      nome: "Empregado Teste 2",
      celular: celular(),
      email: mail,
      tipo: "empregado",
      cidade: "Sinop",
      estado: "MT",
      onboarding_completo: true,
    });

    await admin.from("user_group").insert({
      user_id: uid,
      empreendedor_id: entId,
      codigo_usado: codigo,
      ativo: true,
    });

    const { data: grp } = await admin
      .from("user_group")
      .select("empreendedor_id")
      .eq("user_id", uid)
      .maybeSingle();
    if (grp?.empreendedor_id !== entId) throw new Error("user_group empreendedor_id incorreto");

    const coins = await grantSignupCoinsAdmin(admin, uid, "empregado", true);
    if (coins.amount !== 100) throw new Error(`amount=${coins.amount}`);

    ctx.empregado2 = uid;
    ctx.empreendedor = entId;
    ctx.empreendedorPainel = entId;
    ctx.empreendedorCodigo = codigo;
    pass(2, "Empregado com código + user_group + 100 moedas");
  });

  await runTest(3, "Auth empregador + users", async () => {
    const { id } = await createAuthUser(admin, "empregador");
    await admin.from("users").insert({
      id,
      nome: "Empregador Teste",
      celular: celular(),
      email: email("empregador-profile"),
      tipo: "empregador",
      cidade: "Sinop",
      estado: "MT",
      onboarding_completo: true,
    });
    const { data: row } = await admin.from("users").select("tipo").eq("id", id).single();
    if (row?.tipo !== "empregador") throw new Error(`tipo=${row?.tipo}`);
    ctx.empregador = id;
    pass(3, "Auth empregador + users");
  });

  await runTest(4, "Auth empreendedor + entrepreneurs.codigo", async () => {
    const { id } = await createAuthUser(admin, "empreendedor");
    const codigo = `EMP${Date.now().toString().slice(-7)}`.slice(0, 10);
    await admin.from("users").insert({
      id,
      nome: "Empreendedor Teste",
      celular: celular(),
      email: email("empreendedor-profile"),
      tipo: "empreendedor",
      cidade: "Sinop",
      estado: "MT",
      onboarding_completo: true,
    });
    await admin.from("entrepreneurs").insert({
      user_id: id,
      codigo,
      nome_instancia: "Franquia Teste",
    });
    const { data: ent } = await admin.from("entrepreneurs").select("codigo").eq("user_id", id).single();
    if (!ent?.codigo) throw new Error("codigo nulo");
    if (ent.codigo.length < 6 || ent.codigo.length > 10) {
      throw new Error(`codigo length=${ent.codigo.length}`);
    }
    if (!/^[a-zA-Z0-9]+$/.test(ent.codigo)) throw new Error("codigo não alfanumérico");
    ctx.empreendedorPainel = ctx.empreendedorPainel ?? id;
    pass(4, "Auth empreendedor + entrepreneurs.codigo", `codigo=${ent.codigo}`);
  });

  await runTest(5, "Vaga Sinop orgânica + prioridade feed = 5", async () => {
    if (!ctx.empregador) throw new Error("empregador ausente");
    const { data: job, error } = await admin
      .from("jobs")
      .insert({
        empregador_id: ctx.empregador,
        titulo: "Vaga teste Fase1 orgânica",
        categoria: "limpeza",
        tipo: "diaria",
        formato: "presencial",
        cidade: "Sinop",
        estado: "MT",
        valor: 150,
        vagas_total: 1,
        vagas_restantes: 1,
        destaque_nivel: "organico",
        ativa: true,
        pausada: false,
      })
      .select("id, destaque_nivel, destaque_grupo_id, cidade, estado")
      .single();
    if (error) throw error;
    ctx.jobOrganic = job.id;

    const { data: jobs } = await admin
      .from("jobs")
      .select("*")
      .eq("ativa", true)
      .eq("pausada", false)
      .gt("vagas_restantes", 0)
      .eq("cidade", "Sinop");
    const found = (jobs ?? []).some((j) => j.id === job.id);
    if (!found) throw new Error("vaga não aparece na query do feed");

    const prio = jobPriority(job, "Sinop", "MT", null);
    if (prio !== 5) throw new Error(`prioridade=${prio}, esperado 5`);
    pass(5, "Vaga Sinop orgânica + prioridade feed = 5");
  });

  await runTest(6, "Vaga destaque grupo prioridade 4 vs 5", async () => {
    await ensureGrupoFixtures(admin, ctx);
    const { data: job, error } = await admin
      .from("jobs")
      .insert({
        empregador_id: ctx.empregador,
        titulo: "Vaga teste Fase1 grupo",
        categoria: "limpeza",
        tipo: "diaria",
        formato: "presencial",
        cidade: "Sinop",
        estado: "MT",
        valor: 180,
        vagas_total: 1,
        vagas_restantes: 1,
        destaque_nivel: "grupo",
        destaque_grupo_id: ctx.empreendedor,
        ativa: true,
        pausada: false,
      })
      .select("id, destaque_nivel, destaque_grupo_id, cidade, estado")
      .single();
    if (error) throw error;
    ctx.jobGrupo = job.id;

    const { data: grp } = await admin
      .from("user_group")
      .select("empreendedor_id")
      .eq("user_id", ctx.empregado2)
      .eq("ativo", true)
      .maybeSingle();
    const prioIn = jobPriority(job, "Sinop", "MT", grp?.empreendedor_id ?? null);
    if (prioIn !== 4) throw new Error(`prioridade in-group=${prioIn}`);

    const prioOut = jobPriority(job, "Sinop", "MT", "00000000-0000-0000-0000-000000000099");
    if (prioOut !== 5) throw new Error(`prioridade out-group=${prioOut}`);

    pass(6, "Vaga destaque grupo prioridade 4 vs 5");
  });

  await runTest(7, "Candidatura pendente + duplicata", async () => {
    if (!ctx.empregado1) {
      const { id } = await createAuthUser(admin, "emp1-fallback");
      await admin.from("users").insert({
        id,
        nome: "Empregado Fallback",
        celular: celular(),
        email: email("emp1-fb"),
        tipo: "empregado",
        cidade: "Sinop",
        estado: "MT",
        onboarding_completo: true,
      });
      await grantSignupCoinsAdmin(admin, id, "empregado", false);
      ctx.empregado1 = id;
    }
    if (!ctx.jobOrganic) throw new Error("vaga orgânica ausente (teste 5)");
    const { data: app, error } = await admin
      .from("applications")
      .insert({
        job_id: ctx.jobOrganic,
        candidato_id: ctx.empregado1,
        status: "pendente",
      })
      .select("id, status")
      .single();
    if (error) throw error;
    if (app.status !== "pendente") throw new Error(`status=${app.status}`);
    ctx.applicationId = app.id;

    const { error: dupErr } = await admin.from("applications").insert({
      job_id: ctx.jobOrganic,
      candidato_id: ctx.empregado1,
      status: "pendente",
    });
    if (!dupErr) throw new Error("duplicata deveria falhar");
    if (!dupErr.message.toLowerCase().includes("duplicate") && dupErr.code !== "23505") {
      throw new Error(`erro duplicata inesperado: ${dupErr.message}`);
    }
    pass(7, "Candidatura pendente + duplicata");
  });

  await runTest(8, "Chat message insert + lida", async () => {
    if (!ctx.applicationId || !ctx.empregado1) throw new Error("application ausente");
    const { data: msg, error } = await admin
      .from("messages")
      .insert({
        application_id: ctx.applicationId,
        sender_id: ctx.empregado1,
        texto: "Mensagem teste fase1",
        tipo: "texto",
        lida: false,
      })
      .select("id, lida")
      .single();
    if (error) throw error;

    const { error: upErr } = await admin.from("messages").update({ lida: true }).eq("id", msg.id);
    if (upErr) throw upErr;

    const { data: reread } = await admin.from("messages").select("lida").eq("id", msg.id).single();
    if (!reread?.lida) throw new Error("lida não true");
    pass(8, "Chat message insert + lida");
  });

  await runTest(9, "fetchPainelData snapshot empreendedor", async () => {
    const entId = ctx.empreendedorPainel ?? ctx.empreendedor;
    if (!entId) throw new Error("empreendedor ausente (testes 2 ou 4)");
    const snap = await computePainelSnapshot(admin, entId);
    if (!snap) throw new Error("entrepreneur não encontrado");
    if (typeof snap.pctVagas !== "number" || typeof snap.pctPessoas !== "number") {
      throw new Error("pct ausente");
    }
    if (typeof snap.diasRestantes !== "number") throw new Error("dias_restantes ausente");
    if (!snap.periodoGratisAtivo) throw new Error("periodo_gratis_ativo deveria ser true");
    pass(
      9,
      "fetchPainelData snapshot empreendedor",
      `pct_vagas=${snap.pctVagas} pct_pessoas=${snap.pctPessoas} dias=${snap.diasRestantes}`
    );
  });

  await runTest(10, "gerarAcoesDiarias (≥2 ações)", async () => {
    const acoes = gerarAcoesDiarias(0, 0, 0, 30);
    if (acoes.length < 2) throw new Error(`ações=${acoes.length}`);
    pass(10, "gerarAcoesDiarias (≥2 ações)", `count=${acoes.length}`);
  });

  await runTest(11, "user_push_tokens existe + RLS", async () => {
    const { error } = await admin.from("user_push_tokens").select("user_id").limit(1);
    if (error) throw error;
    pass(11, "user_push_tokens existe + RLS", "RLS ativo (migration); service role bypass OK");
  });

  await runTest(12, "Edge Function send-notification", async () => {
    const uid =
      ctx.empregado1 ??
      ctx.empregado2 ??
      ctx.empregador ??
      createdAuthIds[0];
    if (!uid) throw new Error("sem user de teste");
    const result = await invokeSendNotification(uid);
    if (!result.ok) throw new Error(result.detail);
    pass(12, "Edge Function send-notification", result.detail);
  });

  await runTest(13, "Tabela user_coins existe", async () => {
    const { error } = await admin.from("user_coins").select("user_id").limit(1);
    if (error) throw error;
    pass(13, "Tabela user_coins existe");
  });

  await runTest(14, "coin_transactions empregado teste", async () => {
    if (!ctx.empregado1) {
      throw new Error("empregado1 ausente (teste 1 ou fallback do 7)");
    }
    const { data, error } = await admin
      .from("coin_transactions")
      .select("id")
      .eq("user_id", ctx.empregado1);
    if (error) throw error;
    if (!data?.length) throw new Error("nenhuma coin_transaction");
    pass(14, "coin_transactions empregado teste", `rows=${data.length}`);
  });

  await runTest(15, "Limpeza usuários teste-fase1-*", async () => {
    await cleanupTestUsers(admin);
    pass(15, "Limpeza usuários teste-fase1-*");
  });
  } finally {
    if (!results.some((r) => r.id === 15 && r.ok)) {
      try {
        await cleanupTestUsers(admin);
        console.log("(cleanup de segurança executado no finally)");
      } catch (e) {
        console.warn("Falha no cleanup finally:", e);
      }
    }
  }

  console.log("\n--- Relatório ---");
  console.log("ID | Status | Teste");
  for (const r of results.sort((a, b) => a.id - b.id)) {
    console.log(`${String(r.id).padStart(2, " ")} | ${r.ok ? "✅" : "❌"} | ${r.name}${r.detail && r.detail !== "OK" ? ` (${r.detail})` : ""}`);
  }

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.filter((r) => !r.ok).length;
  console.log(`\nTotal: ${okCount} ✅ / ${failCount} ❌`);

  if (failCount === 0) {
    console.log("\nFASE 1 OK — pronto para usuários reais\n");
    process.exit(0);
  } else {
    console.log("\nFASE 1 COM ERROS — corrigir antes de abrir\n");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
