import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

  useEffect(() => {
    void fetchDemoJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  function openJob(job: JobRow) {
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
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhuma vaga demo no momento. Rode a migration 20260604100000_fase2_demo_platform.sql no Supabase.
          </Text>
        }
      />
      <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
        <Pressable style={styles.footerBtn} onPress={() => router.push("/(auth)/choose-profile")}>
          <Text style={styles.footerBtnText}>
            Ver {jobs.length || ""} vagas na sua cidade →
          </Text>
        </Pressable>
      </View>
    </View>
  );
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
});
