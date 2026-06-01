import type { PixTipo, TipoPessoaEmpreendedor } from "../constants/empreendedor";
import { supabase } from "./supabase";

export type EmpreendedorOnboardingDraft = {
  nome: string;
  celular: string;
  email: string;
  cep: string;
  cidade: string;
  estado: string;
  tipoPessoa: TipoPessoaEmpreendedor;
  documento: string;
  nomeInstancia: string;
  corPrincipal: string;
  logoUri: string | null;
  pixTipo: PixTipo;
  pixChave: string;
  pixBanco: string;
  pixNomeConta: string;
  termosOk: boolean;
  parceiroOk: boolean;
  generatedCodigo: string;
};

export const defaultEmpreendedorDraft = (): EmpreendedorOnboardingDraft => ({
  nome: "",
  celular: "",
  email: "",
  cep: "",
  cidade: "",
  estado: "",
  tipoPessoa: "mei",
  documento: "",
  nomeInstancia: "",
  corPrincipal: "#D97706",
  logoUri: null,
  pixTipo: "cpf",
  pixChave: "",
  pixBanco: "",
  pixNomeConta: "",
  termosOk: false,
  parceiroOk: false,
  generatedCodigo: "",
});

function baseCodeFromName(nome: string): string {
  const first = nome.trim().split(/\s+/)[0] ?? "DIARIA";
  const letters = first.replace(/[^a-zA-ZÀ-ÿ]/g, "").toUpperCase();
  const prefix = (letters.slice(0, 4) || "DIAR").padEnd(4, "X");
  const year = new Date().getFullYear().toString().slice(-2);
  return `${prefix}${year}`.slice(0, 10);
}

export async function generateUniqueEntrepreneurCode(nome: string): Promise<string> {
  let base = baseCodeFromName(nome);
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? base : `${base.slice(0, 8)}${i}`;
    const { data } = await supabase
      .from("entrepreneurs")
      .select("codigo")
      .eq("codigo", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base.slice(0, 6)}${Date.now().toString().slice(-4)}`;
}

export async function completeEmpreendedorOnboarding(
  userId: string,
  draft: EmpreendedorOnboardingDraft
) {
  const codigo =
    draft.generatedCodigo || (await generateUniqueEntrepreneurCode(draft.nome));

  const { error: userErr } = await supabase
    .from("users")
    .update({
      nome: draft.nome.trim(),
      celular: draft.celular,
      email: draft.email.trim(),
      cep: draft.cep.replace(/\D/g, ""),
      cidade: draft.cidade,
      estado: draft.estado,
      onboarding_completo: true,
    })
    .eq("id", userId);
  if (userErr) throw userErr;

  const { error: entErr } = await supabase.from("entrepreneurs").upsert(
    {
      user_id: userId,
      codigo,
      nome_instancia: draft.nomeInstancia.trim(),
      cor_principal: draft.corPrincipal,
      logo_url: draft.logoUri,
      pix_chave: draft.pixChave.trim(),
      pix_tipo: draft.pixTipo,
      pix_banco: draft.pixBanco.trim(),
      pix_nome_conta: draft.pixNomeConta.trim(),
      tipo_pessoa: draft.tipoPessoa,
      documento: draft.documento.replace(/\D/g, ""),
    },
    { onConflict: "user_id" }
  );
  if (entErr) throw entErr;

  const { error: coinErr } = await supabase.from("user_coins").upsert(
    { user_id: userId, balance: 0, total_earned: 0 },
    { onConflict: "user_id" }
  );
  if (coinErr) throw coinErr;

  return codigo;
}
