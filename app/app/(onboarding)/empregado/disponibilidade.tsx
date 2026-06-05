import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { ChipSelect } from "../../../src/components/ChipSelect";
import { EMPREGADO_ACCENT, TURNOS, WEEKDAYS } from "../../../src/constants/empregado";
import { useEmpregadoOnboarding } from "../../../src/context/EmpregadoOnboardingContext";
import { colors } from "../../../src/constants/theme";

export default function DisponibilidadeStep() {
  const { draft, setDraft, setStep } = useEmpregadoOnboarding();

  const diasOk =
    draft.disponivelQualquerDia || draft.diasSemana.length > 0;
  const turnosOk = draft.turnos.length > 0;
  const canNext = diasOk && turnosOk;

  function toggleDia(id: number) {
    if (draft.disponivelQualquerDia) return;
    setDraft((d) => {
      const has = d.diasSemana.includes(id);
      const diasSemana = has
        ? d.diasSemana.filter((x) => x !== id)
        : [...d.diasSemana, id];
      return { ...d, diasSemana };
    });
  }

  function onTurnosChange(turnos: string[]) {
    if (turnos.includes("qualquer")) {
      setDraft((d) => ({ ...d, turnos: ["qualquer"] }));
      return;
    }
    setDraft((d) => ({ ...d, turnos }));
  }

  return (
    <OnboardingShell
      step={5}
      totalSteps={10}
      accentColor={EMPREGADO_ACCENT}
      title="Quando você está disponível?"
      subtitle="Dias da semana e períodos do dia em que você costuma aceitar diárias."
      onBack={() => router.back()}
      onNext={() => {
        if (!canNext) return;
        setStep(6);
        router.push("/(onboarding)/empregado/carga-horaria");
      }}
      nextDisabled={!canNext}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Disponível qualquer dia</Text>
            <Text style={styles.toggleSub}>(combinar na hora)</Text>
          </View>
          <Switch
            value={draft.disponivelQualquerDia}
            onValueChange={(disponivelQualquerDia) =>
              setDraft((d) => ({ ...d, disponivelQualquerDia }))
            }
            trackColor={{ true: EMPREGADO_ACCENT }}
          />
        </View>

        <Text style={styles.section}>Dias da semana</Text>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((d) => {
            const on =
              draft.disponivelQualquerDia || draft.diasSemana.includes(d.id);
            const muted = draft.disponivelQualquerDia;
            return (
              <Pressable
                key={d.id}
                disabled={draft.disponivelQualquerDia}
                onPress={() => toggleDia(d.id)}
                style={[
                  styles.dayChip,
                  on && styles.dayChipOn,
                  muted && styles.dayChipMuted,
                ]}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    on && styles.dayChipTextOn,
                  ]}
                >
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>Período do dia</Text>
        <ChipSelect
          items={TURNOS}
          selected={draft.turnos}
          onChange={onTurnosChange}
          accentColor={EMPREGADO_ACCENT}
        />
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  toggleTitle: { fontWeight: "800", color: colors.dark },
  toggleSub: { fontSize: 13, color: colors.soft, marginTop: 2 },
  section: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.soft,
    marginTop: 14,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  weekRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip: {
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  dayChipOn: {
    borderColor: EMPREGADO_ACCENT,
    backgroundColor: "#E1F5EE",
  },
  dayChipMuted: { opacity: 0.55 },
  dayChipText: { fontWeight: "700", color: colors.mid, fontSize: 13 },
  dayChipTextOn: { color: EMPREGADO_ACCENT },
});
