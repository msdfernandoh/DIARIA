import { CATEGORY_SKILL_IDS, categoryLabel } from "../constants/publishJob";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes";
import type { JobRow } from "../types/job";
import { sendNotificationToUsers } from "./notifications";
import { supabase } from "./supabase";

export type JobTipo = "diaria" | "emprego_fixo" | "remoto";
export type JobFormato = "presencial" | "remoto" | "hibrido";
export type ContratoTipo = "clt" | "pj" | "estagio" | "aprendiz";
export type CargaTipo = "full" | "part" | "combinar";

export type PublishJobInput = {
  titulo: string;
  categoria: string;
  tipo: JobTipo;
  formato: JobFormato;
  vagasTotal: number;
  valor: number;
  descricao: string;
  requisitos: string;
  beneficios: string[];
  urgente: boolean;
  datasDiaria: string[];
  horarioInicio: string | null;
  horarioFim: string | null;
  recorrente: boolean;
  diasRecorrencia: number[];
  recorrenciaAte: string | null;
  dataInicio: string | null;
  contrato: ContratoTipo | null;
  carga: CargaTipo | null;
  salarioMensal: number | null;
  aceitaQualquerCidade: boolean;
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  referencia: string | null;
};

const CARGA_LABELS: Record<CargaTipo, string> = {
  full: "Full-time",
  part: "Part-time",
  combinar: "A combinar",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildRequisitos(input: PublishJobInput): string | null {
  const parts: string[] = [];
  if (input.carga) parts.push(`Carga: ${CARGA_LABELS[input.carga]}`);
  if (input.referencia?.trim()) parts.push(`Referência: ${input.referencia.trim()}`);
  if (input.aceitaQualquerCidade && input.tipo === "remoto") {
    parts.push("Aceita candidatos de qualquer cidade do Brasil.");
  }
  if (input.requisitos.trim()) parts.push(input.requisitos.trim());
  return parts.length ? parts.join("\n") : null;
}

function resolveValor(input: PublishJobInput): number {
  if (input.tipo !== "diaria" && input.salarioMensal != null && input.salarioMensal > 0) {
    return input.salarioMensal;
  }
  return input.valor;
}

function resolveContrato(input: PublishJobInput): string | null {
  if (input.tipo === "diaria") return "diaria";
  return input.contrato;
}

function resolveDates(input: PublishJobInput): { dataInicio: string | null; dataFim: string | null } {
  if (input.tipo === "diaria" && input.datasDiaria.length) {
    const sorted = [...input.datasDiaria].sort();
    return { dataInicio: sorted[0], dataFim: sorted[sorted.length - 1] };
  }
  return { dataInicio: input.dataInicio, dataFim: null };
}

async function geocodeJob(
  cidade: string | null,
  estado: string | null,
  cep: string | null,
  endereco: string | null
): Promise<{ lat: number | null; lng: number | null }> {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) return { lat: null, lng: null };
  const parts = [endereco, cidade, estado, cep?.replace(/\D/g, "")].filter(Boolean);
  if (!parts.length) return { lat: null, lng: null };
  try {
    const q = encodeURIComponent(parts.join(", "));
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${key}&region=br`
    );
    const json = await res.json();
    const loc = json.results?.[0]?.geometry?.location;
    if (loc?.lat != null && loc?.lng != null) {
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch {
    /* opcional */
  }
  return { lat: null, lng: null };
}

async function notifyMatchingEmployees(
  job: {
    id: string;
    titulo: string;
    valor: number | null;
    cidade: string | null;
    categoria: string;
    formato: string | null;
    urgente: boolean;
  },
  empregadorNome: string
) {
  const skills = CATEGORY_SKILL_IDS[job.categoria] ?? [];
  const catLabel = categoryLabel(job.categoria);

  let userIds: string[] = [];
  const remoto = job.formato === "remoto";

  let userQuery = supabase.from("users").select("id").eq("tipo", "empregado");
  if (!remoto && job.cidade) {
    userQuery = userQuery.eq("cidade", job.cidade);
  }

  const { data: users, error: uErr } = await userQuery;
  if (uErr || !users?.length) return;
  userIds = users.map((u) => u.id);

  if (skills.length) {
    const { data: skilled } = await supabase.from("user_skills").select("user_id").in("skill", skills);
    const allowed = new Set((skilled ?? []).map((s) => s.user_id));
    userIds = userIds.filter((id) => allowed.has(id));
  }

  if (!userIds.length) return;

  const T = job.urgente
    ? NOTIFICATION_TYPES.EMPREGADO.NOVA_VAGA_URGENTE
    : NOTIFICATION_TYPES.EMPREGADO.NOVA_VAGA;

  await sendNotificationToUsers(
    userIds,
    T.buildTitle(job.titulo),
    T.buildBody(empregadorNome, job.valor, job.cidade ?? catLabel),
    T.data(job.id)
  );
}

export async function publishJob(data: PublishJobInput, userId: string): Promise<JobRow> {
  const { dataInicio, dataFim } = resolveDates(data);
  const valor = resolveValor(data);
  const contrato = resolveContrato(data);

  let lat = data.lat;
  let lng = data.lng;
  if ((data.formato === "presencial" || data.formato === "hibrido") && lat == null) {
    const geo = await geocodeJob(data.cidade, data.estado, data.cep, data.endereco);
    lat = geo.lat;
    lng = geo.lng;
  }

  const payload = {
    empregador_id: userId,
    titulo: data.titulo.trim().slice(0, 80),
    descricao: data.descricao.trim(),
    requisitos: buildRequisitos(data),
    categoria: data.categoria,
    tipo: data.tipo,
    formato: data.formato,
    contrato,
    data_inicio: dataInicio ?? todayIso(),
    data_fim: dataFim,
    horario_inicio: data.tipo === "diaria" ? data.horarioInicio : null,
    horario_fim: data.tipo === "diaria" ? data.horarioFim : null,
    recorrente: data.tipo === "diaria" && data.recorrente,
    dias_recorrencia: data.recorrente && data.diasRecorrencia.length ? data.diasRecorrencia : null,
    recorrencia_ate: data.recorrente ? data.recorrenciaAte : null,
    valor,
    vagas_total: data.vagasTotal,
    vagas_restantes: data.vagasTotal,
    cep: data.cep?.replace(/\D/g, "") ?? null,
    cidade: data.formato === "remoto" && data.aceitaQualquerCidade ? null : data.cidade,
    estado: data.estado,
    endereco: data.endereco,
    lat,
    lng,
    urgente: data.urgente,
    beneficios: data.beneficios.length ? data.beneficios : null,
    destaque_nivel: "organico",
    destaque_grupo_id: null,
    ativa: true,
    pausada: false,
  };

  const { data: row, error } = await supabase.from("jobs").insert(payload).select("*").single();
  if (error) throw error;

  const job = row as JobRow;
  const { data: emp } = await supabase.from("users").select("nome").eq("id", userId).maybeSingle();
  await notifyMatchingEmployees(
    {
      id: job.id,
      titulo: job.titulo,
      valor: job.valor,
      cidade: job.cidade,
      categoria: job.categoria,
      formato: job.formato,
      urgente: job.urgente,
    },
    emp?.nome ?? "Contratante"
  );

  return job;
}

export function buildPreviewJob(
  data: PublishJobInput,
  empregadorId: string,
  empregadorNome: string
): JobRow {
  const { dataInicio } = resolveDates(data);
  return {
    id: "preview",
    empregador_id: empregadorId,
    titulo: data.titulo || "Título da vaga",
    descricao: data.descricao,
    categoria: data.categoria,
    tipo: data.tipo,
    formato: data.formato,
    valor: resolveValor(data),
    cidade: data.formato === "remoto" ? "Remoto" : data.cidade,
    estado: data.estado,
    lat: data.lat,
    lng: data.lng,
    urgente: data.urgente,
    recorrente: data.recorrente,
    vagas_restantes: data.vagasTotal,
    destaque_nivel: "organico",
    destaque_grupo_id: null,
    criado_em: new Date().toISOString(),
    empregador_nome: empregadorNome,
    data_inicio: dataInicio,
    horario_inicio: data.horarioInicio,
    horario_fim: data.horarioFim,
    requisitos: data.requisitos,
    beneficios: data.beneficios,
    endereco: data.endereco,
  };
}
