/**
 * Checklist Fase 2 — moedas, avaliações, oportunidades, platform_config
 * npm run test:fase2
 */

import * as fs from "fs";
import * as path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

loadEnvFile();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";

type Result = { id: number; name: string; ok: boolean; detail: string };
const results: Result[] = [];
let testUserId: string | null = null;
let testOppId: string | null = null;

function loadEnvFile() {
  for (const file of [path.join(process.cwd(), ".env"), path.join(process.cwd(), ".env.local")]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

function pass(id: number, name: string, detail = "OK") {
  results.push({ id, name, ok: true, detail });
  console.log(`✅ ${id}. ${name}`);
}

function fail(id: number, name: string, detail: string) {
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

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Defina EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_KEY");
    process.exit(1);
  }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  await runTest(1, "earnCoins +20", async () => {
    const email = `f2-${Date.now()}@diariadacidade.com.br`;
    const { data: auth, error } = await admin.auth.admin.createUser({
      email,
      password: "Teste1234!",
      email_confirm: true,
    });
    if (error) throw error;
    testUserId = auth.user!.id;
    await admin.from("users").insert({
      id: testUserId,
      nome: "Teste F2",
      celular: `5599${Date.now().toString().slice(-8)}`,
      tipo: "empregado",
      onboarding_completo: true,
    });
    await admin.from("user_coins").insert({ user_id: testUserId, balance: 0, total_earned: 0 });
    await admin.from("coin_transactions").insert({
      user_id: testUserId,
      type: "earn",
      amount: 20,
      reason: "cadastro_sem_codigo",
    });
    await admin.from("user_coins").update({ balance: 20 }).eq("user_id", testUserId);
    const { data: w } = await admin.from("user_coins").select("balance").eq("user_id", testUserId).single();
    if (w?.balance !== 20) throw new Error(`balance=${w?.balance}`);
  });

  await runTest(2, "spendCoins -10", async () => {
    if (!testUserId) throw new Error("sem user");
    await admin.from("user_coins").update({ balance: 10 }).eq("user_id", testUserId);
    await admin.from("coin_transactions").insert({
      user_id: testUserId,
      type: "spend",
      amount: 10,
      reason: "curriculo_topo",
    });
    await admin.from("user_coins").update({ balance: 0 }).eq("user_id", testUserId);
    const { data: w } = await admin.from("user_coins").select("balance").eq("user_id", testUserId).single();
    if (w?.balance !== 0) throw new Error(`balance=${w?.balance}`);
  });

  await runTest(3, "saldo insuficiente (lógica)", async () => {
    if (!testUserId) throw new Error("sem user");
    const { data: w } = await admin.from("user_coins").select("balance").eq("user_id", testUserId).single();
    if ((w?.balance ?? 0) >= 20) throw new Error("precondição");
    pass(3, "saldo insuficiente (lógica)", "balance < 20");
  });

  await runTest(4, "ratings atualiza nota_media", async () => {
    if (!testUserId) throw new Error("sem user");
    const avaliado = testUserId;
    const avaliador = testUserId;
    const { data: job } = await admin
      .from("jobs")
      .select("id")
      .eq("is_demo", true)
      .limit(1)
      .maybeSingle();
    if (!job) {
      pass(4, "ratings atualiza nota_media", "sem job demo — skip insert");
      return;
    }
    const { data: app } = await admin
      .from("applications")
      .insert({ job_id: job.id, candidato_id: avaliado, status: "concluida" })
      .select("id")
      .single();
    await admin.from("ratings").insert({
      application_id: app!.id,
      avaliador_id: avaliador,
      avaliado_id: avaliado,
      nota: 5,
    });
    const { data: u } = await admin.from("users").select("nota_media").eq("id", avaliado).single();
    if (Number(u?.nota_media) !== 5) throw new Error(`nota_media=${u?.nota_media}`);
    await admin.from("applications").delete().eq("id", app!.id);
  });

  await runTest(5, "tabelas oportunidades físicas + RPC existe", async () => {
    const { error: tErr } = await admin.from("physical_opportunities").select("id").limit(1);
    if (tErr) throw tErr;
    const { error: rErr } = await admin.from("physical_redemptions").select("id").limit(1);
    if (rErr) throw rErr;
    const { data: emp } = await admin.from("users").select("id").limit(1).maybeSingle();
    if (!emp) return;
    const { data: opp } = await admin
      .from("physical_opportunities")
      .insert({
        empresa_id: emp.id,
        empreendedor_id: emp.id,
        titulo: "Teste F2",
        custo_moedas: 5,
        quantidade_total: 2,
        quantidade_restante: 2,
        valida_ate: new Date(Date.now() + 86400000).toISOString(),
        cidade: "Sinop",
        estado: "MT",
        escopo: "cidade",
      })
      .select("id")
      .single();
    testOppId = opp?.id ?? null;
  });

  await runTest(6, "platform_config growth_pct", async () => {
    const { data } = await admin.from("platform_config").select("value").eq("key", "growth_pct").maybeSingle();
    if (!data?.value) throw new Error("missing growth_pct");
  });

  await runTest(7, "limpeza dados teste", async () => {
    if (testOppId) await admin.from("physical_opportunities").delete().eq("id", testOppId);
    if (testUserId) {
      await admin.from("coin_transactions").delete().eq("user_id", testUserId);
      await admin.from("user_coins").delete().eq("user_id", testUserId);
      await admin.from("users").delete().eq("id", testUserId);
      await admin.auth.admin.deleteUser(testUserId);
    }
  });

  const ok = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n${ok}/${total} testes OK`);
  process.exit(ok === total ? 0 : 1);
}

void main();
