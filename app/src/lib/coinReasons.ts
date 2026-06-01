export function reasonLabel(reason: string): string {
  const map: Record<string, string> = {
    cadastro_sem_codigo: "Bônus de cadastro",
    cadastro_com_codigo: "Bônus com código de indicação",
    indicacao_empregado: "Indicação de profissional",
    indicacao_empregador: "Indicação de empregador",
    diaria_concluida: "Diária concluída",
    avaliacao_5_estrelas: "Avaliação 5 estrelas recebida",
    avaliou_contratante: "Avaliação enviada",
    avaliou_candidato: "Avaliação enviada",
    perfil_completo: "Perfil 100% completo",
    streak_7_dias: "7 dias consecutivos no app",
    curriculo_topo: "Currículo no topo (gasto)",
    vaga_destaque: "Vaga em destaque (gasto)",
    badge_verificado: "Badge verificado (gasto)",
    candidatura_express: "Candidatura express (gasto)",
    filtro_avancado: "Filtro avançado (gasto)",
    oportunidade_fisica: "Oportunidade física (gasto)",
    primeira_candidatura: "Primeira candidatura",
    publicou_primeira_vaga: "Primeira vaga publicada",
  };
  return map[reason] ?? reason.replace(/_/g, " ");
}

export function relativeTxDate(iso: string): string {
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

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
