import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JobCard } from "../../src/components/JobCard";
import { colors } from "../../src/constants/theme";
import { fetchDemoJobs } from "../../src/lib/jobsFeed";
import type { JobRow } from "../../src/types/job";

export default function VagasPreviewScreen() {
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<JobRow | null>(null);

  useEffect(() => {
    void fetchDemoJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  function openJob(job: JobRow) {
    setSelected(job);
    router.push({
      pathname: "/(app)/(empregado)/vagas/[id]",
      params: { id: job.id, job: encodeURIComponent(JSON.stringify(job)), preview: "1" },
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.head}>👋 Veja vagas disponíveis</Text>
      <Text style={styles.sub}>Cadastre-se grátis para se candidatar</Text>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom }}
        renderItem={({ item }) => (
          <Pressable onPress={() => openJob(item)}>
            <JobCard job={item} />
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Carregando vagas de demonstração…</Text>}
      />
      <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
        <Pressable style={styles.footerBtn} onPress={() => router.push("/(auth)/choose-profile")}>
          <Text style={styles.footerBtnText}>
            Ver {jobs.length || ""} vagas na sua cidade →
          </Text>
        </Pressable>
      </View>

      <Modal visible={sheet} transparent animationType="slide">
        <View style={styles.sheetBg}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Para se candidatar, crie sua conta grátis</Text>
            <Text style={styles.sheetSub}>2 minutos. Sem cartão. Sem taxa.</Text>
            <Pressable
              style={styles.sheetPrimary}
              onPress={() => {
                setSheet(false);
                router.push("/(auth)/choose-profile");
              }}
            >
              <Text style={styles.sheetPrimaryText}>Criar conta grátis →</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.sheetLink}>Já tenho conta</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function showCandidaturaSheet(setSheet: (v: boolean) => void) {
  setSheet(true);
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  head: { fontSize: 20, fontWeight: "800", paddingHorizontal: 16, paddingTop: 12, color: colors.dark },
  sub: { color: colors.soft, paddingHorizontal: 16, marginBottom: 8 },
  empty: { textAlign: "center", color: colors.soft, marginTop: 40 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerBtn: {
    backgroundColor: colors.green,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  footerBtnText: { color: "#fff", fontWeight: "800" },
  sheetBg: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.4)" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.dark },
  sheetSub: { color: colors.soft, marginTop: 8, marginBottom: 16 },
  sheetPrimary: {
    backgroundColor: colors.green,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  sheetPrimaryText: { color: "#fff", fontWeight: "800" },
  sheetLink: { textAlign: "center", marginTop: 14, color: colors.primary, fontWeight: "700" },
});
