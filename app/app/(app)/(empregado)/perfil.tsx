import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../src/constants/theme";
import { supabase } from "../../../src/lib/supabase";

export default function EmpregadoPerfilScreen() {
  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/choose-profile");
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.sub}>Habilidades, experiências e contato.</Text>
      <Pressable onPress={signOut} style={styles.out}>
        <Text style={styles.outText}>Sair</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark },
  sub: { color: colors.soft, marginTop: 8 },
  out: { marginTop: 24 },
  outText: { color: colors.primary, fontWeight: "700" },
});
