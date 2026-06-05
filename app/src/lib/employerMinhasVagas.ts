import { SKILLS, TURNOS, WEEKDAYS } from "../constants/empregado";
import { setApplicationStatus } from "./applications";
import { haversineKm } from "./jobFormat";
import { supabase } from "./supabase";

export type EmployerJobRow = {
  id: string;
  titulo: string;
  categoria: string | null;
  data_inicio: string | null;
  valor: number | null;
  ativa: boolean;
  lat: number | null;
  lng: number | null;
  candidatos_count: number;
};

export type CandidateCardData = {
  applicationId: string;
  status: string;
  candidatoId: string;
  nome: string;
  fotoUrl: string | null;
  notaMedia: number | null;
  totalAvaliacoes: number;
  skills: string[];
  temMoto: boolean;
  temCarro: boolean;
  valorMinDia: number | null;
  valorMaxDia: number | null;
  diasSemana: number[];
  turnos: string[];
  distanciaKm: number | null;
};

const SKILL_LABEL: Record<string, string> = Object.fromEntries(
  SKILLS.map((s) => [s.id, `${s.emoji} ${s.label}`])
);

export function skillChipLabel(skillId: string): string {
  return SKILL_LABEL[skillId] ?? skillId;
}

export function formatExpectedPay(min: number | null, max: number | null): string | null {
  const fmt = (n: number) =>
    `R$${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (min != null && max != null) return `Espera ${fmt(min)}–${fmt(max)}/dia`;
  if (min != null) return `Espera a partir de ${fmt(min)}/dia`;
  if (max != null) return `Espera até ${fmt(max)}/dia`;
  return null;
}

export function formatAvailabilityLine(dias: number[], turnos: string[]): string | null {
  const dayLabels = [...dias]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAYS.find((w) => w.id === d)?.label)
    .filter(Boolean);
  if (!dayLabels.length && !turnos.length) return null;

  const turnoShort = (id: string): string => {
    if (id === "manha") return "Manhã";
    if (id === "tarde") return "Tarde";
    if (id === "noite") return "Noite";
    if (id === "madrugada") return "Madrugada";
    if (id === "qualquer") return "Qualquer período";
    return TURNOS.find((t) => t.id === id)?.label ?? id;
  };

  const turnoLabels = turnos.map(turnoShort).filter(Boolean);
  let turnoPart = "";
  if (turnoLabels.length === 1) turnoPart = turnoLabels[0];
  else if (turnoLabels.length === 2) turnoPart = `${turnoLabels[0]} e ${turnoLabels[1]}`;
  else if (turnoLabels.length > 2) {
    turnoPart = `${turnoLabels.slice(0, -1).join(", ")} e ${turnoLabels[turnoLabels.length - 1]}`;
  }

  const dayPart = dayLabels.join(", ");
  if (dayPart && turnoPart) return `${dayPart} · ${turnoPart}`;
  return dayPart || turnoPart || null;
}

export function formatDistanceKm(km: number | null): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.max(km * 1000, 100).toFixed(0)} m`;
  return `${Math.round(km)} km`;
}

export function transportEmojis(temMoto: boolean, temCarro: boolean): string {
  const parts: string[] = [];
  if (temMoto) parts.push("🏍️ moto");
  if (temCarro) parts.push("🚗 carro");
  return parts.join(" · ");
}

