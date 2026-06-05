import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { categoryLabel } from "../../../src/constants/publishJob";
import { colors } from "../../../src/constants/theme";
import {
  acceptApplication,
  closeEmployerJob,
  fetchEmployerJobs,
  fetchJobCandidates,
  formatAvailabilityLine,
  formatDistanceKm,
  formatExpectedPay,
  rejectApplication,
  skillChipLabel,
  transportEmojis,
  type CandidateCardData,
  type EmployerJobRow,
} from "../../../src/lib/employerMinhasVagas";
import { formatJobDate, formatMoney } from "../../../src/lib/jobFormat";
import { supabase } from "../../../src/lib/supabase";

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function statusBadge(status: string) {
  if (status === "aceita") return { label: "Aceita", style: styles.badgeOk };
  if (status === "recusada") return { label: "Recusada", style: styles.badgeOff };
  if (status === "concluida") return { label: "Concluída", style: styles.badgeDone };
  return { label: "Pendente", style: styles.badgePending };
}

function CandidateCard({
  candidate,
  acting,
  onChat,
  onAccept,
  onReject,
}: {
  candidate: CandidateCardData;
  acting: boolean;
  onChat: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const badge = statusBadge(candidate.status);
  const pay = formatExpectedPay(candidate.valorMinDia, candidate.valorMaxDia);
  const avail = formatAvailabilityLine(candidate.diasSemana, candidate.turnos);
  const dist = formatDistanceKm(candidate.distanciaKm);
  const transport = transportEmojis(candidate.temMoto, candidate.temCarro);
  const stars =
    candidate.notaMedia != null && candidate.totalAvaliacoes > 0
      ? `★ ${candidate.notaMedia.toFixed(1)} (${candidate.totalAvaliacoes})`
      : "Sem avaliações";

  const showActions = candidate.status === "pendente";

  return (
    <View style={styles.candidateCard}>
      <View style={styles.candidateHead}>
        {candidate.fotoUrl ? (
          <Image source={{ uri: candidate.fotoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPh]}>
            <Text style={styles.avatarText}>{initials(candidate.nome)}</Text>
          </View>
        )}
        <View style={styles.candidateHeadText}>
          <Text style={styles.candidateName} numberOfLines={1}>
            {candidate.nome}
          </Text>
          <Text style={styles.stars}>{stars}</Text>
        </View>
        <Text style={badge.style}>{badge.label}</Text>
      </View>

      {candidate.skills.length ? (
        <View style={styles.chips}>
          {candidate.skills.slice(0, 6).map((sk) => (
            <Text key={sk} style={styles.chip}>
              {skillChipLabel(sk)}
            </Text>
          ))}
        </View>
      ) : null}

      {transport ? <Text style={styles.metaLine}>{transport}</Text> : null}
      {pay ? <Text style={styles.metaLine}>{pay}</Text> : null}
      {avail ? <Text style={styles.metaLine}>{avail}</Text> : null}
      {dist ? <Text style={styles.distLine}>{dist}</Text> : null}

      <View style={styles.candidateActions}>
        <Pressable style={styles.btnChat} onPress={onChat} disabled={acting}>
          <Text style={styles.btnChatText}>💬 Conversar</Text>
        </Pressable>
        {showActions ? (
          <>
            <Pressable style={styles.btnAccept} onPress={onAccept} disabled={acting}>
              <Text style={styles.btnAcceptText}>✅ Aceitar</Text>
            </Pressable>
            <Pressable style={styles.btnReject} onPress={onReject} disabled={acting}>
              <Text style={styles.btnRejectText}>❌ Recusar</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

export default function MinhasVagasScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<EmployerJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [candidatesByJob, setCandidatesByJob] = useState<Record<string, CandidateCardData[]>>({});
  const [loadingCandidates, setLoadingCandidates] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const loadJobs = useCallback(async (uid: string) => {
    const rows = await fetchEmployerJobs(uid);
    setJobs(rows);
  }, []);

  const bootstrap = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setJobs([]);
      return;
    }
    await loadJobs(uid);
  }, [loadJobs]);

  useEffect(() => {
    void bootstrap().finally(() => setLoading(false));
  }, [bootstrap]);

  async function onRefresh() {
    if (!userId) return;
    setRefreshing(true);
    try {
      await loadJobs(userId);
      if (expandedJobId) {
        const job = jobs.find((j) => j.id === expandedJobId);
        if (job) {
          const list = await fetchJobCandidates(job.id, job.lat, job.lng);
          setCandidatesByJob((prev) => ({ ...prev, [job.id]: list }));
        }
      }
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível atualizar.");
    } finally {
      setRefreshing(false);
    }
  }

  async function toggleCandidates(job: EmployerJobRow) {
    if (expandedJobId === job.id) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(job.id);
    if (candidatesByJob[job.id]) return;
    setLoadingCandidates(job.id);
    try {
      const list = await fetchJobCandidates(job.id, job.lat, job.lng);
      setCandidatesByJob((prev) => ({ ...prev, [job.id]: list }));
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível carregar candidatos.");
      setExpandedJobId(null);
    } finally {
      setLoadingCandidates(null);
    }
  }

  function goChat(applicationId: string) {
    router.push({
      pathname: "/(app)/(empregador)/chat/[applicationId]",
      params: { applicationId },
    });
  }

  async function patchCandidateList(jobId: string, applicationId: string, status: string) {
    setCandidatesByJob((prev) => {
      const list = prev[jobId];
      if (!list) return prev;
      return {
        ...prev,
        [jobId]: list.map((c) => (c.applicationId === applicationId ? { ...c, status } : c)),
      };
    });
  }

  async function onAccept(jobId: string, applicationId: string) {
    if (!userId || actingOn) return;
    setActingOn(applicationId);
    try {
      await acceptApplication(applicationId, userId);
      await patchCandidateList(jobId, applicationId, "aceita");
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível aceitar.");
    } finally {
      setActingOn(null);
    }
  }

  async function onReject(jobId: string, applicationId: string) {
    if (!userId || actingOn) return;
    Alert.alert("Recusar candidatura", "Confirmar recusa deste candidato?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Recusar",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setActingOn(applicationId);
            try {
              await rejectApplication(applicationId, userId);
              await patchCandidateList(jobId, applicationId, "recusada");
            } catch (e) {
              Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível recusar.");
            } finally {
              setActingOn(null);
            }
          })();
        },
      },
    ]);
  }

  async function onCloseJob(job: EmployerJobRow) {
    if (!userId) return;
    Alert.alert("Encerrar vaga", "A vaga deixa de aparecer no app. Continuar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Encerrar",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await closeEmployerJob(job.id, userId);
              await loadJobs(userId);
            } catch (e) {
              Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível encerrar.");
            }
          })();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
    >
      <Text style={styles.title}>Minhas vagas</Text>
      <Text style={styles.sub}>Gerencie candidatos e converse pelo chat do app.</Text>

      {!jobs.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Você ainda não publicou nenhuma vaga.</Text>
          <Pressable style={styles.btnPrimary} onPress={() => router.push("/(app)/(empregador)/publicar")}>
            <Text style={styles.btnPrimaryText}>Publicar vaga</Text>
          </Pressable>
        </View>
      ) : (
        jobs.map((job) => {
          const expanded = expandedJobId === job.id;
          const candidates = candidatesByJob[job.id];
          return (
            <View key={job.id} style={styles.jobCard}>
              <Text style={styles.jobTitle} numberOfLines={2}>
                {job.titulo}
              </Text>
              <Text style={styles.jobMeta}>
                {job.ativa ? "Ativa" : "Encerrada"} · {categoryLabel(job.categoria ?? "outro")} ·{" "}
                {formatJobDate(job.data_inicio)} · {formatMoney(job.valor)}
              </Text>
              <Text style={styles.jobMeta}>
                {job.candidatos_count} candidato{job.candidatos_count === 1 ? "" : "s"}
              </Text>
              <View style={styles.jobActions}>
                <Pressable style={styles.btnSecondary} onPress={() => void toggleCandidates(job)}>
                  <Text style={styles.btnSecondaryText}>
                    {expanded ? "Ocultar candidatos" : "Ver candidatos"}
                  </Text>
                </Pressable>
                {job.ativa ? (
                  <Pressable style={styles.btnGhost} onPress={() => void onCloseJob(job)}>
                    <Text style={styles.btnGhostText}>Encerrar</Text>
                  </Pressable>
                ) : null}
              </View>

              {expanded ? (
                <View style={styles.candidatesWrap}>
                  {loadingCandidates === job.id ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
                  ) : !candidates?.length ? (
                    <Text style={styles.emptyCandidates}>Nenhum candidato ainda.</Text>
                  ) : (
                    candidates.map((c) => (
                      <CandidateCard
                        key={c.applicationId}
                        candidate={c}
                        acting={actingOn === c.applicationId}
                        onChat={() => goChat(c.applicationId)}
                        onAccept={() => void onAccept(job.id, c.applicationId)}
                        onReject={() => void onReject(job.id, c.applicationId)}
                      />
                    ))
                  )}
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark, marginBottom: 4 },
  sub: { color: colors.soft, marginBottom: 16, lineHeight: 20 },
  empty: { alignItems: "center", paddingVertical: 32, gap: 16 },
  emptyText: { color: colors.soft, textAlign: "center" },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  jobCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  jobTitle: { fontWeight: "800", color: colors.dark, fontSize: 15, marginBottom: 6 },
  jobMeta: { fontSize: 12, color: colors.soft, marginBottom: 4 },
  jobActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  btnSecondary: {
    backgroundColor: "#E8EFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnSecondaryText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  btnGhost: { paddingHorizontal: 12, paddingVertical: 8 },
  btnGhostText: { color: colors.soft, fontWeight: "700", fontSize: 13 },
  candidatesWrap: { marginTop: 12, gap: 10 },
  emptyCandidates: { fontSize: 13, color: colors.soft, marginVertical: 8 },
  candidateCard: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  candidateHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPh: { backgroundColor: colors.line, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800", color: colors.mid, fontSize: 14 },
  candidateHeadText: { flex: 1, minWidth: 0 },
  candidateName: { fontWeight: "800", color: colors.dark, fontSize: 15 },
  stars: { fontSize: 12, fontWeight: "700", color: colors.mid, marginTop: 2 },
  badgeOk: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.green,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePending: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.amber,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeOff: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDone: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  chip: {
    fontSize: 11,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: colors.mid,
  },
  metaLine: { fontSize: 12, color: colors.mid, marginBottom: 4, lineHeight: 18 },
  distLine: { fontSize: 12, fontWeight: "700", color: colors.green, marginBottom: 8 },
  candidateActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  btnChat: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnChatText: { fontSize: 12, fontWeight: "700", color: colors.dark },
  btnAccept: {
    backgroundColor: colors.green,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnAcceptText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  btnReject: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnRejectText: { fontSize: 12, fontWeight: "700", color: "#DC2626" },
});
