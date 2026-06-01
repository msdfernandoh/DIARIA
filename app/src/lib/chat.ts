import type { RealtimeChannel } from "@supabase/supabase-js";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes";
import { sendNotification } from "./notifications";
import { supabase } from "./supabase";

export type ChatMessage = {
  id: string;
  application_id: string;
  sender_id: string;
  texto: string;
  tipo: "texto" | "sistema" | "celular_compartilhado";
  lida: boolean;
  criado_em: string;
};

export type ConversationRow = {
  applicationId: string;
  jobTitle: string;
  jobDate: string | null;
  status: string;
  otherUserId: string;
  otherName: string;
  otherCelular: string | null;
  otherCelularVisivel: boolean;
  lastPreview: string;
  lastAt: string | null;
  unreadCount: number;
};

export type ApplicationContext = {
  applicationId: string;
  status: string;
  jobTitle: string;
  jobDate: string | null;
  empregadorNome: string;
  empregadorId: string;
  candidatoId: string;
  candidatoNome: string;
  myCelular: string;
  myCelularVisivel: boolean;
  otherName: string;
  otherUserId: string;
  otherCelular: string | null;
  otherCelularVisivel: boolean;
};

export function relativeChatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const day = Math.floor(h / 24);
  if (day === 1) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function previewText(texto: string, max = 50): string {
  const t = texto.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

async function notifyChatMessageRecipient(
  applicationId: string,
  senderId: string,
  texto: string
) {
  const { data: app } = await supabase
    .from("applications")
    .select("candidato_id, job_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) return;
  const { data: job } = await supabase
    .from("jobs")
    .select("empregador_id")
    .eq("id", app.job_id)
    .maybeSingle();
  const empregadorId = job?.empregador_id;
  const recipientId =
    senderId === app.candidato_id ? empregadorId : app.candidato_id;
  if (!recipientId || recipientId === senderId) return;

  const { data: sender } = await supabase.from("users").select("nome").eq("id", senderId).maybeSingle();
  const T = NOTIFICATION_TYPES.EMPREGADO.MENSAGEM_NOVA;
  await sendNotification({
    userId: recipientId,
    titulo: T.buildTitle(sender?.nome ?? "Contato"),
    corpo: T.buildBody(previewText(texto)),
    data: T.data(applicationId),
  });
}

export async function fetchMessages(applicationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, application_id, sender_id, texto, tipo, lida, criado_em")
    .eq("application_id", applicationId)
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function markMessagesRead(applicationId: string, userId: string) {
  const { error } = await supabase
    .from("messages")
    .update({ lida: true })
    .eq("application_id", applicationId)
    .neq("sender_id", userId)
    .eq("lida", false);
  if (error) throw error;
}

export async function sendTextMessage(
  applicationId: string,
  senderId: string,
  texto: string
): Promise<ChatMessage> {
  const trimmed = texto.trim().slice(0, 500);
  if (!trimmed) throw new Error("Mensagem vazia");
  const { data, error } = await supabase
    .from("messages")
    .insert({
      application_id: applicationId,
      sender_id: senderId,
      texto: trimmed,
      tipo: "texto",
      lida: false,
    })
    .select("id, application_id, sender_id, texto, tipo, lida, criado_em")
    .single();
  if (error) throw error;
  const msg = data as ChatMessage;
  void notifyChatMessageRecipient(applicationId, senderId, trimmed);
  return msg;
}

export async function sharePhoneInChat(
  applicationId: string,
  userId: string,
  nome: string,
  celular: string
) {
  const { error: uErr } = await supabase
    .from("users")
    .update({ celular_visivel: true })
    .eq("id", userId);
  if (uErr) throw uErr;

  const texto = `📱 ${nome} compartilhou o contato: ${celular}`;
  const { error } = await supabase.from("messages").insert({
    application_id: applicationId,
    sender_id: userId,
    texto,
    tipo: "celular_compartilhado",
    lida: false,
  });
  if (error) throw error;
}

export function subscribeMessages(
  applicationId: string,
  handlers: {
    onInsert: (msg: ChatMessage) => void;
    onUpdate: (msg: ChatMessage) => void;
  }
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${applicationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `application_id=eq.${applicationId}`,
      },
      (payload) => handlers.onInsert(payload.new as ChatMessage)
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `application_id=eq.${applicationId}`,
      },
      (payload) => handlers.onUpdate(payload.new as ChatMessage)
    )
    .subscribe();
  return channel;
}

async function enrichConversations(
  apps: {
    id: string;
    status: string;
    candidato_id: string;
    job_id: string;
  }[],
  viewerId: string,
  otherSide: "empregador" | "candidato"
): Promise<ConversationRow[]> {
  if (!apps.length) return [];

  const jobIds = [...new Set(apps.map((a) => a.job_id))];
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, titulo, data_inicio, empregador_id")
    .in("id", jobIds);
  const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]));

  const otherIds = new Set<string>();
  apps.forEach((a) => {
    const job = jobMap.get(a.job_id);
    if (!job) return;
    otherIds.add(otherSide === "empregador" ? a.candidato_id : job.empregador_id);
  });

  const { data: others } = await supabase
    .from("users")
    .select("id, nome, celular, celular_visivel")
    .in("id", [...otherIds]);

  const otherMap = new Map((others ?? []).map((u) => [u.id, u]));

  const appIds = apps.map((a) => a.id);
  const { data: msgs } = await supabase
    .from("messages")
    .select("application_id, texto, tipo, sender_id, lida, criado_em")
    .in("application_id", appIds)
    .order("criado_em", { ascending: false });

  type MsgRow = {
    application_id: string;
    texto: string;
    tipo: string;
    sender_id: string;
    lida: boolean;
    criado_em: string;
  };

  const lastByApp = new Map<string, MsgRow>();
  const unreadByApp = new Map<string, number>();
  ((msgs ?? []) as MsgRow[]).forEach((m) => {
    if (!lastByApp.has(m.application_id)) lastByApp.set(m.application_id, m);
    if (m.sender_id !== viewerId && !m.lida) {
      unreadByApp.set(m.application_id, (unreadByApp.get(m.application_id) ?? 0) + 1);
    }
  });

  return apps
    .map((a) => {
      const job = jobMap.get(a.job_id);
      if (!job) return null;
      const otherId = otherSide === "empregador" ? a.candidato_id : job.empregador_id;
      const other = otherMap.get(otherId);
      const last = lastByApp.get(a.id);
      return {
        applicationId: a.id,
        jobTitle: job.titulo,
        jobDate: job.data_inicio,
        status: a.status,
        otherUserId: otherId,
        otherName: other?.nome ?? "Usuário",
        otherCelular: other?.celular ?? null,
        otherCelularVisivel: other?.celular_visivel ?? false,
        lastPreview: last
          ? last.tipo === "texto"
            ? previewText(last.texto)
            : previewText(last.texto, 60)
          : "Sem mensagens",
        lastAt: last?.criado_em ?? null,
        unreadCount: unreadByApp.get(a.id) ?? 0,
      } satisfies ConversationRow;
    })
    .filter(Boolean) as ConversationRow[];
}

