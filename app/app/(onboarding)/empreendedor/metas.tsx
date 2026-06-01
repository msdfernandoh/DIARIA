import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { EMPREENDEDOR_ONBOARDING_STEPS } from "../../../src/constants/empreendedor";
import { colors } from "../../../src/constants/theme";

const ACCENT = colors.amber;

export default function MetasStep() {
  return (
    <OnboardingShell
      step={5}
      totalSteps={EMPREENDEDOR_ONBOARDING_STEPS}
      accentColor={ACCENT}
      title="Sua meta dos primeiros 30 dias"
      subtitle="Metas iniciais para crescer sua rede."
      onBack={() => router.back()}
      onNext={() => router.push("/(onboarding)/empreendedor/conclusao")}
      nextLabel="Entendi, quero começar!"
    >
      <View style={styles.barWrap}>
        <Text style={styles.barLabel}>Vagas ativas</Text>
        <Text style={styles.barVal}>0 / 10</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: "0%" }]} />
        </View>
      </View>
      <View style={styles.barWrap}>
        <Text style={styles.barLabel}>Pessoas no grupo</Text>
        <Text style={styles.barVal}>0 / 50</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: "0%" }]} />
        </View>
      </View>
      <Text style={styles.bullet}>• Cada empresa que publicar uma vaga no seu grupo = +1 vaga</Text>
      <Text style={styles.bullet}>• Cada profissional ativo = +1 pessoa</Text>
      <Text style={styles.bullet}>• Não bateu em 30 dias? Ganha mais 30 dias automático</Text>
      <Text style={styles.bullet}>• 50 vagas + 300 pessoas: microfranquia vitalícia</Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  barWrap: { marginBottom: 16 },
  barLabel: { fontWeight: "700", color: colors.dark },
  barVal: { color: colors.soft, fontSize: 13, marginBottom: 6 },
  track: { height: 8, backgroundColor: colors.line, borderRadius: 999, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.amber },
  bullet: { color: colors.mid, lineHeight: 22, marginBottom: 4 },
});
