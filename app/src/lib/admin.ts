import { supabase } from "./supabase";

export type AdminMetrics = {
  usersEmpregado: number;
  usersEmpregador: number;
  usersEmpreendedor: number;
  vagasAtivas: number;
  diariasConcluidas: number;
  empreendedoresAtivos: number;
  receitaMes: number;
  volumeMes: number;
};

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const from = monthStart.toISOString();

  const [emp, empreg, entr, jobs, apps, ents, comm] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("tipo", "empregado"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("tipo", "empregador"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("tipo", "empreendedor"),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("ativa", true),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "concluida"),
    supabase.from("entrepreneurs").select("user_id", { count: "exact", head: true }),
    supabase
      .from("commissions")
      .select("valor_plataforma, valor_bruto")
      .gte("criado_em", from),
  ]);

  const receitaMes = (comm.data ?? []).reduce((s, c) => s + Number(c.valor_plataforma ?? 0), 0);
  const volumeMes = (comm.data ?? []).reduce((s, c) => s + Number(c.valor_bruto ?? 0), 0);

  return {
    usersEmpregado: emp.count ?? 0,
    usersEmpregador: empreg.count ?? 0,
    usersEmpreendedor: entr.count ?? 0,
    vagasAtivas: jobs.count ?? 0,
    diariasConcluidas: apps.count ?? 0,
    empreendedoresAtivos: ents.count ?? 0,
    receitaMes,
    volumeMes,
  };
}

export async function getPlatformConfig(key: string): Promise<string | null> {
  const { data } = await supabase.from("platform_config").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

export async function setPlatformConfig(key: string, value: string): Promise<void> {
  const { error } = await supabase.from("platform_config").upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchEntrepreneursAdmin() {
  const { data, error } = await supabase
    .from("entrepreneurs")
    .select("user_id, codigo, nome_instancia, cidade, status, users(nome, celular)")
    .order("criado_em", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}
