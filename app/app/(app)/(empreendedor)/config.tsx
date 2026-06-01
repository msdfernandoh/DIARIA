import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../src/constants/theme";

export default function EmpreendedorConfigScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Configurações</Text>
      <Text style={styles.sub}>Instância, Pix e código de indicação.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark },
  sub: { color: colors.soft, marginTop: 8 },
});
