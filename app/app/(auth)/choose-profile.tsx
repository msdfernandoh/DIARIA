import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../src/constants/theme";
import { PENDING_REF_KEY } from "../../src/lib/deepLinks";
import type { UserTipo } from "../../src/lib/supabase";

const options: { tipo: UserTipo; title: string; subtitle: string; color: string }[] = [
  {
    tipo: "empregado",
    title: "Quero trabalhar",
    subtitle: "Ver vagas e se candidatar",
    color: colors.green,
  },
  {
    tipo: "empregador",
    title: "Quero contratar",
    subtitle: "Publicar vagas e contratar",
    color: colors.primary,
  },
  {
    tipo: "empreendedor",
    title: "Quero empreender",
    subtitle: "Abrir a Diária da minha cidade",
    color: colors.amber,
  },
];

export default function ChooseProfile() {
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();

  useEffect(() => {
    if (codigo?.trim()) {
      void AsyncStorage.setItem(PENDING_REF_KEY, codigo.trim().toUpperCase());
    }
  }, [codigo]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.head}>Como você quer usar o app?</Text>
      <Text style={styles.sub}>Você pode mudar depois com suporte.</Text>
      {codigo ? (
        <Text style={styles.refBanner}>
          Código de indicação: <Text style={styles.refCode}>{codigo.toUpperCase()}</Text>
        </Text>
      ) : null}
      {options.map((o) => (
        <Pressable
          key={o.tipo}
          style={[styles.card, { borderColor: o.color }]}
          onPress={() =>
            router.push({ pathname: "/(auth)/register", params: { tipo: o.tipo } })
          }
        >
          <Text style={[styles.cardTitle, { color: o.color }]}>{o.title}</Text>
          <Text style={styles.cardSub}>{o.subtitle}</Text>
        </Pressable>
      ))}
      <Pressable onPress={() => router.push("/(public)/vagas-preview")} style={styles.linkWrap}>
        <Text style={styles.link}>Ver vagas disponíveis →</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/(public)/contratar-preview")} style={styles.linkWrap}>
        <Text style={styles.link}>Ver como funciona para empresas →</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/(auth)/login")} style={styles.linkWrap}>
        <Text style={styles.link}>Já tem conta? Entrar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, gap: 12 },
  head: { fontSize: 22, fontWeight: "800", color: colors.dark, marginBottom: 4 },
  sub: { color: colors.soft, marginBottom: 12 },
  refBanner: {
    backgroundColor: "#E8F5EF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    color: colors.mid,
    fontSize: 13,
  },
  refCode: { fontWeight: "800", color: colors.green },
  card: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    backgroundColor: colors.white,
  },
  cardTitle: { fontSize: 17, fontWeight: "800", marginBottom: 4 },
  cardSub: { color: colors.mid, fontSize: 14 },
  linkWrap: { marginTop: 16, alignItems: "center" },
  link: { color: colors.primary, fontWeight: "700" },
});
