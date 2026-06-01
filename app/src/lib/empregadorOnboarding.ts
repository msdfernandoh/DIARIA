import { grantSignupCoins } from "./coins";
import { notifyEmpreendedorNovoGrupo } from "./notifications";
import { supabase } from "./supabase";
import type { Segmento, TipoContratante } from "../constants/empregador";
import { validateEntrepreneurCode, fetchOnboardingStatus } from "./empregadoOnboarding";

export type EmpregadorOnboardingDraft = {
  cep: string;
  cidade: string;
  estado: string;
  bairro: string;
  endereco: string;
  tipoContratante: TipoContratante | null;
  razaoSocial: string;
  cnpj: string;
  nomeFantasia: string;
  segmento: Segmento | "";
  codigo: string;
  codigoValido: boolean;
  codigoEmpreendedorId: string | null;
  codigoInstancia: string | null;
};

export const defaultEmpregadorDraft = (): EmpregadorOnboardingDraft => ({
  cep: "",
  cidade: "",
  estado: "",
  bairro: "",
  endereco: "",
  tipoContratante: null,
  razaoSocial: "",
  cnpj: "",
  nomeFantasia: "",
  segmento: "",
  codigo: "",
  codigoValido: false,
  codigoEmpreendedorId: null,
  codigoInstancia: null,
});

export { validateEntrepreneurCode, fetchOnboardingStatus };

export async function completeEmpregadorOnboarding(
  userId: string,
  draft: EmpregadorOnboardingDraft
) {
  const now = new Date();
  const destaqueGratisAte = draft.codigoValido
    ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const filtroAvancadoAte = draft.codigoValido
    ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error: userErr } = await supabase
    .from("users")
    .update({
      cep: draft.cep.replace(/\D/g, ""),
      cidade: draft.cidade,
      estado: draft.estado,
      bairro: draft.bairro || null,
      endereco: draft.endereco || null,
      tipo_contratante: draft.tipoContratante,
      razao_social: draft.tipoContratante === "empresa" ? draft.razaoSocial.trim() || null : null,
      cnpj:
        draft.tipoContratante === "empresa"
          ? draft.cnpj.replace(/\D/g, "") || null
          : null,
      nome_fantasia:
        draft.tipoContratante === "empresa" ? draft.nomeFantasia.trim() || null : null,
      segmento:
        draft.tipoContratante === "empresa" ? draft.segmento || null : null,
      destaque_gratis_ate: destaqueGratisAte,
      filtro_avancado_ate: filtroAvancadoAte,
      onboarding_completo: true,
    })
    .eq("id", userId);
  if (userErr) throw userErr;

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
    "empregador",
    Boolean(draft.codigoValido && draft.codigoEmpreendedorId),
    draft.codigoEmpreendedorId
  );
}
