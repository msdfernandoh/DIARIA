import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../../src/constants/theme";
import { spendCoins } from "../../../../src/lib/coins";
import { supabase } from "../../../../src/lib/supabase";

export default function DestaqueEmpregadoScreen() {
  const [grupoId, setGrupoId] = useState<string | null>(null);
  const [instancia, setInstancia] = useState("");

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { data: g } = await supabase
        .from("user_group")
        .select("empreendedor_id, entrepreneurs(nome_instancia)")
        .eq("user_id", uid)
        .eq("ativo", true)
        .maybeSingle();
      setGrupoId(g?.empreendedor_id ?? null);
      const ent = g?.entrepreneurs as { nome_instancia?: string } | null;
      setInstancia(ent?.nome_instancia ?? "seu grupo");
    })();
  }, []);

  function payPix(valor: string, produto: string) {
    if (!grupoId) {
      Alert.alert("Grupo", "Você precisa estar em um grupo para contratar destaque.");
      return;
    }
    router.push({
      pathname: "/(app)/pagamento/pix",
      params: {
        valor,
        produto,
        empreendedor_id: grupoId,
      },
    });
  }

  async function useCoins() {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid || !grupoId) return;
    try {
      await spendCoins(uid, 100, "curriculo_topo", uid);
      Alert.alert("Solicitado", "Destaque com moedas registrado. O parceiro ativa em breve.");
    } catch (e) {
      Alert.alert("Moedas", e instanceof Error ? e.message : "Saldo insuficiente.");
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Destaque do currículo</Text>
      <Text style={styles.sub}>Seu currículo aparece na posição orgânica hoje.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>⭐ Topo do meu grupo · R$9/semana</Text>
        <Text style={styles.cardMeta}>Primeiro para contratantes de {instancia}</Text>
        <Pressable style={styles.btn} onPress={() => payPix("9,00", "Currículo no topo — grupo")}>
          <Text style={styles.btnText}>Contratar</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏙️ Topo da cidade · R$14/semana</Text>
        <Text style={styles.cardMeta}>Grupo + upgrade cidade (9+5)</Text>
        <Pressable style={styles.btn} onPress={() => payPix("14,00", "Currículo no topo — cidade")}>
          <Text style={styles.btnText}>Contratar</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🪙 100 moedas · 7 dias no grupo</Text>
        <Pressable style={[styles.btn, styles.btnAlt]} onPress={() => void useCoins()}>
          <Text style={styles.btnText}>Usar moedas</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark },
  sub: { color: colors.soft, marginBottom: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: { fontWeight: "800", color: colors.dark },
  cardMeta: { color: colors.soft, fontSize: 12, marginTop: 6, marginBottom: 12 },
  btn: { backgroundColor: colors.green, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  btnAlt: { backgroundColor: colors.primary },
  btnText: { color: "#fff", fontWeight: "800" },
});
