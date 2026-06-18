/**
 * Jornada do trabalhador (empregado) — app onboarding + web cadastro/vagas
 * Uso: npm run test:trabalhador (em app/)
 * Env: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
 */
import * as fs from "fs";
import * as path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

loadEnvFile();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const APP_ONBOARDING = path.join(REPO_ROOT, "app", "app", "(onboarding)", "empregado");
const WEB_ROOT = path.join(REPO_ROOT, "web");

type Result = { id: string; name: string; ok: boolean; detail: string };
const results: Result[] = [];
const createdAuthIds: string[] = [];

function loadEnvFile() {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "..", ".env"),
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

function pass(id: string, name: string, detail = "OK") {
  if (results.some((r) => r.id === id)) return;
  results.push({ id, name, ok: true, detail });
  console.log(`✅ ${id} ${name}${detail !== "OK" ? ` — ${detail}` : ""}`);
}

function fail(id: string, name: string, detail: string) {
  if (results.some((r) => r.id === id)) return;
  results.push({ id, name, ok: false, detail });
  console.log(`❌ ${id} ${name} — ${detail}`);
}

async function runTest(id: string, name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    if (!results.some((r) => r.id === id)) pass(id, name);
  } catch (e) {
    fail(id, name, e instanceof Error ? e.message : String(e));
  }
}

function readFile(relFromRepo: string) {
  const p = path.join(REPO_ROOT, relFromRepo);
  if (!fs.existsSync(p)) throw new Error(`Arquivo ausente: ${relFromRepo}`);
  return fs.readFileSync(p, "utf8");
}

function email(tag: string) {
  return `teste-trab-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@diariadacidade.com.br`;
}

function celular() {
  return `5599${Math.floor(10000000 + Math.random() * 89999999)}`;
}

const ONBOARDING_CHAIN: { file: string; next?: string; step?: number }[] = [
  { file: "dados.tsx", next: "trabalho", step: 1 },
  { file: "trabalho.tsx", next: "habilidades", step: 2 },
  { file: "habilidades.tsx", next: "valor", step: 3 },
  { file: "valor.tsx", next: "disponibilidade", step: 4 },
  { file: "disponibilidade.tsx", next: "carga-horaria", step: 5 },
  { file: "carga-horaria.tsx", next: "transporte", step: 6 },
  { file: "transporte.tsx", next: "codigo", step: 7 },
  { file: "codigo.tsx", next: "experiencias", step: 8 },
  { file: "experiencias.tsx", next: "contato", step: 9 },
  { file: "contato.tsx", step: 10 },
];

async function createAuthUser(admin: SupabaseClient, tag: string, password: string) {
  const mail = email(tag);
  const { data, error } = await admin.auth.admin.createUser({
    email: mail,
    password,
    email_confirm: true,
    user_metadata: { nome: "Teste Trabalhador", tipo: "empregado", celular: celular() },
  });
  if (error || !data.user) throw error ?? new Error("createUser falhou");
  createdAuthIds.push(data.user.id);
  return { id: data.user.id, email: mail, password };
}

