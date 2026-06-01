import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../../src/constants/theme";

export default function MeuGrupoScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Meu grupo</Text>
      <Text style={styles.sub}>Lista de empregados e empresas vinculados — em breve.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 20, fontWeight: "800", color: colors.dark },
  sub: { color: colors.soft, marginTop: 8 },
});
