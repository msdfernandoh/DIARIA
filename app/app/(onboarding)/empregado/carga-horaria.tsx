import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ChipSelect } from "../../../src/components/ChipSelect";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import {
  EMPREGADO_ACCENT,
  HORAS_DIA_OPTIONS,
  HORAS_SEMANA_OPTIONS,
  TIPO_JORNADA,
} from "../../../src/constants/empregado";
import { useEmpregadoOnboarding } from "../../../src/context/EmpregadoOnboardingContext";
import { colors } from "../../../src/constants/theme";

function OptionRow<T extends { label: string; value: number }>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: readonly T[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.section}>{title}</Text>
      <View style={styles.rowWrap}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.pill, value === o.value && styles.pillOn]}
          >
            <Text style={[styles.pillText, value === o.value && styles.pillTextOn]}>
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function CargaHorariaStep() {
  const { draft, setDraft, setStep } = useEmpregadoOnboarding();

  const canNext = draft.tipoJornada.length > 0;

  return (
    <OnboardingShell
      step={6}
      totalSteps={10}
      accentColor={EMPREGADO_ACCENT}
      title="Quanto você pode trabalhar?"
      subtitle="Ajuda a combinar diárias com sua rotina."
      onBack={() => router.back()}
      onNext={() => {
        if (!canNext) return;
        setStep(7);
        router.push("/(onboarding)/empregado/transporte");
      }}
      nextDisabled={!canNext}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <OptionRow
          title="Horas por dia"
          options={HORAS_DIA_OPTIONS}
          value={draft.horasPorDia}
          onChange={(horasPorDia) => setDraft((d) => ({ ...d, horasPorDia }))}
        />
        <OptionRow
          title="Horas por semana"
          options={HORAS_SEMANA_OPTIONS}
          value={draft.horasPorSemana}
          onChange={(horasPorSemana) => setDraft((d) => ({ ...d, horasPorSemana }))}
        />
        <Text style={styles.section}>Tipo de jornada preferida</Text>
        <ChipSelect
          items={TIPO_JORNADA}
          selected={draft.tipoJornada}
          onChange={(tipoJornada) => {
            if (tipoJornada.length === 0) return;
            setDraft((d) => ({ ...d, tipoJornada }));
          }}
          accentColor={EMPREGADO_ACCENT}
        />
        <Text style={styles.hint}>Selecione uma ou mais opções.</Text>
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 8 },
  section: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.soft,
    marginTop: 14,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  pillOn: { borderColor: EMPREGADO_ACCENT, backgroundColor: "#E1F5EE" },
  pillText: { fontWeight: "600", color: colors.mid },
  pillTextOn: { color: EMPREGADO_ACCENT, fontWeight: "800" },
  hint: { fontSize: 12, color: colors.soft, marginTop: 8 },
});
