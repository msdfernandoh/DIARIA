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
  markedDates: Record<string, { selected: boolean; selectedColor: string }>;
  turnos: string[];
  raioKm: number;
  recorrente: boolean;
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
  markedDates: {},
  turnos: ["manha", "tarde"],
  raioKm: 10,
  recorrente: true,
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

function weekdaysFromMarkedDates(
  marked: Record<string, { selected?: boolean }>
): number[] {
  const days = new Set<number>();
  Object.keys(marked).forEach((iso) => {
    const d = new Date(iso + "T12:00:00");
    days.add(d.getDay());
  });
  return Array.from(days).sort((a, b) => a - b);
}

function specificDatesFromMarked(
  marked: Record<string, { selected?: boolean }>
): string[] {
  return Object.keys(marked).filter((k) => marked[k]?.selected !== false).sort();
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
      onboarding_completo: true,
    })
    .eq("id", userId);
  if (userErr) throw userErr;

  const diasSemana = draft.recorrente
    ? weekdaysFromMarkedDates(draft.markedDates)
    : [];
  const datasEspecificas = draft.recorrente
    ? []
    : specificDatesFromMarked(draft.markedDates);

  const { error: availErr } = await supabase.from("user_availability").upsert(
    {
      user_id: userId,
      dias_semana: diasSemana.length ? diasSemana : [1, 2, 3, 4, 5],
      datas_especificas: datasEspecificas.length ? datasEspecificas : null,
      turnos: draft.turnos,
      raio_km: draft.raioKm,
      recorrente: draft.recorrente,
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
  }
}

export async function routeAfterAuth(userId: string): Promise<"/(app)/home" | "/(onboarding)/empregado/dados"> {
  const status = await fetchOnboardingStatus(userId);
  if (status?.tipo === "empregado" && status.onboarding_completo !== true) {
    return "/(onboarding)/empregado/dados";
  }
  return "/(app)/home";
}
