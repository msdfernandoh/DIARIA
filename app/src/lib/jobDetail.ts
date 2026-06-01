import type { JobDetail } from "../types/job";
import { haversineKm } from "./jobFormat";
import { supabase } from "./supabase";

async function employerRatings(empregadorId: string) {
  const { data, error } = await supabase
    .from("ratings")
    .select("nota")
    .eq("avaliado_id", empregadorId);
  if (error) throw error;
  if (!data?.length) return { avg: null as number | null, count: 0 };
  const sum = data.reduce((a, r) => a + r.nota, 0);
  return { avg: Math.round((sum / data.length) * 10) / 10, count: data.length };
}

export async function fetchJobDetail(jobId: string, viewerUserId: string): Promise<JobDetail | null> {
  const { data: job, error } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
  if (error) throw error;
  if (!job) return null;

  const { data: viewer } = await supabase
    .from("users")
    .select("lat, lng")
    .eq("id", viewerUserId)
    .maybeSingle();

  const { data: empregador } = await supabase
    .from("users")
    .select("nome, cidade, criado_em")
    .eq("id", job.empregador_id)
    .maybeSingle();

  const ratings = await employerRatings(job.empregador_id);

  let distancia_km: number | null = null;
  if (
    viewer?.lat != null &&
    viewer?.lng != null &&
    job.lat != null &&
    job.lng != null
  ) {
    distancia_km = haversineKm(
      Number(viewer.lat),
      Number(viewer.lng),
      Number(job.lat),
      Number(job.lng)
    );
  }

  return {
    ...(job as JobDetail),
    empregador_nome: empregador?.nome ?? "Contratante",
    empregador_cidade: empregador?.cidade ?? job.cidade,
    empregador_desde: empregador?.criado_em ?? null,
    empregador_nota: ratings.avg,
    total_avaliacoes: ratings.count,
    distancia_km,
  };
}