export async function fetchEmployerJobs(empregadorId: string): Promise<EmployerJobRow[]> {
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, titulo, categoria, data_inicio, valor, ativa, lat, lng")
    .eq("empregador_id", empregadorId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  const list = jobs ?? [];
  if (!list.length) return [];

  const jobIds = list.map((j) => j.id);
  const { data: apps, error: appErr } = await supabase
    .from("applications")
    .select("job_id")
    .in("job_id", jobIds);
  if (appErr) throw appErr;

  const counts = new Map<string, number>();
  for (const row of apps ?? []) {
    counts.set(row.job_id, (counts.get(row.job_id) ?? 0) + 1);
  }

  return list.map((j) => ({
    id: j.id,
    titulo: j.titulo,
    categoria: j.categoria,
    data_inicio: j.data_inicio,
    valor: j.valor != null ? Number(j.valor) : null,
    ativa: j.ativa,
    lat: j.lat != null ? Number(j.lat) : null,
    lng: j.lng != null ? Number(j.lng) : null,
    candidatos_count: counts.get(j.id) ?? 0,
  }));
}

export async function fetchJobCandidates(
  jobId: string,
  jobLat: number | null,
  jobLng: number | null
): Promise<CandidateCardData[]> {
  const { data: apps, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      candidato_id,
      users (
        nome,
        foto_url,
        nota_media,
        lat,
        lng,
        valor_min_dia,
        valor_max_dia,
        tem_moto,
        tem_carro
      )
    `
    )
    .eq("job_id", jobId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  if (!apps?.length) return [];

  const candidatoIds = apps.map((a) => a.candidato_id as string);

  const [{ data: skillsRows }, { data: availRows }, { data: ratingRows }] = await Promise.all([
    supabase.from("user_skills").select("user_id, skill").in("user_id", candidatoIds),
    supabase
      .from("user_availability")
      .select("user_id, dias_semana, turnos")
      .in("user_id", candidatoIds),
    supabase.from("ratings").select("avaliado_id").in("avaliado_id", candidatoIds),
  ]);

  const skillsByUser = new Map<string, string[]>();
  for (const row of skillsRows ?? []) {
    const uid = row.user_id as string;
    const list = skillsByUser.get(uid) ?? [];
    list.push(row.skill as string);
    skillsByUser.set(uid, list);
  }

  const availByUser = new Map<string, { dias: number[]; turnos: string[] }>();
  for (const row of availRows ?? []) {
    availByUser.set(row.user_id as string, {
      dias: (row.dias_semana as number[] | null) ?? [],
      turnos: (row.turnos as string[] | null) ?? [],
    });
  }

  const ratingCounts = new Map<string, number>();
  for (const row of ratingRows ?? []) {
    const id = row.avaliado_id as string;
    ratingCounts.set(id, (ratingCounts.get(id) ?? 0) + 1);
  }

  return apps.map((app) => {
    const u = app.users as {
      nome: string;
      foto_url: string | null;
      nota_media: number | null;
      lat: number | null;
      lng: number | null;
      valor_min_dia: number | null;
      valor_max_dia: number | null;
      tem_moto: boolean;
      tem_carro: boolean;
    } | null;

    const candidatoId = app.candidato_id as string;
    const avail = availByUser.get(candidatoId);
    let distanciaKm: number | null = null;
    if (jobLat != null && jobLng != null && u?.lat != null && u?.lng != null) {
      distanciaKm = haversineKm(jobLat, jobLng, Number(u.lat), Number(u.lng));
    }

    return {
      applicationId: app.id as string,
      status: app.status as string,
      candidatoId,
      nome: u?.nome ?? "Candidato",
      fotoUrl: u?.foto_url ?? null,
      notaMedia: u?.nota_media != null ? Number(u.nota_media) : null,
      totalAvaliacoes: ratingCounts.get(candidatoId) ?? 0,
      skills: skillsByUser.get(candidatoId) ?? [],
      temMoto: !!u?.tem_moto,
      temCarro: !!u?.tem_carro,
      valorMinDia: u?.valor_min_dia != null ? Number(u.valor_min_dia) : null,
      valorMaxDia: u?.valor_max_dia != null ? Number(u.valor_max_dia) : null,
      diasSemana: avail?.dias ?? [],
      turnos: avail?.turnos ?? [],
      distanciaKm,
    };
  });
}

export async function acceptApplication(applicationId: string, actorUserId: string) {
  return setApplicationStatus(applicationId, "aceita", actorUserId);
}

export async function rejectApplication(applicationId: string, actorUserId: string) {
  return setApplicationStatus(applicationId, "recusada", actorUserId);
}

export async function closeEmployerJob(jobId: string, empregadorId: string): Promise<void> {
  const { error } = await supabase
    .from("jobs")
    .update({ ativa: false })
    .eq("id", jobId)
    .eq("empregador_id", empregadorId);
  if (error) throw error;
}
