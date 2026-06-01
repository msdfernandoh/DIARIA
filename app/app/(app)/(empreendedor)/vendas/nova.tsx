import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../../src/constants/theme";

export default function NovaVendaScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Nova venda</Text>
      <Text style={styles.sub}>Registro manual de vendas — em breve.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 20, fontWeight: "800", color: colors.dark },
  sub: { color: colors.soft, marginTop: 8 },
});
