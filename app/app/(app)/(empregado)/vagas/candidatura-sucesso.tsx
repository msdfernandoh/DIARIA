import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../../src/constants/theme";

export default function CandidaturaSucessoScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string; jobId?: string }>();
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  }, [scale]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.check, { transform: [{ scale }] }]}>
        <Text style={styles.checkIcon}>✓</Text>
      </Animated.View>
      <Text style={styles.title}>Candidatura enviada!</Text>
      <Text style={styles.sub}>O contratante vai receber seu perfil.</Text>
      <Pressable
        style={styles.btnMain}
        onPress={() =>
          applicationId &&
          router.replace({
            pathname: "/(app)/(empregado)/chat/[applicationId]",
            params: { applicationId },
          })
        }
      >
        <Text style={styles.btnMainText}>Ir para o chat →</Text>
      </Pressable>
      <Pressable style={styles.btnSec} onPress={() => router.replace("/(app)/(empregado)/vagas")}>
        <Text style={styles.btnSecText}>Continuar vendo vagas</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  check: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  checkIcon: { color: "#fff", fontSize: 40, fontWeight: "800" },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark, textAlign: "center" },
  sub: { color: colors.soft, marginTop: 10, textAlign: "center", lineHeight: 22 },
  btnMain: {
    marginTop: 28,
    width: "100%",
    backgroundColor: colors.green,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnMainText: { color: "#fff", fontWeight: "800" },
  btnSec: { marginTop: 14, paddingVertical: 12 },
  btnSecText: { color: colors.primary, fontWeight: "700" },
});
