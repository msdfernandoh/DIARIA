import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../../src/constants/theme";
import { applyToJob, ensureApplicationForChat, findApplication } from "../../../../src/lib/applications";
import { fetchJobDetail } from "../../../../src/lib/jobDetail";
import {
  BENEFICIO_ICONS,
  formatJobDate,
  formatMoney,
  formatTime,
  formatoLabel,
  jobDurationLabel,
  staticMapUrl,
} from "../../../../src/lib/jobFormat";
import { supabase } from "../../../../src/lib/supabase";
import type { JobDetail } from "../../../../src/types/job";

function initials(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function memberYear(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).getFullYear().toString();
}

export default function JobDetailScreen() {
  const { id, job: jobParam } = useLocalSearchParams<{ id: string; job?: string }>();
  const insets = useSafeAreaInsets();
  const [job, setJob] = useState<JobDetail | null>(() => {
    if (!jobParam) return null;
    try {
      return JSON.parse(decodeURIComponent(jobParam)) as JobDetail;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!job);
  const [acting, setActing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userNome, setUserNome] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      setUserId(uid);
      const { data: me } = await supabase.from("users").select("nome").eq("id", uid).maybeSingle();
      if (me?.nome) setUserNome(me.nome);
      const detail = await fetchJobDetail(id, uid);
      if (detail) setJob(detail);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function goChat(applicationId: string) {
    router.push({
      pathname: "/(app)/(empregado)/chat/[applicationId]",
      params: { applicationId },
    });
  }

  async function onAsk() {
    if (!job || !userId || acting) return;
    setActing(true);
    try {
      const app = await ensureApplicationForChat(job.id, userId);
      goChat(app.id);
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível abrir o chat.");
    } finally {
      setActing(false);
    }
  }

  async function onApply() {
    if (!job || !userId || acting) return;
    setActing(true);
    try {
      const existing = await findApplication(job.id, userId);
      if (existing) {
        Alert.alert(
          "Você já se candidatou!",
          "Quer ir para o chat com o contratante?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Ir para o chat", onPress: () => goChat(existing.id) },
          ]
        );
        return;
      }
      const app = await applyToJob({
        jobId: job.id,
        candidatoId: userId,
        candidatoNome: userNome || "Profissional",
        empregadorId: job.empregador_id,
        jobTitulo: job.titulo,
      });
      router.replace({
        pathname: "/(app)/(empregado)/vagas/candidatura-sucesso",
        params: { applicationId: app.id, jobId: job.id },
      });
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível candidatar.");
    } finally {
      setActing(false);
    }
  }

  if (loading && !job) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text>Vaga não encontrada.</Text>
      </View>
    );
  }

  const mapUrl =
    job.formato !== "remoto" && job.lat != null && job.lng != null
      ? staticMapUrl(Number(job.lat), Number(job.lng))
      : null;
  const stars =
    job.empregador_nota != null
      ? `★ ${job.empregador_nota.toFixed(1)}`
      : "★ —";
  const dist =
    job.distancia_km != null ? `${job.distancia_km.toFixed(1)} km` : job.cidade ?? "Remoto";

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <LinearGradient colors={["#065F46", "#1D9E75"]} style={styles.hero}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Vagas</Text>
          </Pressable>
          <View style={styles.badges}>
            <Text style={styles.badge}>{job.categoria}</Text>
            <Text style={styles.badge}>{formatoLabel(job.formato)}</Text>
          </View>
          <Text style={styles.heroTitle}>{job.titulo}</Text>
          <Text style={styles.heroMeta}>
            {job.empregador_nome} · {job.cidade ?? "Remoto"} · {dist}
          </Text>
        </LinearGradient>

        <View style={styles.priceCard}>
          <Text style={styles.priceVal}>{formatMoney(job.valor)}</Text>
          <Text style={styles.priceSub}>pagamento combinado diretamente com o contratante</Text>
          {job.urgente ? <Text style={styles.urgente}>🔴 Urgente</Text> : null}
        </View>

        <View style={styles.grid}>
          <InfoCell icon="📅" label="Data" value={formatJobDate(job.data_inicio)} />
          <InfoCell icon="⏰" label="Horário" value={`${formatTime(job.horario_inicio)} – ${formatTime(job.horario_fim)}`} />
          <InfoCell icon="⏱" label="Duração" value={jobDurationLabel(job.horario_inicio, job.horario_fim)} />
          <InfoCell icon="⚠️" label="Vagas" value={`${job.vagas_restantes} restantes`} />
        </View>

        <Section title="Sobre o contratante">
          <View style={styles.employerRow}>
            <View style={styles.empAv}>
              <Text style={styles.empAvText}>{initials(job.empregador_nome)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.empName}>{job.empregador_nome}</Text>
              <Text style={styles.empCity}>{job.empregador_cidade ?? job.cidade ?? "—"}</Text>
              <Text style={styles.empStars}>
                {stars} · {job.total_avaliacoes} avaliações · membro desde {memberYear(job.empregador_desde)}
              </Text>
            </View>
          </View>
        </Section>

        {job.descricao ? (
          <Section title="Descrição">
            <Text style={styles.body}>{job.descricao}</Text>
          </Section>
        ) : null}

        {job.requisitos ? (
          <Section title="Requisitos">
            {job.requisitos.split(/\n+/).filter(Boolean).map((line) => (
              <Text key={line} style={styles.bullet}>
                • {line.trim()}
              </Text>
            ))}
          </Section>
        ) : null}

        {job.beneficios?.length ? (
          <Section title="Benefícios">
            <View style={styles.chips}>
              {job.beneficios.map((b) => (
                <Text key={b} style={styles.chip}>
                  {BENEFICIO_ICONS[b] ?? "✓"} {b.replace(/_/g, " ")}
                </Text>
              ))}
            </View>
          </Section>
        ) : null}

        {job.formato !== "remoto" && (job.endereco || mapUrl) ? (
          <Section title="Local">
            {mapUrl ? (
              <Image source={{ uri: mapUrl }} style={styles.map} resizeMode="cover" />
            ) : (
              <View style={[styles.map, styles.mapPlaceholder]}>
                <Text style={styles.mapPhText}>Mapa indisponível (configure EXPO_PUBLIC_GOOGLE_MAPS_KEY)</Text>
              </View>
            )}
            <Text style={styles.address}>{job.endereco ?? `${job.cidade ?? ""} ${job.estado ?? ""}`.trim()}</Text>
          </Section>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
        <Pressable style={styles.btnSec} onPress={onAsk} disabled={acting}>
          <Text style={styles.btnSecText}>💬 Perguntar</Text>
        </Pressable>
        <Pressable style={styles.btnMain} onPress={onApply} disabled={acting}>
          <Text style={styles.btnMainText}>
            Me candidatar — {formatMoney(job.valor)} 💼
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoCell({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellIcon}>{icon}</Text>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  backBtn: { alignSelf: "flex-start", marginBottom: 12 },
  backText: { color: "#fff", fontWeight: "700" },
  badges: { flexDirection: "row", gap: 8, marginBottom: 10 },
  badge: {
    backgroundColor: "rgba(255,255,255,.18)",
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800", lineHeight: 28 },
  heroMeta: { color: "rgba(255,255,255,.85)", marginTop: 8, fontSize: 14 },
  priceCard: {
    marginHorizontal: 16,
    marginTop: -16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: colors.green,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  priceVal: { fontSize: 28, fontWeight: "800", color: colors.green },
  priceSub: { color: colors.soft, fontSize: 13, marginTop: 4 },
  urgente: { marginTop: 10, color: "#DC2626", fontWeight: "800" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  cell: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cellIcon: { fontSize: 18, marginBottom: 4 },
  cellLabel: { fontSize: 11, color: colors.soft, fontWeight: "700" },
  cellVal: { fontSize: 13, fontWeight: "700", color: colors.dark, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontWeight: "800", fontSize: 16, color: colors.dark, marginBottom: 10 },
  employerRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  empAv: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  empAvText: { color: "#fff", fontWeight: "800" },
  empName: { fontWeight: "800", color: colors.dark },
  empCity: { fontSize: 13, color: colors.soft },
  empStars: { fontSize: 12, color: colors.mid, marginTop: 4 },
  body: { color: colors.mid, lineHeight: 22 },
  bullet: { color: colors.mid, lineHeight: 22, marginBottom: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#E1F5EE",
    color: "#065F46",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  map: { width: "100%", height: 160, borderRadius: 12, backgroundColor: colors.line },
  mapPlaceholder: { alignItems: "center", justifyContent: "center", padding: 12 },
  mapPhText: { textAlign: "center", color: colors.soft, fontSize: 12 },
  address: { marginTop: 8, color: colors.mid, lineHeight: 20 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  btnSec: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
  },
  btnSecText: { fontWeight: "700", color: colors.mid },
  btnMain: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
  },
  btnMainText: { fontWeight: "800", color: "#fff", fontSize: 13, textAlign: "center" },
});
