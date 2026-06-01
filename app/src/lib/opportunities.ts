import { CONFIG } from "../constants/config";
import { haversineKm } from "./jobFormat";
import { supabase } from "./supabase";

export type PhysicalOpportunity = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string | null;
  foto_url: string | null;
  custo_moedas: number;
  quantidade_restante: number;
  local_nome: string | null;
  local_endereco: string | null;
  cidade: string | null;
  lat: number | null;
  lng: number | null;
  valida_ate: string;
  distancia_km?: number | null;
};

export type PhysicalRedemption = {
  id: string;
  oportunidade_id: string;
  qrcode_token: string;
  status: string;
  moedas_gastas: number;
  expira_em: string;
  resgatado_em: string;
  titulo?: string;
  local_nome?: string | null;
};

const ERROR_MSG: Record<string, string> = {
  esgotado: "Esta oportunidade esgotou.",
  expirado: "Esta oportunidade não está mais válida.",
  saldo_insuficiente: "Saldo insuficiente. Ganhe mais moedas no app!",
  nao_encontrado: "Oportunidade não encontrada.",
  token_invalido: "QR Code inválido.",
  ja_utilizado: "Este QR Code já foi utilizado.",
  sem_permissao: "Você não pode confirmar este resgate.",
  nao_autorizado: "Faça login para continuar.",
};

export function redeemErrorMessage(code: string): string {
  return ERROR_MSG[code] ?? "Não foi possível concluir. Tente novamente.";
}

export function generateQrToken(): string {
  const part = () => Math.random().toString(36).slice(2, 10);
  return `${part()}${part()}${Date.now()}`.slice(0, 64);
}

export function qrCodeUrl(token: string): string {
  return CONFIG.qrLink(token);
}

export async function fetchOpportunities(userId: string): Promise<PhysicalOpportunity[]> {
  const { data: me } = await supabase
    .from("users")
    .select("cidade, lat, lng")
    .eq("id", userId)
    .maybeSingle();

  const { data: group } = await supabase
    .from("user_group")
    .select("empreendedor_id")
    .eq("user_id", userId)
    .eq("ativo", true)
    .maybeSingle();

  const grupoEmpreendedorId = group?.empreendedor_id ?? null;
  const cidade = me?.cidade ?? null;

  const { data, error } = await supabase
    .from("physical_opportunities")
    .select(
      "id, titulo, descricao, tipo, foto_url, custo_moedas, quantidade_restante, local_nome, local_endereco, cidade, lat, lng, valida_ate, escopo, empreendedor_id"
    )
    .eq("ativa", true)
    .gt("valida_ate", new Date().toISOString())
    .gt("quantidade_restante", 0);
  if (error) throw error;

  const filtered = (data ?? []).filter((row) => {
    if (row.escopo === "cidade") {
      return cidade && row.cidade && row.cidade.toLowerCase() === cidade.toLowerCase();
    }
    if (row.escopo === "grupo") {
      return grupoEmpreendedorId && row.empreendedor_id === grupoEmpreendedorId;
    }
    return false;
  });

  return filtered.map((row) => {
    let distancia_km: number | null = null;
    if (
      me?.lat != null &&
      me?.lng != null &&
      row.lat != null &&
      row.lng != null
    ) {
      distancia_km = haversineKm(
        Number(me.lat),
        Number(me.lng),
        Number(row.lat),
        Number(row.lng)
      );
    }
    return { ...(row as PhysicalOpportunity), distancia_km };
  });
}

export async function redeemOpportunity(
  opportunityId: string,
  token: string
): Promise<{ redemptionId: string; token: string }> {
  const { data, error } = await supabase.rpc("redeem_physical_opportunity", {
    p_opp_id: opportunityId,
    p_token: token,
  });
  if (error) throw error;
  const result = data as { success?: boolean; error?: string; redemption_id?: string; token?: string };
  if (result?.error) {
    throw new Error(result.error);
  }
  if (!result?.success || !result.redemption_id) {
    throw new Error("erro_desconhecido");
  }
  return { redemptionId: result.redemption_id, token: result.token ?? token };
}

