import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { ChipSelect } from "../../../src/components/ChipSelect";
import {
  RAIO_OPTIONS,
  TURNOS,
} from "../../../src/constants/empregado";
import { useEmpregadoOnboarding } from "../../../src/context/EmpregadoOnboardingContext";
import { colors } from "../../../src/constants/theme";

export default function DisponibilidadeStep() {
  const { draft, setDraft, setStep } = useEmpregadoOnboarding();

  const marked = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(draft.markedDates).map(([k, v]) => [
          k,
          { ...v, selectedColor: colors.green, selected: true },
        ])
      ),
    [draft.markedDates]
  );

  function onDayPress(day: DateData) {
    setDraft((d) => {
      const next = { ...d.markedDates };
      if (next[day.dateString]) delete next[day.dateString];
      else next[day.dateString] = { selected: true, selectedColor: colors.green };
      return { ...d, markedDates: next };
    });
  }

  const hasDates = Object.keys(draft.markedDates).length > 0;

  return (
    <OnboardingShell
      step={4}
      title="Quando você pode trabalhar?"
      subtitle="Toque nos dias em que você está disponível."
      onBack={() => router.back()}
      onNext={() => {
        if (!hasDates || draft.turnos.length === 0) return;
        setStep(5);
        router.push("/(onboarding)/empregado/codigo");
      }}
      nextDisabled={!hasDates || draft.turnos.length === 0}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Calendar
          onDayPress={onDayPress}
          markedDates={marked}
          theme={{
            selectedDayBackgroundColor: colors.green,
            todayTextColor: colors.primary,
            arrowColor: colors.green,
          }}
          style={styles.cal}
        />
        <Text style={styles.section}>Turnos</Text>
        <ChipSelect
          items={TURNOS}
          selected={draft.turnos}
          onChange={(turnos) => setDraft((d) => ({ ...d, turnos }))}
        />
        <Text style={styles.section}>Raio de deslocamento</Text>
        <View style={styles.rowWrap}>
          {RAIO_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => setDraft((d) => ({ ...d, raioKm: o.value }))}
              style={[
                styles.pill,
                draft.raioKm === o.value && styles.pillOn,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  draft.raioKm === o.value && styles.pillTextOn,
                ]}
              >
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.section}>Tipo de disponibilidade</Text>
        <Pressable
          style={[styles.radio, draft.recorrente && styles.radioOn]}
          onPress={() => setDraft((d) => ({ ...d, recorrente: true }))}
        >
          <Text style={styles.radioText}>Recorrente (toda semana nos dias marcados)</Text>
        </Pressable>
        <Pressable
          style={[styles.radio, !draft.recorrente && styles.radioOn]}
          onPress={() => setDraft((d) => ({ ...d, recorrente: false }))}
        >
          <Text style={styles.radioText}>Este mês apenas (datas específicas)</Text>
        </Pressable>
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  cal: { borderRadius: 14, overflow: "hidden", marginBottom: 12 },
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  pillOn: { borderColor: colors.green, backgroundColor: "#E1F5EE" },
  pillText: { fontWeight: "600", color: colors.mid },
  pillTextOn: { color: colors.green, fontWeight: "800" },
  radio: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.white,
  },
  radioOn: { borderColor: colors.green, backgroundColor: "#E1F5EE" },
  radioText: { color: colors.dark, fontWeight: "600" },
});