async function cleanup(admin: SupabaseClient) {
  for (const id of createdAuthIds) {
    await admin.from("applications").delete().eq("candidato_id", id);
    await admin.from("user_skills").delete().eq("user_id", id);
    await admin.from("user_availability").delete().eq("user_id", id);
    await admin.from("user_coins").delete().eq("user_id", id);
    await admin.from("coin_transactions").delete().eq("user_id", id);
    await admin.from("users").delete().eq("id", id);
    try {
      await admin.auth.admin.deleteUser(id);
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  console.log("\n=== Jornada trabalhador — checklist ===\n");

  await runTest("S1", "Telas onboarding app (10 arquivos)", () => {
    for (const s of ONBOARDING_CHAIN) {
      const p = path.join(APP_ONBOARDING, s.file);
      if (!fs.existsSync(p)) throw new Error(`Falta ${s.file}`);
    }
  });

  await runTest("S2", "Sequência de navegação app onboarding", () => {
    for (const s of ONBOARDING_CHAIN) {
      if (!s.next) continue;
      const content = fs.readFileSync(path.join(APP_ONBOARDING, s.file), "utf8");
      if (!content.includes(`empregado/${s.next}`)) {
        throw new Error(`${s.file} não navega para ${s.next}`);
      }
      if (s.step && !content.includes(`step={${s.step}}`) && !content.includes(`step={${s.step} `)) {
        throw new Error(`${s.file} step esperado ${s.step}`);
      }
    }
  });

  await runTest("S3", "completeEmpregadoOnboarding persiste campos principais", () => {
    const lib = readFile("app/src/lib/empregadoOnboarding.ts");
    const required = [
      "valor_min_dia",
      "valor_max_dia",
      "tem_moto",
      "disponivel_qualquer_dia",
      "horas_por_dia",
      "tipo_jornada",
      "user_skills",
      "onboarding_completo: true",
    ];
    for (const k of required) {
      if (!lib.includes(k)) throw new Error(`empregadoOnboarding.ts sem ${k}`);
    }
  });

  await runTest("S4", "Web trabalhe usa cadastro real (não lead-form)", () => {
    const html = readFile("web/trabalhe.html");
    if (html.includes("initLeadForm")) throw new Error("trabalhe.html ainda chama initLeadForm");
    if (!html.includes("signup-trabalhador-rapido-form")) {
      throw new Error("Formulário rápido ausente");
    }
    if (!html.includes("signup-trabalhador-form")) throw new Error("Formulário completo ausente");
    if (!html.includes("trabalhe-cadastro.js")) throw new Error("trabalhe-cadastro.js não incluído");
  });

  await runTest("S5", "Web páginas trabalhador + rewrites", () => {
    for (const f of [
      "web/vagas-disponiveis.html",
      "web/completar-perfil-trabalhador.html",
      "web/login-trabalhador.html",
      "web/minhas-candidaturas.html",
      "web/js/trabalhador-auth.js",
    ]) {
      readFile(f);
    }
    const vercel = readFile("vercel.json");
    if (!vercel.includes("vagas-disponiveis")) throw new Error("rewrite vagas ausente");
    if (!vercel.includes("completar-perfil-trabalhador")) {
      throw new Error("rewrite completar perfil ausente");
    }
  });

  await runTest("S6", "Auth web: duplicata classificada (não só existing)", () => {
    const auth = readFile("web/js/trabalhador-auth.js");
    const cadastro = readFile("web/js/trabalhe-cadastro.js");
    if (auth.includes("existing: true")) {
      throw new Error("signUpWorker ainda retorna existing: true genérico");
    }
    if (!auth.includes("handleDuplicateEmailSignup")) {
      throw new Error("Falta handleDuplicateEmailSignup");
    }
    if (!auth.includes("resume_onboarding")) {
      throw new Error("Falta tipo resume_onboarding");
    }
    if (!auth.includes("TRABALHADOR_CADASTRO_RETOMADO")) {
      throw new Error("Falta log de retomada");
    }
    if (!cadastro.includes("redirectLoggedInWorkerFromSignupPage")) {
      throw new Error("trabalhe-cadastro não redireciona usuário logado");
    }
  });

  await runTest("S7", "App empregadoAuth cadastro com retomada", () => {
    const lib = readFile("app/src/lib/empregadoAuth.ts");
    if (!lib.includes("registerEmpregado")) throw new Error("registerEmpregado ausente");
    if (!lib.includes("resume_onboarding")) throw new Error("resume_onboarding ausente no app");
  });

  if (!SUPABASE_URL || !SERVICE_KEY) {
    fail("I0", "Integração Supabase", "SUPABASE_SERVICE_KEY / URL ausentes — só testes estáticos");
    printSummary();
    process.exit(results.some((r) => !r.ok) ? 1 : 0);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let worker: { id: string; email: string; password: string } | null = null;
  let jobId: string | null = null;
  let empregadorId: string | null = null;

  try {
    await runTest("I1", "Criar auth + users empregado (tipo correto)", async () => {
      worker = await createAuthUser(admin, "worker", "SenhaTeste8!");
      const cel = celular();
      const { error } = await admin.from("users").insert({
        id: worker.id,
        nome: "Maria Teste",
        celular: cel,
        email: worker.email,
        tipo: "empregado",
        cidade: "Sinop",
        estado: "MT",
        cep: "78550000",
        trabalha_presencial: true,
        trabalha_remoto: true,
        onboarding_completo: false,
        termo_aceito_em: new Date().toISOString(),
      });
      if (error) throw error;
      const { data: row } = await admin.from("users").select("tipo").eq("id", worker.id).single();
      if (row?.tipo !== "empregado") throw new Error(`tipo=${row?.tipo}`);
    });

    await runTest("I2", "Modalidades + habilidades + agenda (perfil)", async () => {
      if (!worker) throw new Error("worker ausente");
      await admin.from("users").update({
        trabalha_presencial: true,
        trabalha_remoto: false,
        valor_min_dia: 100,
        valor_max_dia: 250,
        tem_moto: true,
      }).eq("id", worker.id);

      await admin.from("user_skills").insert([
        { user_id: worker.id, skill: "diarista" },
        { user_id: worker.id, skill: "garcom" },
      ]);

      const availPayload: Record<string, unknown> = {
        user_id: worker.id,
        dias_semana: [1, 2, 3, 4, 5],
        turnos: ["manha", "tarde"],
        raio_km: 10,
        recorrente: true,
        updated_at: new Date().toISOString(),
      };
      let { error: avErr } = await admin.from("user_availability").upsert(
        {
          ...availPayload,
          disponivel_qualquer_dia: false,
          horas_por_dia: 8,
          horas_por_semana: 40,
          tipo_jornada: ["diarias_avulsas"],
        },
        { onConflict: "user_id" }
      );
      if (avErr) {
        ({ error: avErr } = await admin.from("user_availability").upsert(availPayload, {
          onConflict: "user_id",
        }));
      }
      if (avErr) throw avErr;

      const { data: skills } = await admin.from("user_skills").select("skill").eq("user_id", worker.id);
      if ((skills?.length ?? 0) < 2) throw new Error("skills não salvas");
    });

    await runTest("I3", "Finalizar onboarding empregado", async () => {
      if (!worker) throw new Error("worker ausente");
      const { error } = await admin.from("users").update({ onboarding_completo: true }).eq("id", worker.id);
      if (error) throw error;
    });

    await runTest("I4", "Login anon (signIn) trabalhador", async () => {
      if (!worker || !ANON_KEY) throw new Error("worker ou ANON_KEY ausente");
      const client = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await client.auth.signInWithPassword({
        email: worker.email,
        password: worker.password,
      });
      if (error) throw error;
      if (!data.session?.access_token) throw new Error("sem sessão");
    });

    await runTest("I5", "Lista de vagas (jobs ativas) visível autenticado", async () => {
      if (!worker || !ANON_KEY) throw new Error("worker ou ANON_KEY ausente");
      const { id: empId, email: empMail } = await createAuthUser(admin, "empregador-vaga");
      empregadorId = empId;
      await admin.from("users").insert({
        id: empId,
        nome: "Empresa Teste",
        celular: celular(),
        email: empMail,
        tipo: "empregador",
        cidade: "Sinop",
        estado: "MT",
        onboarding_completo: true,
      });

      const { data: job, error: jobErr } = await admin
        .from("jobs")
        .insert({
          empregador_id: empId,
          titulo: "Diarista teste checklist",
          categoria: "limpeza",
          formato: "presencial",
          cidade: "Sinop",
          estado: "MT",
          valor: 150,
          ativa: true,
          vagas_total: 1,
          vagas_restantes: 1,
          is_demo: false,
        })
        .select("id")
        .single();
      if (jobErr) throw jobErr;
      jobId = job.id;

      const client = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await client.auth.signInWithPassword({ email: worker.email, password: worker.password });
      const { data: one, error } = await client.from("jobs").select("id, titulo").eq("id", jobId).maybeSingle();
      if (error) throw error;
      if (!one) throw new Error("vaga não visível para trabalhador autenticado (RLS)");

      const { data: jobs, error: listErr } = await client
        .from("jobs")
        .select("id")
        .eq("ativa", true)
        .gt("vagas_restantes", 0)
        .limit(10);
      if (listErr) throw listErr;
      if (!jobs?.length) throw new Error("listagem de vagas ativas vazia");
      pass("I5", "Lista de vagas (jobs ativas) visível autenticado", `feed=${jobs.length}`);
    });

    await runTest("I6", "Candidatura a vaga", async () => {
      if (!worker || !jobId || !ANON_KEY) throw new Error("fixtures ausentes");
      const client = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await client.auth.signInWithPassword({ email: worker.email, password: worker.password });
      const { data: app, error } = await client
        .from("applications")
        .insert({
          job_id: jobId,
          candidato_id: worker.id,
          status: "pendente",
          mensagem_inicial: "Teste checklist",
        })
        .select("id")
        .single();
      if (error) throw error;
      await client.from("messages").insert({
        application_id: app.id,
        sender_id: worker.id,
        texto: "💼 Candidatura enviada via teste",
        tipo: "sistema",
      });
    });

    if (ANON_KEY) {
      await runTest("I7", "SignUp web (anon) e-mail novo", async () => {
        const mail = email("signup-web");
        const pwd = "SenhaWebTest8!";
        const client = createClient(SUPABASE_URL, ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await client.auth.signUp({
          email: mail,
          password: pwd,
          options: {
            data: {
              nome: "Web Signup",
              tipo: "empregado",
              celular: celular(),
              cidade: "Sinop",
              estado: "MT",
            },
          },
        });
        if (error) throw error;
        if (!data.user) throw new Error("sem user");
        createdAuthIds.push(data.user.id);
        const hasIdentity = (data.user.identities?.length ?? 0) > 0;
        if (!hasIdentity && !data.session) {
          throw new Error("signup sem identity nem session — possível duplicata/config");
        }
        if (data.session?.user) {
          const { error: uErr } = await client.from("users").upsert({
            id: data.user.id,
            nome: "Web Signup",
            celular: celular(),
            email: mail,
            tipo: "empregado",
            cidade: "Sinop",
            estado: "MT",
            onboarding_completo: false,
            termo_aceito_em: new Date().toISOString(),
          });
          if (uErr) throw uErr;
        }
        pass("I7", "SignUp web (anon) e-mail novo", hasIdentity ? "identity ok" : "session ok");
      });
    } else {
      fail("I7", "SignUp web (anon)", "EXPO_PUBLIC_SUPABASE_ANON_KEY ausente");
    }
  } finally {
    if (jobId) await admin.from("applications").delete().eq("job_id", jobId);
    if (jobId) await admin.from("jobs").delete().eq("id", jobId);
    if (empregadorId) {
      await admin.from("users").delete().eq("id", empregadorId);
      try {
        await admin.auth.admin.deleteUser(empregadorId);
      } catch {
        /* ignore */
      }
    }
    await cleanup(admin);
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok);
  console.log(`\n--- ${ok}/${results.length} testes OK ---`);
  if (bad.length) {
    console.log("Falhas:");
    for (const b of bad) console.log(`  • ${b.id} ${b.name}: ${b.detail}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
