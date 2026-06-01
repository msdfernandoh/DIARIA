import { router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../src/constants/theme";
import { supabase } from "../../../src/lib/supabase";

export default function PagamentoPixScreen() {
  const params = useLocalSearchParams<{
    valor?: string;
    produto?: string;
    empreendedor_id?: string;
    callback_route?: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [pix, setPix] = useState<{
    nome: string;
    chave: string;
    banco: string;
  } | null>(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!params.empreendedor_id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("entrepreneurs")
        .select("pix_nome_conta, pix_chave, pix_banco, users(nome)")
        .eq("user_id", params.empreendedor_id)
        .maybeSingle();
      const u = data?.users as { nome?: string } | { nome?: string }[] | null;
      const nomeUser = Array.isArray(u) ? u[0]?.nome : u?.nome;
      setPix({
        nome: data?.pix_nome_conta ?? nomeUser ?? "Parceiro",
        chave: data?.pix_chave ?? "—",
        banco: data?.pix_banco ?? "—",
      });
      setLoading(false);
    })();
  }, [params.empreendedor_id]);

  async function copyKey() {
    if (pix?.chave) {
      await Clipboard.setStringAsync(pix.chave);
      Alert.alert("Copiado", "Chave Pix copiada.");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.valor}>R$ {params.valor ?? "9,00"}</Text>
      <Text style={styles.produto}>{params.produto ?? "Destaque"}</Text>
      {waiting ? (
        <Text style={styles.wait}>Aguardando confirmação do parceiro no painel de vendas.</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Pagar para</Text>
          <Text style={styles.bold}>{pix?.nome}</Text>
          <Text style={styles.label}>Chave Pix</Text>
          <Text style={styles.bold}>{pix?.chave}</Text>
          <Text style={styles.label}>Banco</Text>
          <Text style={styles.bold}>{pix?.banco}</Text>
        </View>
      )}
      {!waiting ? (
        <>
          <Pressable style={styles.btn} onPress={() => void copyKey()}>
            <Text style={styles.btnText}>📋 Copiar chave Pix</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => setWaiting(true)}>
            <Text style={styles.btnTextPrimary}>✅ Já fiz o pagamento</Text>
          </Pressable>
        </>
      ) : null}
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>Voltar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  valor: { fontSize: 32, fontWeight: "800", color: colors.dark },
  produto: { color: colors.soft, marginBottom: 20 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
  },
  label: { fontSize: 11, color: colors.soft, marginTop: 8 },
  bold: { fontWeight: "800", color: colors.dark },
  btn: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  btnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  btnText: { fontWeight: "700", color: colors.dark },
  btnTextPrimary: { fontWeight: "800", color: "#fff" },
  wait: { color: colors.mid, lineHeight: 22, marginBottom: 20 },
  back: { textAlign: "center", marginTop: 16, color: colors.primary, fontWeight: "700" },
});
