import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../../../../src/constants/theme";
import {
  confirmRedemption,
  fetchRedemptionByToken,
  redeemErrorMessage,
} from "../../../../src/lib/opportunities";
import { supabase } from "../../../../src/lib/supabase";

/** Deep link https://diariadacidade.app.br/qr/:token — confirmação pelo estabelecimento */
export default function QrcodeConfirmarDeepLinkScreen() {
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(tokenParam ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onConfirm() {
    const t = token.trim();
    if (t.length < 8) {
      Alert.alert("Token", "Informe o código do QR ou abra o link completo.");
      return;
    }
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        Alert.alert("Login", "Entre como contratante ou parceiro para confirmar.", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") },
        ]);
        return;
      }
      const preview = await fetchRedemptionByToken(t);
      if (!preview) {
        Alert.alert("QR Code", redeemErrorMessage("token_invalido"));
        return;
      }
      await confirmRedemption(t);
      setDone(true);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      Alert.alert("Confirmação", redeemErrorMessage(code));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.ok}>✅ Resgate confirmado!</Text>
        <Text style={styles.sub}>O cliente pode fechar esta tela.</Text>
        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Confirmar resgate</Text>
      <Text style={styles.sub}>
        Cole o token do QR ou abra o link enviado pelo cliente. Apenas o estabelecimento parceiro
        pode confirmar.
      </Text>
      <TextInput
        style={styles.input}
        value={token}
        onChangeText={setToken}
        placeholder="Token do QR Code"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable style={styles.btn} onPress={() => void onConfirm()} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Confirmar resgate</Text>
        )}
      </Pressable>
      <Pressable onPress={() => router.push("/(app)/(empregador)/qr-scanner")}>
        <Text style={styles.link}>Abrir leitor de QR no app</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark },
  sub: { color: colors.soft, marginTop: 8, marginBottom: 20, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
  link: { marginTop: 20, textAlign: "center", color: colors.primary, fontWeight: "700" },
  ok: { fontSize: 24, fontWeight: "800", color: colors.green, textAlign: "center" },
});