export async function fetchConversationsAsCandidate(userId: string) {
  const { data: apps, error } = await supabase
    .from("applications")
    .select("id, status, candidato_id, job_id")
    .eq("candidato_id", userId);
  if (error) throw error;
  const rows = await enrichConversations(apps ?? [], userId, "empregador");
  rows.sort((a, b) => {
    const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
    const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
    return tb - ta;
  });
  return rows;
}

export async function fetchConversationsAsEmployer(userId: string) {
  const { data: jobs } = await supabase.from("jobs").select("id").eq("empregador_id", userId);
  const jobIds = (jobs ?? []).map((j) => j.id);
  if (!jobIds.length) return [];

  const { data: apps, error } = await supabase
    .from("applications")
    .select("id, status, candidato_id, job_id")
    .in("job_id", jobIds);
  if (error) throw error;
  const rows = await enrichConversations(apps ?? [], userId, "candidato");
  rows.sort((a, b) => {
    const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
    const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
    return tb - ta;
  });
  return rows;
}

export async function fetchApplicationContext(
  applicationId: string,
  viewerId: string
): Promise<ApplicationContext | null> {
  const { data: app, error } = await supabase
    .from("applications")
    .select("id, status, candidato_id, job_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (error) throw error;
  if (!app) return null;

  const { data: job } = await supabase
    .from("jobs")
    .select("titulo, data_inicio, empregador_id")
    .eq("id", app.job_id)
    .maybeSingle();
  if (!job) return null;

  const { data: users } = await supabase
    .from("users")
    .select("id, nome, celular, celular_visivel")
    .in("id", [app.candidato_id, job.empregador_id, viewerId]);

  const uMap = new Map((users ?? []).map((u) => [u.id, u]));
  const me = uMap.get(viewerId);
  const empregador = uMap.get(job.empregador_id);
  const candidato = uMap.get(app.candidato_id);
  const iAmCandidate = viewerId === app.candidato_id;
  const other = iAmCandidate ? empregador : candidato;

  return {
    applicationId: app.id,
    status: app.status,
    jobTitle: job.titulo,
    jobDate: job.data_inicio,
    empregadorNome: empregador?.nome ?? "Contratante",
    empregadorId: job.empregador_id,
    candidatoId: app.candidato_id,
    candidatoNome: candidato?.nome ?? "Profissional",
    myCelular: me?.celular ?? "",
    myCelularVisivel: me?.celular_visivel ?? false,
    otherName: other?.nome ?? "Contato",
    otherUserId: other?.id ?? "",
    otherCelular: other?.celular ?? null,
    otherCelularVisivel: other?.celular_visivel ?? false,
  };
}

export async function countUnreadForUser(userId: string, tipo: string | null): Promise<number> {
  if (tipo === "empreendedor") return 0;

  let appIds: string[] = [];
  if (tipo === "empregado") {
    const { data } = await supabase.from("applications").select("id").eq("candidato_id", userId);
    appIds = (data ?? []).map((a) => a.id);
  } else if (tipo === "empregador") {
    const { data: jobs } = await supabase.from("jobs").select("id").eq("empregador_id", userId);
    const jobIds = (jobs ?? []).map((j) => j.id);
    if (!jobIds.length) return 0;
    const { data: apps } = await supabase.from("applications").select("id").in("job_id", jobIds);
    appIds = (apps ?? []).map((a) => a.id);
  } else {
    return 0;
  }
  if (!appIds.length) return 0;

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("application_id", appIds)
    .eq("lida", false)
    .neq("sender_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export function subscribeUnreadMessages(userId: string, onChange: () => void): RealtimeChannel {
  return supabase
    .channel(`unread:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      () => onChange()
    )
    .subscribe();
}
