import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../src/constants/theme";
import { fetchOnboardingStatus } from "../../src/lib/empregadoOnboarding";
import { supabase } from "../../src/lib/supabase";

type Profile = { nome: string; tipo: string; cidade: string | null };

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id;
      if (!id) {
        setChecking(false);
        return;
      }
      try {
        const status = await fetchOnboardingStatus(id);
        if (status?.tipo === "empregado" && status.onboarding_completo !== true) {
          router.replace("/(onboarding)/empregado/dados");
          return;
        }
      } catch {
        /* coluna onboarding pode faltar até migration */
      }
      const { data: row } = await supabase
        .from("users")
        .select("nome, tipo, cidade")
        .eq("id", id)
        .maybeSingle();
      if (row) setProfile(row as Profile);
      setChecking(false);
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/choose-profile");
  }

  if (checking) {
    return (
      <View style={[styles.wrap, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Olá{profile?.nome ? `, ${profile.nome.split(" ")[0]}` : ""}!</Text>
      <Text style={styles.sub}>
        Perfil de empregado configurado. Próximo passo do produto: feed de vagas e candidaturas.
      </Text>
      {profile && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Perfil</Text>
          <Text style={styles.cardValue}>{profile.tipo}</Text>
        </View>
      )}
      <Pressable style={styles.out} onPress={signOut}>
        <Text style={styles.outText}>Sair</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24 },
  h1: { fontSize: 24, fontWeight: "800", color: colors.dark },
  sub: { color: colors.soft, marginTop: 8, lineHeight: 20, marginBottom: 20 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardLabel: { fontSize: 11, fontWeight: "700", color: colors.soft },
  cardValue: { fontSize: 18, fontWeight: "800", color: colors.dark, marginTop: 4 },
  out: { marginTop: 24, alignSelf: "flex-start" },
  outText: { color: colors.primary, fontWeight: "700" },
});
