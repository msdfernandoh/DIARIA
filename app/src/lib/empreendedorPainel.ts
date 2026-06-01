import { REF_LINK_BASE } from "../constants/empreendedor";
import { maybeNotifyMetaBatida, notifyMicrofranquia } from "./notifications";
import { supabase } from "./supabase";

export const MICROFRANQUIA_META_VAGAS = 50;
export const MICROFRANQUIA_META_PESSOAS = 300;
export const PERIODO_META_DIAS = 30;

export type EntrepreneurRow = {
  user_id: string;
  codigo: string;
  nome_instancia: string | null;
  logo_url: string | null;
  status: string;
  meta_vagas: number;
  meta_pessoas: number;
  periodo_gratis_fim: string;
  microfranquia: boolean;
  microfranquia_em: string | null;
  criado_em: string;
};

export type PainelData = {
  entrepreneur: EntrepreneurRow;
  refLink: string;
  grupoEmpregados: number;
  grupoEmpregadores: number;
  totalGrupo: number;
  vagasAtivas: number;
  vagasTotalAcumulado: number;
  receitaMes: number;
  taxaPlataformaMes: number;
  vendasMes: number;
  diasRestantes: number;
  diaAtual: number;
  pctVagas: number;
  pctPessoas: number;
  pctGeral: number;
  periodoGratisAtivo: boolean;
  diasGratisRestantes: number;
  pctMicroVagas: number;
  pctMicroPessoas: number;
  microfranquiaConquistada: boolean;
  microfranquiaNova: boolean;
};

export type AcaoDiaria = {
  id: string;
  icon: string;
  texto: string;
  impacto: string;
  urgent?: boolean;
};

function startOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function pct(current: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.round((current / meta) * 100);
}

function calcPeriodo30(criadoEm: string) {
  const startMs = new Date(criadoEm).getTime();
  const diasDecorridos = Math.floor((Date.now() - startMs) / (24 * 60 * 60 * 1000)) + 1;
  const diaAtual = Math.min(PERIODO_META_DIAS, Math.max(1, diasDecorridos));
  const diasRestantes = Math.max(0, PERIODO_META_DIAS - diasDecorridos);
  return { diaAtual, diasRestantes };
}

export function gerarAcoesDiarias(
  pctVagas: number,
  pctPessoas: number,
  pctGeral: number,
  diasRestantes: number
): AcaoDiaria[] {
  const acoes: AcaoDiaria[] = [];

  if (pctVagas < 30) {
    acoes.push({
      id: "empresas",
      icon: "🏢",
      texto: "Aborde 3 empresas com seu link hoje",
      impacto: "+3 vagas",
    });
  }
  if (pctPessoas < 30) {
    acoes.push({
      id: "whatsapp",
      icon: "💬",
      texto: "Compartilhe em 2 grupos do WhatsApp",
      impacto: "+10 pessoas",
    });
  }
  if (diasRestantes < 7 && pctGeral < 80) {
    acoes.push({
      id: "urgente",
      icon: "⚠️",
      texto: `URGENTE: só ${diasRestantes} dias restantes!`,
      impacto: "meta em risco",
      urgent: true,
    });
  }
  acoes.push({
    id: "perfil",
    icon: "✅",
    texto: "Verifique se novos usuários completaram o perfil",
    impacto: "+engajamento",
  });
  acoes.push({
    id: "qr",
    icon: "🔲",
    texto: "Compartilhe seu QR Code hoje",
    impacto: "+cadastros",
  });

  return acoes.slice(0, 5);
}

export function corProgresso(p: number): string {
  if (p >= 100) return "#1D9E75";
  if (p >= 80) return "#1557FF";
  if (p >= 50) return "#D97706";
  return "#DC2626";
}

export function mensagemMotivacional(pctGeral: number): string {
  if (pctGeral >= 100) return "🎉 Meta batida! Continue crescendo!";
  if (pctGeral >= 60) return "Quase lá! Mais um esforço!";
  if (pctGeral >= 30) return "Bom progresso! Foque em trazer empresas.";
  return "Compartilhe seu link agora! 📤";
}

