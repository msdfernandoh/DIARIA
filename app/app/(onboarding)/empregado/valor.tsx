import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { EMPREGADO_ACCENT } from "../../../src/constants/empregado";
import { useEmpregadoOnboarding } from "../../../src/context/EmpregadoOnboardingContext";
import { colors } from "../../../src/constants/theme";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function roundStep(n: number) {
  return Math.round(n / 10) * 10;
}

function MoneyRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  function setFromText(t: string) {
    const digits = t.replace(/\D/g, "");
    if (!digits) return;
    onChange(clamp(roundStep(Number(digits)), min, max));
  }

  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(clamp(value - 10, min, max))}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <TextInput
          style={styles.moneyInput}
          keyboardType="number-pad"
          value={String(value)}
          onChangeText={setFromText}
        />
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(clamp(value + 10, min, max))}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.rangeHint}>
        R${min} – R${max} (passo R$10)
      </Text>
    </View>
  );
}

export default function ValorStep() {
  const { draft, setDraft, setStep } = useEmpregadoOnboarding();

  const minOk = draft.valorMinDia >= 50 && draft.valorMinDia <= 500;
  const maxOk = draft.valorMaxDia >= 100 && draft.valorMaxDia <= 1000;
  const orderOk = draft.valorMaxDia >= draft.valorMinDia;
  const canNext = minOk && maxOk && orderOk;

  return (
    <OnboardingShell
      step={4}
      totalSteps={10}
      accentColor={EMPREGADO_ACCENT}
      title="Qual valor você espera receber?"
      subtitle="Valores por dia de trabalho — você pode ajustar depois no perfil."
      onBack={() => router.back()}
      onNext={() => {
        if (!canNext) return;
        setStep(5);
        router.push("/(onboarding)/empregado/disponibilidade");
      }}
      nextDisabled={!canNext}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <MoneyRow
          label="Valor mínimo por dia"
          value={draft.valorMinDia}
          min={50}
          max={500}
          onChange={(valorMinDia) =>
            setDraft((d) => ({
              ...d,
              valorMinDia,
              valorMaxDia: Math.max(d.valorMaxDia, valorMinDia),
            }))
          }
        />
        <MoneyRow
          label="Valor máximo por dia"
          value={draft.valorMaxDia}
          min={100}
          max={1000}
          onChange={(valorMaxDia) =>
            setDraft((d) => ({
              ...d,
              valorMaxDia: Math.max(valorMaxDia, d.valorMinDia),
            }))
          }
        />
        {!orderOk ? (
          <Text style={styles.err}>O máximo deve ser maior ou igual ao mínimo.</Text>
        ) : null}
        <View style={styles.preview}>
          <Text style={styles.previewText}>
            Você quer receber entre{" "}
            <Text style={styles.previewBold}>
              R${draft.valorMinDia} e R${draft.valorMaxDia}
            </Text>{" "}
            por dia
          </Text>
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 20 },
  blockLabel: { fontSize: 12, fontWeight: "800", color: colors.soft, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { fontSize: 22, fontWeight: "700", color: colors.mid },
  moneyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.white,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: colors.dark,
  },
  rangeHint: { fontSize: 11, color: colors.soft, marginTop: 6 },
  preview: {
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#E1F5EE",
    borderWidth: 1,
    borderColor: EMPREGADO_ACCENT,
  },
  previewText: { color: colors.mid, lineHeight: 22, textAlign: "center" },
  previewBold: { fontWeight: "800", color: EMPREGADO_ACCENT },
  err: { color: "#DC2626", marginBottom: 8, fontSize: 13 },
});
