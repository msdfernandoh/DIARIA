import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  accentColor: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  accentColor,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.row}>
            <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, { backgroundColor: accentColor }, loading && styles.disabled]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.dark, marginBottom: 8 },
  message: { color: colors.soft, lineHeight: 22, marginBottom: 20 },
  row: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelText: { fontWeight: "700", color: colors.mid },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  confirmText: { fontWeight: "800", color: "#fff" },
  disabled: { opacity: 0.5 },
});
