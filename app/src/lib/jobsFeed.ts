import { CATEGORY_SKILL_IDS } from "../constants/publishJob";
import type { FeedFilters, JobRow } from "../types/job";
import { jobPriority } from "./jobFeedPriority";
import { supabase } from "./supabase";

/** Categorias de vaga (jobs.categoria) compatíveis com cada skill do onboarding */
const ONBOARDING_SKILL_JOB_CATEGORIES: Record<string, string[]> = {
  diarista: ["limpeza"],
  garcom: ["garcom"],
  churrasqueiro: ["churrasco"],
  chapa: ["chapa"],
  obras: ["obras"],
  mudancas: ["fretes"],
  motoboy: ["motoboy"],
  baba: ["cuidador"],
  cabo_eleitoral: ["eleitoral"],
  home_office: ["home_office"],
  vendas: ["vendas"],
  jardim: ["jardineiro"],
  educacao: ["educacao"],
  beleza: ["beleza"],
  eventos: ["eventos"],
  eletricista: ["obras"],
  pintor: ["obras"],
  pets: ["cuidador"],
  digital: ["home_office"],
  cabeleireiro: ["beleza"],
};

export type EmpregadoFeedProfile = {
  skills: string[];
  valorMinDia: number | null;
  valorMaxDia: number | null;
  trabalhaPresencial: boolean;
  trabalhaRemoto: boolean;
  cidade: string | null;
  estado: string | null;
  lat: number | null;
  lng: number | null;
  raioKm: number;
  temMoto: boolean;
  temCarro: boolean;
  diasSemana: number[];
  turnos: string[];
};

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

