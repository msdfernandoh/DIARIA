import type { JobRow } from "../types/job";

export const NIVEL_PRIORITY = {
  brasil: 1,
  estado: 2,
  cidade: 3,
  grupo: 4,
  organico: 5,
} as const;

/** Prioridade no feed (1 = mais alto). Destaques só contam se o usuário se enquadra. */
export function jobPriority(
  job: Pick<JobRow, "destaque_nivel" | "destaque_grupo_id" | "estado" | "cidade">,
  userCidade: string | null,
  userEstado: string | null,
  /** empreendedor_id do user_group ativo do usuário logado, ou null */
  userGrupoId: string | null
): number {
  const nivel = job.destaque_nivel ?? "organico";

  if (nivel === "brasil") {
    return NIVEL_PRIORITY.brasil;
  }
  if (nivel === "estado" && userEstado && job.estado === userEstado) {
    return NIVEL_PRIORITY.estado;
  }
  if (nivel === "cidade" && userCidade && job.cidade === userCidade) {
    return NIVEL_PRIORITY.cidade;
  }
  if (nivel === "grupo") {
    if (
      userGrupoId &&
      job.destaque_grupo_id &&
      job.destaque_grupo_id === userGrupoId
    ) {
      return NIVEL_PRIORITY.grupo;
    }
    return NIVEL_PRIORITY.organico;
  }
  if (nivel === "organico") {
    return NIVEL_PRIORITY.organico;
  }
  return NIVEL_PRIORITY.organico;
}
