import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../../../src/constants/theme";
import {
  fetchAdminMetrics,
  fetchEntrepreneursAdmin,
  getPlatformConfig,
  setPlatformConfig,
} from "../../../src/lib/admin";
import { supabase } from "../../../src/lib/supabase";

export default function AdminDashboardScreen() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof fetchAdminMetrics>> | null>(null);
  const [growth, setGrowth] = useState("34");
  const [ents, setEnts] = useState<unknown[]>([]);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setAllowed(false);
        return;
      }
      const { data: u } = await supabase.from("users").select("tipo").eq("id", uid).maybeSingle();
      if (u?.tipo !== "admin_master") {
        router.replace("/");
        return;
      }
      setAllowed(true);
      setMetrics(await fetchAdminMetrics());
      setGrowth((await getPlatformConfig("growth_pct")) ?? "34");
      setEnts(await fetchEntrepreneursAdmin());
    })();
  }, []);

  async function saveGrowth() {
    await setPlatformConfig("growth_pct", growth);
    Alert.alert("Salvo", "Termômetro de crescimento atualizado.");
  }

  if (allowed === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!allowed || !metrics) return null;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.title}>Admin Master</Text>
      <View style={styles.grid}>
        <Metric label="Empregados" value={metrics.usersEmpregado} />
        <Metric label="Empregadores" value={metrics.usersEmpregador} />
        <Metric label="Empreendedores" value={metrics.usersEmpreendedor} />
        <Metric label="Vagas ativas" value={metrics.vagasAtivas} />
        <Metric label="Diárias concluídas" value={metrics.diariasConcluidas} />
        <Metric label="Receita mês" value={`R$ ${metrics.receitaMes.toFixed(0)}`} />
      </View>

      <Text style={styles.section}>Termômetro de crescimento</Text>
      <Text style={styles.phase}>🟢 0–40% Tudo grátis · ⏳ 40–70% · 🔒 70–90% · 🏆 90–100%</Text>
      <TextInput
        style={styles.input}
        value={growth}
        onChangeText={setGrowth}
        keyboardType="number-pad"
        placeholder="% atual"
      />
      <Pressable style={styles.btn} onPress={() => void saveGrowth()}>
        <Text style={styles.btnText}>Salvar growth_pct</Text>
      </Pressable>

      <Text style={styles.section}>Empreendedores</Text>
      {ents.slice(0, 10).map((row) => {
        const r = row as {
          codigo?: string;
          nome_instancia?: string;
          cidade?: string;
          users?: { nome?: string };
        };
        return (
          <Text key={r.codigo} style={styles.row}>
            {r.users?.nome ?? "—"} · {r.codigo} · {r.cidade ?? "—"}
          </Text>
        );
      })}
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", color: colors.dark, marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: {
    width: "47%",
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  metricVal: { fontSize: 20, fontWeight: "800", color: colors.dark },
  metricLabel: { fontSize: 11, color: colors.soft, marginTop: 4 },
  section: { fontSize: 16, fontWeight: "800", marginTop: 24, marginBottom: 8, color: colors.dark },
  phase: { fontSize: 12, color: colors.mid, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.white,
  },
  btn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
  row: { fontSize: 12, color: colors.mid, marginBottom: 6 },
});
