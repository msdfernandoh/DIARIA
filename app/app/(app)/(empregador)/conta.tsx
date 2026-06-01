import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../src/constants/theme";

export default function EmpregadorContaScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Conta</Text>
      <Text style={styles.sub}>Dados do contratante e configurações.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark, marginBottom: 8 },
  sub: { color: colors.soft },
});