function normalizeCategoryId(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function jobMatchesUserSkills(jobCategory: string, userSkills: string[]): boolean {
  if (!userSkills.length) return false;
  const cat = normalizeCategoryId(jobCategory);
  const catKey =
    Object.keys(CATEGORY_SKILL_IDS).find((k) => normalizeCategoryId(k) === cat) ?? cat;
  const linkedSkills = CATEGORY_SKILL_IDS[catKey] ?? [];
  if (linkedSkills.some((s) => userSkills.includes(s))) return true;
  return userSkills.some((skill) => {
    const cats = ONBOARDING_SKILL_JOB_CATEGORIES[skill];
    if (cats?.some((c) => normalizeCategoryId(c) === cat)) return true;
    return normalizeCategoryId(skill) === cat;
  });
}

export function isFeedProfilePersonalized(profile: EmpregadoFeedProfile): boolean {
  return (
    profile.skills.length > 0 &&
    profile.diasSemana.length > 0 &&
    profile.turnos.length > 0
  );
}

export async function fetchEmpregadoFeedProfile(
  userId: string
): Promise<EmpregadoFeedProfile | null> {
  const [userRes, availRes, skillsRes] = await Promise.all([
    supabase
      .from("users")
      .select(
        "valor_min_dia, valor_max_dia, tem_moto, tem_carro, trabalha_presencial, trabalha_remoto, cidade, estado, lat, lng"
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_availability")
      .select("dias_semana, turnos, raio_km")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("user_skills").select("skill").eq("user_id", userId),
  ]);

  if (userRes.error) throw userRes.error;
  if (availRes.error) throw availRes.error;
  if (skillsRes.error) throw skillsRes.error;
  if (!userRes.data) return null;

  const u = userRes.data;
  const avail = availRes.data;

  return {
    skills: (skillsRes.data ?? []).map((r) => r.skill),
    valorMinDia: u.valor_min_dia != null ? Number(u.valor_min_dia) : null,
    valorMaxDia: u.valor_max_dia != null ? Number(u.valor_max_dia) : null,
    trabalhaPresencial: u.trabalha_presencial ?? true,
    trabalhaRemoto: u.trabalha_remoto ?? false,
    cidade: u.cidade ?? null,
    estado: u.estado ?? null,
    lat: u.lat != null ? Number(u.lat) : null,
    lng: u.lng != null ? Number(u.lng) : null,
    raioKm: avail?.raio_km != null ? Number(avail.raio_km) : 10,
    temMoto: u.tem_moto ?? false,
    temCarro: u.tem_carro ?? false,
    diasSemana: avail?.dias_semana ?? [],
    turnos: avail?.turnos ?? [],
  };
}

function valorInProfileRange(
  job: JobRow,
  min: number | null,
  max: number | null
): boolean {
  if (job.valor == null) return false;
  if (min != null && job.valor < min) return false;
  if (max != null && job.valor > max) return false;
  return min != null || max != null;
}


function jobWithinProfileLocation(
  job: JobRow,
  profile: EmpregadoFeedProfile,
  userLat: number | null,
  userLng: number | null,
  distanciaKm: number | undefined
): boolean {
  const remoto = job.formato === "remoto";
  const presencial = !remoto;

  if (remoto && profile.trabalhaRemoto) return true;
  if (!presencial || !profile.trabalhaPresencial) return false;

  if (profile.cidade && job.cidade === profile.cidade) return true;

  if (
    userLat != null &&
    userLng != null &&
    job.lat != null &&
    job.lng != null &&
    distanciaKm != null
  ) {
    const raio = profile.raioKm;
    if (raio === 0 || distanciaKm <= raio) return true;
  }

  return false;
}

function passesManualFormatoFilter(job: JobRow, filters: FeedFilters): boolean {
  if (filters.formato === "remoto" || filters.formato === "home_office") {
    return job.formato === "remoto";
  }
  if (filters.formato === "presencial") {
    return job.formato !== "remoto";
  }
  return true;
}

function compareOrganicFeed(
  a: JobRow,
  b: JobRow,
  profile: EmpregadoFeedProfile
): number {
  const skills = profile.skills;
  const skA = jobMatchesUserSkills(a.categoria, skills) ? 0 : 1;
  const skB = jobMatchesUserSkills(b.categoria, skills) ? 0 : 1;
  if (skA !== skB) return skA - skB;

  const vA = valorInProfileRange(a, profile.valorMinDia, profile.valorMaxDia) ? 0 : 1;
  const vB = valorInProfileRange(b, profile.valorMinDia, profile.valorMaxDia) ? 0 : 1;
  if (vA !== vB) return vA - vB;

  if (a.urgente !== b.urgente) return a.urgente ? -1 : 1;
  return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
}

export { jobPriority } from "./jobFeedPriority";

export async function fetchFeedJobs(
  userId: string,
  filters: FeedFilters,
  offset = 0,
  limit = 20
): Promise<JobRow[]> {
  const profile = await fetchEmpregadoFeedProfile(userId);

  const { data: group } = await supabase
    .from("user_group")
    .select("empreendedor_id")
    .eq("user_id", userId)
    .eq("ativo", true)
    .maybeSingle();

  const userCidade = profile?.cidade ?? null;
  const userEstado = profile?.estado ?? null;
  const userGrupoId = group?.empreendedor_id ?? null;
  const userLat = profile?.lat ?? null;
  const userLng = profile?.lng ?? null;

  const manualFormato = filters.formato != null;
  const manualCategoria = Boolean(filters.categoria?.trim());
  const manualCompat = filters.compativelComigo === true;
  const manualAutoOverride = manualFormato || manualCategoria;

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("ativa", true)
    .eq("pausada", false)
    .eq("is_demo", false)
    .gt("vagas_restantes", 0)
    .order("criado_em", { ascending: false })
    .range(0, 199);

  if (filters.urgente) query = query.eq("urgente", true);
  if (manualCategoria) query = query.ilike("categoria", `%${filters.categoria}%`);

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
    if (userLat != null && userLng != null && j.lat != null && j.lng != null) {
      row.distancia_km = haversineKm(
        userLat,
        userLng,
        Number(j.lat),
        Number(j.lng)
      );
    }
    return row;
  });

  if (manualCompat && profile?.skills.length) {
    rows = rows.filter((j) => jobMatchesUserSkills(j.categoria, profile.skills));
  } else if (!manualAutoOverride && profile) {
    rows = rows.filter((j) =>
      jobWithinProfileLocation(j, profile, userLat, userLng, j.distancia_km ?? undefined)
    );
  } else if (!manualAutoOverride && !profile) {
    rows = rows.filter((j) => {
      const remoto = j.formato === "remoto";
      const localOk = userCidade && j.cidade === userCidade;
      if (!remoto && !localOk) return false;
      return true;
    });
  }

  if (manualFormato) {
    rows = rows.filter((j) => passesManualFormatoFilter(j, filters));
  }

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

  const useProfileSort =
    profile != null && !manualAutoOverride && !manualCompat;

  rows.sort((a, b) => {
    const pa = a.prioridade ?? 5;
    const pb = b.prioridade ?? 5;
    if (pa !== pb) return pa - pb;

    if (useProfileSort && pa === 5 && pb === 5) {
      return compareOrganicFeed(a, b, profile);
    }

    if (a.urgente !== b.urgente) return a.urgente ? -1 : 1;
    return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
  });

  return rows.slice(offset, offset + limit);
}

/** Vagas de demonstração para visitantes (anon). */
export async function fetchDemoJobs(): Promise<JobRow[]> {
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_demo", true)
    .eq("ativa", true)
    .order("urgente", { ascending: false })
    .order("criado_em", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (jobs ?? []).map((j) => ({
    ...(j as JobRow),
    empregador_nome: "Contratante demo",
    prioridade: 5,
  }));
}
