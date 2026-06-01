import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../../src/constants/theme";
import { spendCoins } from "../../../../src/lib/coins";
import { supabase } from "../../../../src/lib/supabase";

export default function DestaqueVagaScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [empreendedorId, setEmpreendedorId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");

  useEffect(() => {
    void (async () => {
      if (!jobId) return;
      const { data: job } = await supabase.from("jobs").select("titulo").eq("id", jobId).maybeSingle();
      if (job?.titulo) setTitulo(job.titulo);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { data: g } = await supabase
        .from("user_group")
        .select("empreendedor_id")
        .eq("user_id", uid)
        .eq("ativo", true)
        .maybeSingle();
      setEmpreendedorId(g?.empreendedor_id ?? uid);
    })();
  }, [jobId]);

  function pay(valor: string, produto: string) {
    router.push({
      pathname: "/(app)/pagamento/pix",
      params: { valor, produto, empreendedor_id: empreendedorId ?? "" },
    });
  }

  async function coins() {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid || !jobId) return;
    try {
      await spendCoins(uid, 200, "vaga_destaque", jobId);
      Alert.alert("Solicitado", "Destaque da vaga com moedas registrado.");
    } catch (e) {
      Alert.alert("Moedas", e instanceof Error ? e.message : "Saldo insuficiente.");
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Destaque da vaga</Text>
      <Text style={styles.sub}>{titulo}</Text>
      <Pressable style={styles.card} onPress={() => pay("9,00", "Vaga no topo — grupo")}>
        <Text style={styles.cardTitle}>⭐ Topo do grupo · R$9/semana</Text>
      </Pressable>
      <Pressable style={styles.card} onPress={() => pay("14,00", "Vaga no topo — cidade")}>
        <Text style={styles.cardTitle}>🏙️ Topo da cidade · R$14/semana</Text>
      </Pressable>
      <Pressable style={[styles.card, styles.coins]} onPress={() => void coins()}>
        <Text style={styles.cardTitle}>🪙 200 moedas · 7 dias</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark },
  sub: { color: colors.soft, marginBottom: 16 },
  card: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  coins: { borderColor: colors.primary },
  cardTitle: { fontWeight: "800", color: colors.dark },
});
