import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { JobCard } from "../../../../src/components/JobCard";
import { colors } from "../../../../src/constants/theme";
import { fetchFeedJobs } from "../../../../src/lib/jobsFeed";
import { supabase } from "../../../../src/lib/supabase";
import type { FeedFilters, JobRow } from "../../../../src/types/job";

const FILTER_CHIPS: { id: string; label: string; patch: Partial<FeedFilters> }[] = [
  { id: "all", label: "Todos", patch: {} },
  { id: "urg", label: "⚡ Urgente", patch: { urgente: true } },
  { id: "ho", label: "🏠 Home Office", patch: { formato: "home_office" } },
  { id: "pre", label: "📍 Presencial", patch: { formato: "presencial" } },
  { id: "lim", label: "🧹 Limpeza", patch: { categoria: "limpeza" } },
  { id: "gar", label: "🍽️ Garçom", patch: { categoria: "garçom" } },
];

export default function EmpregadoFeedScreen() {
  const [nome, setNome] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [grupoId, setGrupoId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChip, setActiveChip] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const filters: FeedFilters = useMemo(() => {
    const chip = FILTER_CHIPS.find((c) => c.id === activeChip);
    return { ...chip?.patch, q: debouncedQ || undefined };
  }, [activeChip, debouncedQ]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id;
      if (!id) return;
      setUserId(id);
      const { data: u } = await supabase.from("users").select("nome").eq("id", id).maybeSingle();
      if (u?.nome) setNome(u.nome.split(" ")[0] ?? u.nome);
      const { data: g } = await supabase
        .from("user_group")
        .select("empreendedor_id")
        .eq("user_id", id)
        .maybeSingle();
      setGrupoId(g?.empreendedor_id ?? null);
    });
  }, []);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const batch = await fetchFeedJobs(userId, filters, 0, 20);
      setJobs(batch);
      setOffset(batch.length);
    } catch {
      setJobs([]);
      setOffset(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, filters]);

  useEffect(() => {
    reload();
  }, [reload]);

  const loadMore = useCallback(async () => {
    if (!userId || loadingMore) return;
    setLoadingMore(true);
    try {
      const batch = await fetchFeedJobs(userId, filters, offset, 20);
      if (batch.length) {
        setJobs((prev) => [...prev, ...batch]);
        setOffset((o) => o + batch.length);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [userId, filters, offset, loadingMore]);

  const urgent = jobs.filter((j) => j.urgente);
  const normal = jobs.filter((j) => !j.urgente);

  const listData = useMemo(() => {
    const out: ({ type: "header"; title: string } | { type: "job"; job: JobRow })[] = [];
    if (urgent.length) {
      out.push({ type: "header", title: "🔥 Urgente hoje" });
      urgent.forEach((job) => out.push({ type: "job", job }));
    }
    out.push({ type: "header", title: "📋 Disponíveis agora" });
    normal.forEach((job) => out.push({ type: "job", job }));
    return out;
  }, [urgent, normal]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Olá, {nome || "…"} 👋</Text>
          <Text style={styles.headline}>Trabalhe hoje</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(nome[0] ?? "?").toUpperCase()}</Text>
        </View>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Cargo, bairro, empresa..."
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        {FILTER_CHIPS.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setActiveChip(c.id)}
            style={[styles.chip, activeChip === c.id && styles.chipOn]}
          >
            <Text style={[styles.chipText, activeChip === c.id && styles.chipTextOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading && !jobs.length ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.green} size="large" />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, i) =>
            item.type === "header" ? `h-${item.title}` : `j-${item.job.id}-${i}`
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                reload();
              }}
              tintColor={colors.green}
            />
          }
          onEndReached={() => {
            if (jobs.length >= offset && offset > 0) loadMore();
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhuma vaga por aqui</Text>
              <Text style={styles.emptySub}>Tente limpar filtros ou volte mais tarde.</Text>
              <Pressable
                onPress={() => {
                  setActiveChip("all");
                  setSearch("");
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearText}>Limpar filtros</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) =>
            item.type === "header" ? (
              <Text style={styles.section}>{item.title}</Text>
            ) : (
              <JobCard
                job={item.job}
                highlightGrupo={
                  !!grupoId &&
                  item.job.destaque_grupo_id === grupoId &&
                  item.job.destaque_nivel === "grupo"
                }
                onPress={() =>
                  router.push({
                    pathname: "/(app)/(empregado)/vagas/[id]",
                    params: {
                      id: item.job.id,
                      job: encodeURIComponent(JSON.stringify(item.job)),
                    },
                  })
                }
              />
            )
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.green} style={{ marginVertical: 16 }} /> : null
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.white,
  },
  hello: { fontSize: 13, color: colors.soft },
  headline: { fontSize: 20, fontWeight: "800", color: colors.dark },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800" },
  search: {
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.white,
  },
  chipsScroll: { maxHeight: 44, marginVertical: 10, paddingLeft: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E1F5EE",
    marginRight: 8,
  },
  chipOn: { backgroundColor: colors.green },
  chipText: { fontSize: 12, fontWeight: "700", color: "#065F46" },
  chipTextOn: { color: "#fff" },
  section: {
    fontWeight: "800",
    color: colors.dark,
    marginTop: 12,
    marginBottom: 8,
    fontSize: 15,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { padding: 32, alignItems: "center" },
  emptyTitle: { fontWeight: "800", fontSize: 17, color: colors.dark },
  emptySub: { color: colors.soft, marginTop: 8, textAlign: "center" },
  clearBtn: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 },
  clearText: { color: colors.primary, fontWeight: "700" },
});
