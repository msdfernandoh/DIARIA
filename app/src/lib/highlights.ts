import { supabase } from "./supabase";

export type HighlightProduct = "topo_grupo" | "topo_cidade";

const DURATION_DAYS = 7;

export async function purchaseHighlight(params: {
  tipoEntidade: "vaga" | "candidato";
  entidadeId: string;
  nivel: "grupo" | "cidade";
  empreendedorId: string;
  valorCobrado: number;
  userId: string;
}): Promise<void> {
  const ate = new Date(Date.now() + DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error: hErr } = await supabase.from("highlights").insert({
    tipo_entidade: params.tipoEntidade === "vaga" ? "vaga" : "candidato",
    entidade_id: params.entidadeId,
    nivel: params.nivel,
    grupo_id: params.nivel === "grupo" ? params.empreendedorId : null,
    empreendedor_id: params.empreendedorId,
    valor_cobrado: params.valorCobrado,
    status_pagamento: "pago",
    ativo_ate: ate,
  });
  if (hErr) throw hErr;

  if (params.tipoEntidade === "vaga") {
    const { error: jErr } = await supabase
      .from("jobs")
      .update({
        destaque_nivel: params.nivel,
        destaque_grupo_id: params.nivel === "grupo" ? params.empreendedorId : null,
        destaque_ate: ate,
      })
      .eq("id", params.entidadeId);
    if (jErr) throw jErr;
  }

  const pctEmp = params.nivel === "grupo" ? 90 : 50;
  const valorEmp = (params.valorCobrado * pctEmp) / 100;
  const valorPlat = params.valorCobrado - valorEmp;
  await supabase.from("commissions").insert({
    empreendedor_id: params.empreendedorId,
    tipo: params.nivel === "grupo" ? "topo_grupo" : "upgrade_cidade",
    valor_bruto: params.valorCobrado,
    pct_empreendedor: pctEmp,
    valor_empreendedor: valorEmp,
    valor_plataforma: valorPlat,
    status: "pago",
    pago_em: new Date().toISOString(),
  });
}

export async function activateHighlightFromCoins(params: {
  jobId?: string;
  userId: string;
  empreendedorId: string;
  nivel: "grupo";
}): Promise<void> {
  if (params.jobId) {
    await purchaseHighlight({
      tipoEntidade: "vaga",
      entidadeId: params.jobId,
      nivel: "grupo",
      empreendedorId: params.empreendedorId,
      valorCobrado: 0,
      userId: params.userId,
    });
  }
}

export async function checkAndExpireHighlights(): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("jobs")
    .update({
      destaque_nivel: "organico",
      destaque_grupo_id: null,
      destaque_ate: null,
    })
    .lt("destaque_ate", now)
    .neq("destaque_nivel", "organico")
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
