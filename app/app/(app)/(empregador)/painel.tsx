import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../src/constants/theme";

export default function EmpregadorPainelScreen() {
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast === "published") {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return (
    <View style={styles.wrap}>
      {visible ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Vaga publicada! Aguardando candidatos.</Text>
          <Pressable onPress={() => setVisible(false)}>
            <Text style={styles.toastClose}>✕</Text>
          </Pressable>
        </View>
      ) : null}
      <Text style={styles.title}>Painel do contratante</Text>
      <Text style={styles.sub}>Suas vagas publicadas e candidatos aparecerão aqui em breve.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark, marginBottom: 8 },
  sub: { color: colors.soft, lineHeight: 22 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E8EFFF",
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  toastText: { color: colors.dark, fontWeight: "700", flex: 1 },
  toastClose: { color: colors.soft, paddingLeft: 12, fontSize: 16 },
});
