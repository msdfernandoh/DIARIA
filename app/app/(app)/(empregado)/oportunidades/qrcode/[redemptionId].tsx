import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { colors } from "../../../../../src/constants/theme";
import {
  fetchRedemption,
  qrCodeUrl,
  type PhysicalRedemption,
} from "../../../../../src/lib/opportunities";
import { supabase } from "../../../../../src/lib/supabase";

function msRemaining(iso: string) {
  return Math.max(0, new Date(iso).getTime() - Date.now());
}

function formatCountdown(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function RedemptionQrScreen() {
  const { redemptionId } = useLocalSearchParams<{ redemptionId: string }>();
  const [row, setRow] = useState<PhysicalRedemption | null>(null);
  const [loading, setLoading] = useState(true);
  const [left, setLeft] = useState(0);

  const load = useCallback(async () => {
    if (!redemptionId) return;
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    const r = await fetchRedemption(redemptionId, uid);
    setRow(r);
    setLoading(false);
  }, [redemptionId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!row) return;
    const tick = () => setLeft(msRemaining(row.expira_em));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [row]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  if (!row) {
    return (
      <View style={styles.center}>
        <Text>Resgate não encontrado.</Text>
      </View>
    );
  }

  const expired =
    row.status === "expirado" ||
    row.status === "cancelado" ||
    (row.status === "pendente" && left <= 0);

  if (row.status === "confirmado") {
    return (
      <View style={styles.wrap}>
        <Text style={styles.ok}>✅ Resgate confirmado no estabelecimento!</Text>
        <Text style={styles.sub}>{row.titulo}</Text>
      </View>
    );
  }

  if (expired) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.expired}>⏰ QR Code expirado</Text>
        <Text style={styles.sub}>
          Este resgate não é mais válido. Entre em contato com o suporte se precisar de ajuda com
          moedas.
        </Text>
      </View>
    );
  }

  const url = qrCodeUrl(row.qrcode_token);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{row.titulo}</Text>
      <Text style={styles.local}>{row.local_nome ?? "Apresente no local indicado"}</Text>
      <View style={styles.qrBox}>
        <QRCode value={url} size={240} />
      </View>
      <Text style={styles.hint}>Mostre este QR Code no estabelecimento</Text>
      <Text style={styles.timer}>Expira em {formatCountdown(left)}</Text>
      <Text
        style={styles.share}
        onPress={() => void Share.share({ message: `Meu resgate Diária da Cidade: ${url}` })}
      >
        Compartilhar link do QR
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, alignItems: "center", backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", color: colors.dark, textAlign: "center" },
  local: { color: colors.soft, marginTop: 8, marginBottom: 20 },
  qrBox: {
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  hint: { marginTop: 20, color: colors.mid, fontWeight: "600" },
  timer: { marginTop: 12, fontSize: 22, fontWeight: "800", color: colors.green },
  share: { marginTop: 24, color: colors.primary, fontWeight: "700" },
  ok: { fontSize: 20, fontWeight: "800", color: colors.green, textAlign: "center" },
  expired: { fontSize: 20, fontWeight: "800", color: "#DC2626", textAlign: "center" },
  sub: { marginTop: 12, color: colors.soft, textAlign: "center", lineHeight: 22 },
});
