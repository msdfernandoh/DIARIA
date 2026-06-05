import { grantSignupCoins } from "./coins";
import { notifyEmpreendedorNovoGrupo } from "./notifications";
import { supabase } from "./supabase";

export type EmpregadoOnboardingDraft = {
  cep: string;
  cidade: string;
  estado: string;
  bairro: string;
  endereco: string;
  trabalhaPresencial: boolean;
  trabalhaRemoto: boolean;
  skills: string[];
  valorMinDia: number;
  valorMaxDia: number;
  diasSemana: number[];
  disponivelQualquerDia: boolean;
  turnos: string[];
  horasPorDia: number;
  horasPorSemana: number;
  tipoJornada: string[];
  semTransporteProprio: boolean;
  temMoto: boolean;
  temCarro: boolean;
  temVan: boolean;
  temBicicleta: boolean;
  raioKm: number;
  codigo: string;
  codigoValido: boolean;
  codigoEmpreendedorId: string | null;
  codigoInstancia: string | null;
  experiences: {
    id: string;
    cargo: string;
    empresa: string;
    periodo: string;
    tipo: "presencial" | "remoto" | "hibrido";
    descricao: string;
  }[];
  highlightTags: string[];
  celularVisivel: boolean;
};

export const defaultDraft = (): EmpregadoOnboardingDraft => ({
  cep: "",
  cidade: "",
  estado: "",
  bairro: "",
  endereco: "",
  trabalhaPresencial: true,
  trabalhaRemoto: true,
  skills: [],
  valorMinDia: 100,
  valorMaxDia: 250,
  diasSemana: [1, 2, 3, 4, 5],
  disponivelQualquerDia: false,
  turnos: ["manha", "tarde"],
  horasPorDia: 8,
  horasPorSemana: 40,
  tipoJornada: ["diarias_avulsas"],
  semTransporteProprio: true,
  temMoto: false,
  temCarro: false,
  temVan: false,
  temBicicleta: false,
  raioKm: 10,
  codigo: "",
  codigoValido: false,
  codigoEmpreendedorId: null,
  codigoInstancia: null,
  experiences: [],
  highlightTags: [],
  celularVisivel: false,
});

export async function fetchOnboardingStatus(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("tipo, onboarding_completo")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function validateEntrepreneurCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (normalized.length < 4) return null;
  const { data, error } = await supabase
    .from("entrepreneurs")
    .select("user_id, codigo, nome_instancia")
    .eq("codigo", normalized)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function resolveDiasSemana(draft: EmpregadoOnboardingDraft): number[] {
  if (draft.disponivelQualquerDia) {
    return [0, 1, 2, 3, 4, 5, 6];
  }
  return draft.diasSemana.length ? [...draft.diasSemana].sort((a, b) => a - b) : [];
}

export async function completeEmpregadoOnboarding(
  userId: string,
  draft: EmpregadoOnboardingDraft
) {
  const { error: userErr } = await supabase
    .from("users")
    .update({
      cep: draft.cep.replace(/\D/g, ""),
      cidade: draft.cidade,
      estado: draft.estado,
      bairro: draft.bairro || null,
      endereco: draft.endereco || null,
      trabalha_presencial: draft.trabalhaPresencial,
      trabalha_remoto: draft.trabalhaRemoto,
      celular_visivel: draft.celularVisivel,
      valor_min_dia: draft.valorMinDia,
      valor_max_dia: draft.valorMaxDia,
      tem_moto: draft.temMoto,
      tem_carro: draft.temCarro,
      tem_van: draft.temVan,
      tem_bicicleta: draft.temBicicleta,
      onboarding_completo: true,
    })
    .eq("id", userId);
  if (userErr) throw userErr;

  const diasSemana = resolveDiasSemana(draft);
  const turnos =
    draft.turnos.includes("qualquer") || draft.turnos.length === 0
      ? ["manha", "tarde", "noite", "madrugada"]
      : draft.turnos.filter((t) => t !== "qualquer");

  const { error: availErr } = await supabase.from("user_availability").upsert(
    {
      user_id: userId,
      dias_semana: diasSemana.length ? diasSemana : [1, 2, 3, 4, 5],
      datas_especificas: null,
      turnos,
      raio_km: draft.raioKm,
      recorrente: true,
      disponivel_qualquer_dia: draft.disponivelQualquerDia,
      horas_por_dia: draft.horasPorDia,
      horas_por_semana: draft.horasPorSemana,
      tipo_jornada: draft.tipoJornada.length
        ? draft.tipoJornada
        : ["diarias_avulsas"],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (availErr) throw availErr;

  await supabase.from("user_skills").delete().eq("user_id", userId);
  if (draft.skills.length) {
    const { error: skErr } = await supabase.from("user_skills").insert(
      draft.skills.map((skill) => ({ user_id: userId, skill }))
    );
    if (skErr) throw skErr;
  }

  await supabase.from("user_highlights_tags").delete().eq("user_id", userId);
  if (draft.highlightTags.length) {
    const { error: tagErr } = await supabase.from("user_highlights_tags").insert(
      draft.highlightTags.map((tag) => ({ user_id: userId, tag }))
    );
    if (tagErr) throw tagErr;
  }

  await supabase.from("user_experiences").delete().eq("user_id", userId);
  if (draft.experiences.length) {
    const { error: expErr } = await supabase.from("user_experiences").insert(
      draft.experiences.map((e, i) => ({
        user_id: userId,
        cargo: e.cargo,
        empresa: e.empresa || null,
        periodo: e.periodo || null,
        tipo: e.tipo,
        descricao: e.descricao || null,
        ordem: i,
      }))
    );
    if (expErr) throw expErr;
  }

  if (draft.codigoValido && draft.codigoEmpreendedorId && draft.codigo) {
    const { error: grpErr } = await supabase.from("user_group").upsert(
      {
        user_id: userId,
        empreendedor_id: draft.codigoEmpreendedorId,
        codigo_usado: draft.codigo.trim().toUpperCase(),
        ativo: true,
      },
      { onConflict: "user_id" }
    );
    if (grpErr) throw grpErr;
    void notifyEmpreendedorNovoGrupo(draft.codigoEmpreendedorId);
  }

  await grantSignupCoins(
    userId,
    "empregado",
    Boolean(draft.codigoValido && draft.codigoEmpreendedorId),
    draft.codigoEmpreendedorId
  );
}
