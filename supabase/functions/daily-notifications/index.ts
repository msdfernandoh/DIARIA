import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const META_DIAS = 30;

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function pct(current: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.round((current / meta) * 100);
}

function diasRestantesMeta(criadoEm: string): number {
  const startMs = new Date(criadoEm).getTime();
  const diasDecorridos = Math.floor((Date.now() - startMs) / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(0, META_DIAS - diasDecorridos);
}

async function sendPush(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  titulo: string,
  corpo: string,
  data: Record<string, unknown>
) {
  const { data: tokens } = await supabase.from("user_push_tokens").select("token").eq("user_id", userId);
  if (!tokens?.length) return;
  const messages = tokens.map((t) => ({
    to: t.token,
    title: titulo,
    body: corpo,
    data,
    sound: "default",
    badge: 1,
  }));
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
  } catch (e) {
    console.error("push fail", userId, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret");
  if (cronSecret && headerSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const amanha = tomorrowIso();
  let jobsNotified = 0;
  let metasNotified = 0;

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, titulo, empregador_id, vagas_restantes")
    .eq("data_inicio", amanha)
    .eq("ativa", true)
    .gt("vagas_restantes", 0);

  for (const job of jobs ?? []) {
    await sendPush(
      supabase,
      job.empregador_id,
      `Sua vaga de ${job.titulo} é amanhã!`,
      `${job.vagas_restantes} vagas ainda em aberto`,
      { tipo: "vaga", jobId: job.id }
    );
    jobsNotified += 1;
  }

  const { data: entrepreneurs } = await supabase
    .from("entrepreneurs")
    .select("user_id, meta_vagas, meta_pessoas, criado_em");

  for (const ent of entrepreneurs ?? []) {
    const dias = diasRestantesMeta(ent.criado_em);
    if (dias !== 7) continue;

    const { count: grupoCount } = await supabase
      .from("user_group")
      .select("user_id", { count: "exact", head: true })
      .eq("empreendedor_id", ent.user_id)
      .eq("ativo", true);

    const { data: members } = await supabase
      .from("user_group")
      .select("user_id")
      .eq("empreendedor_id", ent.user_id)
      .eq("ativo", true);

    const empregadorIds: string[] = [];
    for (const m of members ?? []) {
      const { data: u } = await supabase.from("users").select("tipo").eq("id", m.user_id).maybeSingle();
      if (u?.tipo === "empregador") empregadorIds.push(m.user_id);
    }

    let vagasAtivas = 0;
    if (empregadorIds.length) {
      const { count } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .in("empregador_id", empregadorIds)
        .eq("ativa", true);
      vagasAtivas = count ?? 0;
    }

    const totalGrupo = grupoCount ?? 0;
    const pctGeral = Math.round(
      (pct(vagasAtivas, ent.meta_vagas) + pct(totalGrupo, ent.meta_pessoas)) / 2
    );
    if (pctGeral >= 60) continue;

    const faltamPessoas = Math.max(0, ent.meta_pessoas - totalGrupo);
    const faltamVagas = Math.max(0, ent.meta_vagas - vagasAtivas);

    await sendPush(
      supabase,
      ent.user_id,
      `⚠️ Meta em risco: ${dias} dias restantes`,
      `Faltam ${faltamPessoas} pessoas e ${faltamVagas} vagas`,
      { tipo: "painel" }
    );
    metasNotified += 1;
  }

  return new Response(
    JSON.stringify({ ok: true, jobsNotified, metasNotified }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
