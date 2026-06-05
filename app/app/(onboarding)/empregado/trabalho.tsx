import { router } from "expo-router";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { useEmpregadoOnboarding } from "../../../src/context/EmpregadoOnboardingContext";
import { EMPREGADO_ACCENT } from "../../../src/constants/empregado";
import { colors } from "../../../src/constants/theme";

function Row({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.green }}
      />
    </View>
  );
}

export default function TrabalhoStep() {
  const { draft, setDraft, setStep } = useEmpregadoOnboarding();

  function bothOn() {
    setDraft((d) => ({ ...d, trabalhaPresencial: true, trabalhaRemoto: true }));
  }

  return (
    <OnboardingShell
      step={2}
      totalSteps={10}
      accentColor={EMPREGADO_ACCENT}
      title="Que tipo de trabalho você busca?"
      subtitle="Você pode ativar os dois. Padrão: presencial e remoto."
      onBack={() => router.back()}
      onNext={() => {
        if (!draft.trabalhaPresencial && !draft.trabalhaRemoto) return;
        setStep(3);
        router.push("/(onboarding)/empregado/habilidades");
      }}
      nextDisabled={!draft.trabalhaPresencial && !draft.trabalhaRemoto}
    >
      <Row
        label="Trabalho presencial / local"
        sub="Diárias na sua região"
        value={draft.trabalhaPresencial}
        onChange={(v) => setDraft((d) => ({ ...d, trabalhaPresencial: v }))}
      />
      <Row
        label="Home office / remoto"
        sub="Vagas online de qualquer lugar"
        value={draft.trabalhaRemoto}
        onChange={(v) => setDraft((d) => ({ ...d, trabalhaRemoto: v }))}
      />
      <Pressable onPress={bothOn} style={styles.bothWrap}>
        <Text style={styles.both}>Ativar ambos</Text>
      </Pressable>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowTitle: { fontWeight: "800", color: colors.dark, marginBottom: 2 },
  rowSub: { fontSize: 13, color: colors.soft },
  bothWrap: { marginTop: 8, alignItems: "center" },
  both: { color: colors.primary, fontWeight: "700" },
});
