import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";

type Props = {
  title: string;
  body: string;
  onDismiss: () => void;
};

export function InAppNotificationBanner({ title, body, onDismiss }: Props) {
  return (
    <Pressable style={styles.wrap} onPress={onDismiss}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.body} numberOfLines={2}>
        {body}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 48,
    left: 12,
    right: 12,
    zIndex: 999,
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: { color: "#fff", fontWeight: "800", fontSize: 14 },
  body: { color: "rgba(255,255,255,0.85)", marginTop: 4, fontSize: 12 },
});
