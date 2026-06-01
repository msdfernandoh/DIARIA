import { router } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** F2-05 — visitante tentando candidatar ou equivalente. */
export function PreviewCandidaturaSheet({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBg}>
        <Pressable style={styles.sheetDismiss} onPress={onClose} accessibilityLabel="Fechar" />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Crie sua conta grátis para se candidatar</Text>
          <Text style={styles.sheetSub}>2 minutos. Sem cartão. Sem taxa.</Text>
          <Pressable
            style={styles.sheetPrimary}
            onPress={() => {
              onClose();
              router.push("/(auth)/choose-profile");
            }}
          >
            <Text style={styles.sheetPrimaryText}>Criar conta grátis →</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onClose();
              router.push("/(auth)/login");
            }}
          >
            <Text style={styles.sheetLink}>Já tenho conta</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBg: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.4)" },
  sheetDismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.dark },
  sheetSub: { color: colors.soft, marginTop: 8, marginBottom: 16 },
  sheetPrimary: {
    backgroundColor: colors.green,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  sheetPrimaryText: { color: "#fff", fontWeight: "800" },
  sheetLink: { textAlign: "center", marginTop: 14, color: colors.primary, fontWeight: "700" },
});
