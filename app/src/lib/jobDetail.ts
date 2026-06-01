import type { JobDetail } from "../types/job";
import { haversineKm } from "./jobFormat";
import { fetchRatingSummary } from "./ratings";
import { supabase } from "./supabase";

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

  const ratingSummary = await fetchRatingSummary(job.empregador_id);

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
    empregador_nota: ratingSummary.nota_media,
    total_avaliacoes: ratingSummary.total_avaliacoes,
    empregador_top_topics: ratingSummary.topicos_mais_citados,
    distancia_km,
  };
}