export async function fetchRedemption(
  redemptionId: string,
  userId: string
): Promise<PhysicalRedemption | null> {
  const { data, error } = await supabase
    .from("physical_redemptions")
    .select(
      `
      id, oportunidade_id, qrcode_token, status, moedas_gastas, expira_em, resgatado_em,
      physical_opportunities ( titulo, local_nome )
    `
    )
    .eq("id", redemptionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const opp = data.physical_opportunities as { titulo?: string; local_nome?: string | null } | null;
  return {
    id: data.id,
    oportunidade_id: data.oportunidade_id,
    qrcode_token: data.qrcode_token,
    status: data.status,
    moedas_gastas: data.moedas_gastas,
    expira_em: data.expira_em,
    resgatado_em: data.resgatado_em,
    titulo: opp?.titulo,
    local_nome: opp?.local_nome,
  };
}

export async function fetchRedemptionByToken(token: string): Promise<PhysicalRedemption | null> {
  const { data, error } = await supabase
    .from("physical_redemptions")
    .select(
      `
      id, oportunidade_id, qrcode_token, status, moedas_gastas, expira_em, resgatado_em,
      physical_opportunities ( titulo, local_nome )
    `
    )
    .eq("qrcode_token", token.trim())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const opp = data.physical_opportunities as { titulo?: string; local_nome?: string | null } | null;
  return {
    id: data.id,
    oportunidade_id: data.oportunidade_id,
    qrcode_token: data.qrcode_token,
    status: data.status,
    moedas_gastas: data.moedas_gastas,
    expira_em: data.expira_em,
    resgatado_em: data.resgatado_em,
    titulo: opp?.titulo,
    local_nome: opp?.local_nome,
  };
}

export async function confirmRedemption(token: string): Promise<void> {
  const { data, error } = await supabase.rpc("confirm_physical_redemption", {
    p_token: token.trim(),
  });
  if (error) throw error;
  const result = data as { success?: boolean; error?: string };
  if (result?.error) throw new Error(result.error);
  if (!result?.success) throw new Error("erro_desconhecido");
}

export type CreateOpportunityInput = {
  titulo: string;
  tipo: string;
  descricao?: string;
  custo_moedas: number;
  quantidade_total: number;
  valida_ate: string;
  local_nome: string;
  local_endereco?: string;
  cidade: string;
  estado: string;
  cep?: string;
  escopo: "grupo" | "cidade";
  foto_url?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export async function createPhysicalOpportunity(
  empreendedorId: string,
  input: CreateOpportunityInput
): Promise<string> {
  const { data: ent } = await supabase
    .from("entrepreneurs")
    .select("user_id")
    .eq("user_id", empreendedorId)
    .maybeSingle();

  if (!ent) throw new Error("Perfil de empreendedor não encontrado.");

  const { data, error } = await supabase
    .from("physical_opportunities")
    .insert({
      empresa_id: empreendedorId,
      empreendedor_id: empreendedorId,
      titulo: input.titulo.trim().slice(0, 80),
      descricao: input.descricao?.trim() || null,
      tipo: input.tipo,
      foto_url: input.foto_url ?? null,
      custo_moedas: input.custo_moedas,
      quantidade_total: input.quantidade_total,
      quantidade_restante: input.quantidade_total,
      escopo: input.escopo,
      grupo_id: input.escopo === "grupo" ? empreendedorId : null,
      cidade: input.cidade,
      estado: input.estado,
      local_nome: input.local_nome,
      local_endereco: input.local_endereco ?? null,
      lat: input.lat,
      lng: input.lng,
      valida_ate: input.valida_ate,
      ativa: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export function formatValidUntil(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function tipoEmoji(tipo: string | null | undefined): string {
  const map: Record<string, string> = {
    chop: "🍺",
    hamburguer: "🍔",
    pizza: "🍕",
    ingresso: "🎟️",
    servico: "💈",
    outro: "🎁",
  };
  return map[tipo ?? "outro"] ?? "🎁";
}
