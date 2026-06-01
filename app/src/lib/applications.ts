import { NOTIFICATION_TYPES } from "../constants/notificationTypes";
import { categoryLabel } from "../constants/publishJob";
import { CATEGORY_SKILL_IDS } from "../constants/publishJob";
import { sendNotification, sendNotificationToUsers } from "./notifications";
import { supabase } from "./supabase";

export type ApplicationRow = {
  id: string;
  job_id: string;
  candidato_id: string;
  status: string;
};

function systemTimeLabel(): string {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export async function findApplication(jobId: string, candidatoId: string) {
  const { data, error } = await supabase
    .from("applications")
    .select("id, job_id, candidato_id, status")
    .eq("job_id", jobId)
    .eq("candidato_id", candidatoId)
    .maybeSingle();
  if (error) throw error;
  return data as ApplicationRow | null;
}

async function insertSystemMessage(applicationId: string, senderId: string, texto: string) {
  const { error } = await supabase.from("messages").insert({
    application_id: applicationId,
    sender_id: senderId,
    texto,
    tipo: "sistema",
  });
  if (error) throw error;
}

async function notifyEmployerNewApplication(params: {
  empregadorId: string;
  candidatoNome: string;
  jobTitulo: string;
  applicationId: string;
  jobId: string;
  nota?: number | null;
}) {
  const T = NOTIFICATION_TYPES.EMPREGADOR.NOVA_CANDIDATURA;
  const nota = params.nota ?? 5;
  await sendNotification({
    userId: params.empregadorId,
    titulo: T.buildTitle(params.jobTitulo),
    corpo: T.buildBody(params.candidatoNome, nota),
    data: T.data(params.applicationId, params.jobId),
  });
}

async function decrementJobSlots(jobId: string) {
  const { data: job } = await supabase.from("jobs").select("vagas_restantes").eq("id", jobId).maybeSingle();
  if (!job || job.vagas_restantes <= 0) return;
  await supabase
    .from("jobs")
    .update({ vagas_restantes: job.vagas_restantes - 1 })
    .eq("id", jobId)
    .eq("vagas_restantes", job.vagas_restantes);
}

export async function setApplicationStatus(
  applicationId: string,
  status: string,
  actorUserId: string
): Promise<ApplicationRow> {
  const { data: app, error: fetchErr } = await supabase
    .from("applications")
    .select("id, job_id, candidato_id, status")
    .eq("id", applicationId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!app) throw new Error("Candidatura não encontrada.");

  const { data: job } = await supabase
    .from("jobs")
    .select("titulo, empregador_id")
    .eq("id", app.job_id)
    .maybeSingle();
  if (!job || job.empregador_id !== actorUserId) {
    throw new Error("Sem permissão para alterar esta candidatura.");
  }

  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .select("id, job_id, candidato_id, status")
    .single();
  if (error) throw error;

  if (status === "aceita") {
    const { data: emp } = await supabase
      .from("users")
      .select("nome")
      .eq("id", job.empregador_id)
      .maybeSingle();
    const T = NOTIFICATION_TYPES.EMPREGADO.CANDIDATURA_ACEITA;
    await sendNotification({
      userId: app.candidato_id,
      titulo: T.buildTitle(emp?.nome ?? "Contratante"),
      corpo: T.buildBody(),
      data: T.data(applicationId),
    });
  }

  return data as ApplicationRow;
}

export async function ensureApplicationForChat(
  jobId: string,
  candidatoId: string
): Promise<ApplicationRow> {
  const existing = await findApplication(jobId, candidatoId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("applications")
    .insert({
      job_id: jobId,
      candidato_id: candidatoId,
      status: "pendente",
      mensagem_inicial: "pergunta",
    })
    .select("id, job_id, candidato_id, status")
    .single();
  if (error) throw error;
  return data as ApplicationRow;
}

export async function applyToJob(params: {
  jobId: string;
  candidatoId: string;
  candidatoNome: string;
  empregadorId: string;
  jobTitulo: string;
}): Promise<ApplicationRow> {
  const existing = await findApplication(params.jobId, params.candidatoId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("applications")
    .insert({
      job_id: params.jobId,
      candidato_id: params.candidatoId,
      status: "pendente",
    })
    .select("id, job_id, candidato_id, status")
    .single();
  if (error) throw error;

  await decrementJobSlots(params.jobId);
  await insertSystemMessage(
    data.id,
    params.candidatoId,
    `💼 Candidatura enviada · ${systemTimeLabel()}`
  );
  await notifyEmployerNewApplication({
    empregadorId: params.empregadorId,
    candidatoNome: params.candidatoNome,
    jobTitulo: params.jobTitulo,
    applicationId: data.id,
    jobId: params.jobId,
  });

  return data as ApplicationRow;
}
