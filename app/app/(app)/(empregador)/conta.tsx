import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../src/constants/theme";

export default function EmpregadorContaScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Conta</Text>
      <Text style={styles.sub}>Dados do contratante e configurações.</Text>
      <Pressable style={styles.btn} onPress={() => router.push("/(app)/(empregador)/qr-scanner")}>
        <Text style={styles.btnText}>📷 Confirmar resgate (QR do cliente)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark, marginBottom: 8 },
  sub: { color: colors.soft, marginBottom: 20 },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
