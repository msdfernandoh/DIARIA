import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../src/constants/theme";
import { GUEST_ENTRY_ROUTE } from "../src/constants/config";
import { resolveAppRoute, type AppRoute } from "../src/lib/authRouting";
import { supabase, supabaseConfigured } from "../src/lib/supabase";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user?.id) {
        setTarget(GUEST_ENTRY_ROUTE);
      } else {
        setTarget(await resolveAppRoute(data.session.user.id));
      }
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!supabaseConfigured) {
    return (
      <View style={styles.center}>
        <Text style={styles.logo}>📅</Text>
        <Text style={styles.title}>Diária da Cidade</Text>
        <Text style={styles.hint}>
          Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env
        </Text>
      </View>
    );
  }

  if (target) return <Redirect href={target as AppRoute} />;
  return <Redirect href={GUEST_ENTRY_ROUTE} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: colors.dark,
  },
  logo: { fontSize: 48, marginBottom: 12 },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  hint: { color: "rgba(255,255,255,.65)", textAlign: "center", lineHeight: 20 },
});
