import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../src/constants/theme";

const MOCK = [
  { nome: "João M.", cargo: "Garçom", meta: "contratado em 38 min" },
  { nome: "Buffet Estrela", cargo: "3 garçons", meta: "evento sábado" },
  { nome: "Família Costa", cargo: "Diarista", meta: "toda sexta 🔄" },
  { nome: "Construtora", cargo: "2 chapas", meta: "segunda 8h" },
  { nome: "Restaurante", cargo: "Churrasqueiro", meta: "evento R$280" },
];

export default function ContratarPreviewScreen() {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value }) => setCount(Math.round(value)));
    Animated.timing(anim, { toValue: 47, duration: 2000, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [anim]);

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom }}>
        <Text style={styles.counter}>🔥 {count} profissionais contratados esta semana</Text>
        {MOCK.map((row) => (
          <View key={row.nome} style={styles.card}>
            <View style={styles.bar} />
            <View style={styles.av}>
              <Text style={styles.avText}>{row.nome.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>✅ {row.nome}</Text>
              <Text style={styles.cardMeta}>
                {row.cargo} · {row.meta}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
        <Pressable
          style={styles.footerBtn}
          onPress={() =>
            router.push({ pathname: "/(auth)/register", params: { tipo: "empregador" } })
          }
        >
          <Text style={styles.footerBtnText}>Publicar minha vaga — grátis →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  counter: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  bar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.green,
  },
  av: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5EF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  avText: { fontWeight: "800", color: colors.green, fontSize: 12 },
  cardTitle: { fontWeight: "800", color: colors.dark },
  cardMeta: { fontSize: 12, color: colors.soft, marginTop: 4 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  footerBtnText: { color: "#fff", fontWeight: "800" },
});
