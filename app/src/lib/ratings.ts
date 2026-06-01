import { earnCoins } from "./coins";
import { supabase } from "./supabase";

export type RatingRow = {
  id: string;
  nota: number;
  topicos: string[] | null;
  comentario: string | null;
  criado_em: string;
  avaliador_nome: string;
  avaliador_foto: string | null;
  job_titulo: string;
};

export type RatingSummary = {
  nota_media: number | null;
  total_avaliacoes: number;
  distribuicao: Record<1 | 2 | 3 | 4 | 5, number>;
  topicos_mais_citados: { tag: string; count: number }[];
};

export type RatingApplicationContext = {
  applicationId: string;
  status: string;
  avaliacao_expires_at: string | null;
  jobTitulo: string;
  avaliadorId: string;
  avaliadoId: string;
  avaliadoNome: string;
  avaliadoFoto: string | null;
  avaliadoSubtitle: string;
  avaliadoRole: "empregado" | "empregador";
};

export async function hasUserRated(applicationId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("ratings")
    .select("id")
    .eq("application_id", applicationId)
    .eq("avaliador_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function fetchRatingApplicationContext(
  applicationId: string,
  viewerId: string
): Promise<RatingApplicationContext | null> {
  const { data: app, error } = await supabase
    .from("applications")
    .select("id, status, candidato_id, job_id, avaliacao_expires_at")
    .eq("id", applicationId)
    .maybeSingle();
  if (error) throw error;
  if (!app) return null;

  const { data: job } = await supabase
    .from("jobs")
    .select("titulo, empregador_id")
    .eq("id", app.job_id)
    .maybeSingle();
  if (!job) return null;

  const isCandidate = viewerId === app.candidato_id;
  const isEmployer = viewerId === job.empregador_id;
  if (!isCandidate && !isEmployer) return null;

  const avaliadoId = isCandidate ? job.empregador_id : app.candidato_id;
  const { data: avaliado } = await supabase
    .from("users")
    .select("nome, foto_url, cidade, tipo_contratante, razao_social, nome_fantasia")
    .eq("id", avaliadoId)
    .maybeSingle();

  let subtitle = avaliado?.cidade ?? "";
  if (!isCandidate && avaliado) {
    subtitle = "Profissional";
  } else if (avaliado?.nome_fantasia) {
    subtitle = avaliado.nome_fantasia;
  } else if (avaliado?.razao_social) {
    subtitle = avaliado.razao_social;
  } else if (avaliado?.tipo_contratante === "empresa") {
    subtitle = "Empresa";
  } else {
    subtitle = avaliado?.cidade ?? "Contratante";
  }

  return {
    applicationId: app.id,
    status: app.status,
    avaliacao_expires_at: app.avaliacao_expires_at,
    jobTitulo: job.titulo,
    avaliadorId: viewerId,
    avaliadoId,
    avaliadoNome: avaliado?.nome ?? "Usuário",
    avaliadoFoto: avaliado?.foto_url ?? null,
    avaliadoSubtitle: subtitle,
    avaliadoRole: isCandidate ? "empregador" : "empregado",
  };
}

function assertCanRate(ctx: RatingApplicationContext) {
  if (ctx.status !== "concluida") {
    throw new Error("A diária precisa estar concluída para avaliar.");
  }
  if (ctx.avaliacao_expires_at && new Date(ctx.avaliacao_expires_at).getTime() < Date.now()) {
    throw new Error("O prazo de 48h para avaliar expirou.");
  }
}

export async function submitRating(params: {
  applicationId: string;
  avaliadorId: string;
  avaliadoId: string;
  nota: number;
  topicos: string[];
  comentario?: string;
  avaliadoRole: "empregado" | "empregador";
}): Promise<void> {
  const ctx = await fetchRatingApplicationContext(params.applicationId, params.avaliadorId);
  if (!ctx) throw new Error("Candidatura não encontrada.");
  assertCanRate(ctx);
  if (ctx.avaliadoId !== params.avaliadoId) throw new Error("Participante inválido.");

  const already = await hasUserRated(params.applicationId, params.avaliadorId);
  if (already) throw new Error("Você já avaliou esta diária.");

  const { error: insErr } = await supabase.from("ratings").insert({
    application_id: params.applicationId,
    avaliador_id: params.avaliadorId,
    avaliado_id: params.avaliadoId,
    nota: params.nota,
    topicos: params.topicos.length ? params.topicos : null,
    comentario: params.comentario?.trim() || null,
  });
  if (insErr) throw insErr;

  const coinReason =
    params.avaliadoRole === "empregado" ? "avaliou_candidato" : "avaliou_contratante";
  await earnCoins(params.avaliadorId, 3, coinReason, params.applicationId);

  if (params.nota === 5) {
    await earnCoins(params.avaliadoId, 5, "avaliacao_5_estrelas", params.applicationId);
  }
}

export async function fetchRatings(
  userId: string,
  limit = 10,
  offset = 0
): Promise<RatingRow[]> {
  const { data, error } = await supabase
    .from("ratings")
    .select(
      `
      id,
      nota,
      topicos,
      comentario,
      criado_em,
      avaliador_id,
      application_id,
      applications ( jobs ( titulo ) )
    `
    )
    .eq("avaliado_id", userId)
    .order("criado_em", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;

  const rows = data ?? [];
  const avaliadorIds = [...new Set(rows.map((r) => r.avaliador_id as string))];
  const { data: users } = await supabase
    .from("users")
    .select("id, nome, foto_url")
    .in("id", avaliadorIds.length ? avaliadorIds : ["00000000-0000-0000-0000-000000000000"]);

  const uMap = new Map((users ?? []).map((u) => [u.id, u]));

  return rows.map((r) => {
    const app = r.applications as { jobs?: { titulo?: string } | { titulo?: string }[] } | null;
    const jobs = app?.jobs;
    const titulo = Array.isArray(jobs) ? jobs[0]?.titulo : jobs?.titulo;
    const av = uMap.get(r.avaliador_id as string);
    return {
      id: r.id as string,
      nota: r.nota as number,
      topicos: (r.topicos as string[] | null) ?? null,
      comentario: (r.comentario as string | null) ?? null,
      criado_em: r.criado_em as string,
      avaliador_nome: av?.nome ?? "Usuário",
      avaliador_foto: av?.foto_url ?? null,
      job_titulo: titulo ?? "Diária",
    };
  });
}

export async function fetchRatingSummary(userId: string): Promise<RatingSummary> {
  const { data: user } = await supabase
    .from("users")
    .select("nota_media")
    .eq("id", userId)
    .maybeSingle();

  const { data: rows, error } = await supabase
    .from("ratings")
    .select("nota, topicos")
    .eq("avaliado_id", userId);
  if (error) throw error;

  const distribuicao: RatingSummary["distribuicao"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const topicCounts = new Map<string, number>();

  for (const r of rows ?? []) {
    const n = r.nota as number;
    if (n >= 1 && n <= 5) distribuicao[n as 1 | 2 | 3 | 4 | 5] += 1;
    for (const t of (r.topicos as string[] | null) ?? []) {
      topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
    }
  }

  const total = rows?.length ?? 0;
  let nota_media: number | null = user?.nota_media != null ? Number(user.nota_media) : null;
  if (nota_media == null && total > 0) {
    const sum = (rows ?? []).reduce((a, r) => a + (r.nota as number), 0);
    nota_media = Math.round((sum / total) * 10) / 10;
  }

  const topicos_mais_citados = [...topicCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    nota_media,
    total_avaliacoes: total,
    distribuicao,
    topicos_mais_citados,
  };
}
