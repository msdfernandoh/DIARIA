import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../src/constants/theme";
import { confirmRedemption, redeemErrorMessage } from "../../../src/lib/opportunities";
import { CONFIG } from "../../../src/constants/config";

function extractToken(data: string): string | null {
  const raw = data.trim();
  if (raw.includes("/qr/")) {
    const part = raw.split("/qr/").pop();
    return part?.split(/[?#]/)[0]?.trim() || null;
  }
  if (raw.startsWith(`${CONFIG.DEEP_SCHEME}://qr/`)) {
    return raw.replace(`${CONFIG.DEEP_SCHEME}://qr/`, "").split(/[?#]/)[0] || null;
  }
  if (raw.length >= 8 && raw.length <= 64) return raw;
  return null;
}

export default function QrScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  async function onBarcode({ data }: { data: string }) {
    if (scanned) return;
    const token = extractToken(data);
    if (!token) {
      Alert.alert("QR Code", "Não foi possível ler o código. Tente novamente.");
      return;
    }
    setScanned(true);
    try {
      await confirmRedemption(token);
      Alert.alert("Sucesso", "✅ Resgate confirmado!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      Alert.alert("Confirmação", redeemErrorMessage(code), [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Carregando câmera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Precisamos da câmera para ler o QR do cliente.</Text>
        <Pressable style={styles.btn} onPress={() => void requestPermission()}>
          <Text style={styles.btnText}>Permitir câmera</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(app)/oportunidades/qrcode/confirmar")}>
          <Text style={styles.link}>Inserir código manualmente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : onBarcode}
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>Aponte para o QR do cliente</Text>
        <Pressable style={styles.manual} onPress={() => router.push("/(app)/oportunidades/qrcode/confirmar")}>
          <Text style={styles.manualText}>Digitar token manualmente</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  msg: { textAlign: "center", color: colors.mid, marginBottom: 16 },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
  link: { marginTop: 16, textAlign: "center", color: colors.primary },
  overlay: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: { color: "#fff", fontWeight: "800", fontSize: 16, textAlign: "center" },
  manual: { marginTop: 16 },
  manualText: { color: "#93C5FD", fontWeight: "700" },
});
