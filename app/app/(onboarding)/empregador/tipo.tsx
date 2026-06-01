import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import {
  EMPREGADOR_ONBOARDING_STEPS,
  SEGMENTOS,
  TIPO_CONTRATANTE_OPTIONS,
  type Segmento,
  type TipoContratante,
} from "../../../src/constants/empregador";
import { useEmpregadorOnboarding } from "../../../src/context/EmpregadorOnboardingContext";
import { formatCnpj, isValidCnpj } from "../../../src/lib/cnpj";
import { colors } from "../../../src/constants/theme";

const ACCENT = colors.primary;

export default function TipoStep() {
  const { draft, setDraft, setStep } = useEmpregadorOnboarding();
  const [error, setError] = useState("");

  function selectTipo(tipoContratante: TipoContratante) {
    setDraft((d) => ({ ...d, tipoContratante }));
    setError("");
  }

  function next() {
    if (!draft.tipoContratante) {
      setError("Escolha como você vai contratar.");
      return;
    }
    if (draft.tipoContratante === "empresa") {
      if (!draft.razaoSocial.trim()) {
        setError("Informe a razão social.");
        return;
      }
      if (!isValidCnpj(draft.cnpj)) {
        setError("CNPJ inválido.");
        return;
      }
      if (!draft.segmento) {
        setError("Escolha o segmento da empresa.");
        return;
      }
    }
    setStep(3);
    router.push("/(onboarding)/empregador/codigo");
  }

  return (
    <OnboardingShell
      step={2}
      totalSteps={EMPREGADOR_ONBOARDING_STEPS}
      accentColor={ACCENT}
      title="Como você vai contratar?"
      subtitle="Isso ajuda a personalizar sua conta e publicações."
      onBack={() => router.back()}
      onNext={next}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 10 }}>
        {TIPO_CONTRATANTE_OPTIONS.map((opt) => {
          const selected = draft.tipoContratante === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => selectTipo(opt.id)}
              style={[styles.radio, selected && styles.radioOn]}
            >
              <View style={[styles.dot, selected && styles.dotOn]}>
                {selected ? <View style={styles.dotInner} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.radioTitle}>
                  {opt.emoji} {opt.title}
                </Text>
                <Text style={styles.radioSub}>{opt.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}

        {draft.tipoContratante === "empresa" ? (
          <View style={styles.extra}>
            <Text style={styles.label}>Razão social *</Text>
            <TextInput
              style={styles.input}
              value={draft.razaoSocial}
              onChangeText={(razaoSocial) => setDraft((d) => ({ ...d, razaoSocial }))}
            />
            <Text style={styles.label}>CNPJ *</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={draft.cnpj}
              onChangeText={(t) => setDraft((d) => ({ ...d, cnpj: formatCnpj(t) }))}
              placeholder="00.000.000/0000-00"
            />
            <Text style={styles.label}>Nome fantasia</Text>
            <TextInput
              style={styles.input}
              value={draft.nomeFantasia}
              onChangeText={(nomeFantasia) => setDraft((d) => ({ ...d, nomeFantasia }))}
            />
            <Text style={styles.label}>Segmento *</Text>
            <View style={styles.segWrap}>
              {SEGMENTOS.map((seg) => {
                const on = draft.segmento === seg;
                return (
                  <Pressable
                    key={seg}
                    onPress={() => setDraft((d) => ({ ...d, segmento: seg as Segmento }))}
                    style={[styles.segChip, on && styles.segChipOn]}
                  >
                    <Text style={[styles.segText, on && styles.segTextOn]}>{seg}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {error ? <Text style={styles.err}>{error}</Text> : null}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  radio: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  radioOn: { borderColor: ACCENT, backgroundColor: "rgba(21,87,255,0.06)" },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  dotOn: { borderColor: ACCENT },
  dotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT },
  radioTitle: { fontWeight: "800", color: colors.dark, marginBottom: 4 },
  radioSub: { fontSize: 13, color: colors.soft, lineHeight: 18 },
  extra: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 4,
  },
  label: { fontSize: 12, fontWeight: "700", color: colors.soft, marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.bg,
  },
  segWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  segChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  segChipOn: { borderColor: ACCENT, backgroundColor: "rgba(21,87,255,0.12)" },
  segText: { fontSize: 12, fontWeight: "700", color: colors.mid },
  segTextOn: { color: ACCENT },
  err: { color: "#DC2626", fontSize: 13, marginTop: 8 },
});