async function maybeGrantMicrofranquia(
  userId: string,
  totalGrupo: number,
  vagasTotal: number,
  already: boolean
): Promise<boolean> {
  if (already) return false;
  if (totalGrupo < MICROFRANQUIA_META_PESSOAS || vagasTotal < MICROFRANQUIA_META_VAGAS) {
    return false;
  }
  const { error } = await supabase
    .from("entrepreneurs")
    .update({ microfranquia: true, microfranquia_em: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("microfranquia", false);
  return !error;
}

export async function fetchPainelData(userId: string): Promise<PainelData | null> {
  const monthStart = startOfMonthIso();

  const [entRes, groupRes, commRes, commCountRes] = await Promise.all([
    supabase.from("entrepreneurs").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("user_group")
      .select("user_id, users(tipo)")
      .eq("empreendedor_id", userId)
      .eq("ativo", true),
    supabase
      .from("commissions")
      .select("valor_empreendedor, valor_plataforma, valor_bruto")
      .eq("empreendedor_id", userId)
      .gte("criado_em", monthStart),
    supabase
      .from("commissions")
      .select("id", { count: "exact", head: true })
      .eq("empreendedor_id", userId)
      .gte("criado_em", monthStart),
  ]);

  const ent = entRes.data as EntrepreneurRow | null;
  if (!ent) return null;

  const members = groupRes.data ?? [];
  let grupoEmpregados = 0;
  let grupoEmpregadores = 0;
  const empregadorIds: string[] = [];

  members.forEach((m: { user_id: string; users: { tipo: string } | { tipo: string }[] | null }) => {
    const u = Array.isArray(m.users) ? m.users[0] : m.users;
    const tipo = u?.tipo;
    if (tipo === "empregado") grupoEmpregados += 1;
    else if (tipo === "empregador") {
      grupoEmpregadores += 1;
      empregadorIds.push(m.user_id);
    }
  });

  const totalGrupo = members.length;

  let vagasAtivas = 0;
  let vagasTotalAcumulado = 0;
  if (empregadorIds.length) {
    const [ativasRes, totalRes] = await Promise.all([
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .in("empregador_id", empregadorIds)
        .eq("ativa", true),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .in("empregador_id", empregadorIds),
    ]);
    vagasAtivas = ativasRes.count ?? 0;
    vagasTotalAcumulado = totalRes.count ?? 0;
  }

  let receitaMes = 0;
  let taxaPlataformaMes = 0;
  (commRes.data ?? []).forEach((c) => {
    receitaMes += Number(c.valor_empreendedor ?? 0);
    taxaPlataformaMes += Number(c.valor_plataforma ?? 0);
  });

  const vendasMes = commCountRes.count ?? 0;

  const { diaAtual, diasRestantes } = calcPeriodo30(ent.criado_em);
  const pctVagas = pct(vagasAtivas, ent.meta_vagas);
  const pctPessoas = pct(totalGrupo, ent.meta_pessoas);
  const pctGeral = Math.round((pctVagas + pctPessoas) / 2);

  const fimGratis = new Date(ent.periodo_gratis_fim).getTime();
  const periodoGratisAtivo = Date.now() < fimGratis;
  const diasGratisRestantes = Math.max(0, Math.ceil((fimGratis - Date.now()) / (24 * 60 * 60 * 1000)));

  const pctMicroVagas = pct(vagasTotalAcumulado, MICROFRANQUIA_META_VAGAS);
  const pctMicroPessoas = pct(totalGrupo, MICROFRANQUIA_META_PESSOAS);

  let microfranquiaConquistada = ent.microfranquia;
  let microfranquiaNova = false;
  if (!microfranquiaConquistada) {
    microfranquiaNova = await maybeGrantMicrofranquia(userId, totalGrupo, vagasTotalAcumulado, false);
    if (microfranquiaNova) {
      microfranquiaConquistada = true;
      void notifyMicrofranquia(userId);
    }
  }

  void maybeNotifyMetaBatida(userId, pctGeral);

  return {
    entrepreneur: microfranquiaNova
      ? { ...ent, microfranquia: true, microfranquia_em: new Date().toISOString() }
      : ent,
    refLink: `${REF_LINK_BASE}/${ent.codigo}`,
    grupoEmpregados,
    grupoEmpregadores,
    totalGrupo,
    vagasAtivas,
    vagasTotalAcumulado,
    receitaMes,
    taxaPlataformaMes,
    vendasMes,
    diasRestantes,
    diaAtual,
    pctVagas,
    pctPessoas,
    pctGeral,
    periodoGratisAtivo,
    diasGratisRestantes,
    pctMicroVagas,
    pctMicroPessoas,
    microfranquiaConquistada,
    microfranquiaNova,
  };
}

export function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
