import type { FeedFilters, JobRow } from "../types/job";
import { jobPriority } from "./jobFeedPriority";
import { supabase } from "./supabase";

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export { jobPriority } from "./jobFeedPriority";

export async function fetchFeedJobs(
  userId: string,
  filters: FeedFilters,
  offset = 0,
  limit = 20
): Promise<JobRow[]> {
  const { data: user } = await supabase
    .from("users")
    .select("cidade, estado, lat, lng")
    .eq("id", userId)
    .maybeSingle();

  const { data: group } = await supabase
    .from("user_group")
    .select("empreendedor_id")
    .eq("user_id", userId)
    .eq("ativo", true)
    .maybeSingle();

  const userCidade = user?.cidade ?? null;
  const userEstado = user?.estado ?? null;
  /** Sem vínculo ativo → null: vagas destaque_nivel=grupo caem para prioridade 5 */
  const userGrupoId = group?.empreendedor_id ?? null;

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("ativa", true)
    .eq("pausada", false)
    .gt("vagas_restantes", 0)
    .order("criado_em", { ascending: false })
    .range(0, 199);

  if (filters.urgente) query = query.eq("urgente", true);
  if (filters.categoria) query = query.ilike("categoria", `%${filters.categoria}%`);

  const { data: jobs, error } = await query;
  if (error) throw error;
  if (!jobs?.length) return [];

  const empregadorIds = [...new Set(jobs.map((j) => j.empregador_id))];
  const { data: empregadores } = await supabase
    .from("users")
    .select("id, nome")
    .in("id", empregadorIds);

  const nomeMap = new Map((empregadores ?? []).map((e) => [e.id, e.nome]));

  let rows: JobRow[] = jobs.map((j) => {
    const row = j as JobRow;
    row.empregador_nome = nomeMap.get(j.empregador_id) ?? "Contratante";
    row.prioridade = jobPriority(row, userCidade, userEstado, userGrupoId);
    if (user?.lat != null && user?.lng != null && j.lat != null && j.lng != null) {
      row.distancia_km = haversineKm(
        Number(user.lat),
        Number(user.lng),
        Number(j.lat),
        Number(j.lng)
      );
    }
    return row;
  });

  rows = rows.filter((j) => {
    const remoto = j.formato === "remoto";
    const localOk = userCidade && j.cidade === userCidade;
    if (!remoto && !localOk) return false;
    if (filters.formato === "remoto" || filters.formato === "home_office") {
      return j.formato === "remoto";
    }
    if (filters.formato === "presencial") {
      return j.formato !== "remoto";
    }
    return true;
  });

  const q = filters.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (j) =>
        j.titulo.toLowerCase().includes(q) ||
        (j.categoria ?? "").toLowerCase().includes(q) ||
        (j.cidade ?? "").toLowerCase().includes(q) ||
        (j.empregador_nome ?? "").toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) => {
    const pa = a.prioridade ?? 5;
    const pb = b.prioridade ?? 5;
    if (pa !== pb) return pa - pb;
    if (a.urgente !== b.urgente) return a.urgente ? -1 : 1;
    return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
  });

  return rows.slice(offset, offset + limit);
}
