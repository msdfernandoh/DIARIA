import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { EMPREGADO_ACCENT, RAIO_OPTIONS, TRANSPORTE_OPTIONS } from "../../../src/constants/empregado";
import { useEmpregadoOnboarding } from "../../../src/context/EmpregadoOnboardingContext";
import { colors } from "../../../src/constants/theme";

function selectedTransportIds(draft: {
  semTransporteProprio: boolean;
  temMoto: boolean;
  temCarro: boolean;
  temVan: boolean;
  temBicicleta: boolean;
}) {
  const ids: string[] = [];
  if (draft.semTransporteProprio) ids.push("sem");
  if (draft.temMoto) ids.push("moto");
  if (draft.temCarro) ids.push("carro");
  if (draft.temVan) ids.push("van");
  if (draft.temBicicleta) ids.push("bicicleta");
  return ids;
}

export default function TransporteStep() {
  const { draft, setDraft, setStep } = useEmpregadoOnboarding();

  const selected = selectedTransportIds(draft);
  const temVeiculo =
    draft.temMoto || draft.temCarro || draft.temVan || draft.temBicicleta;
  const canNext = selected.length > 0;

  function toggleTransport(id: string) {
    setDraft((d) => {
      if (id === "sem") {
        const on = !d.semTransporteProprio;
        return {
          ...d,
          semTransporteProprio: on,
          temMoto: false,
          temCarro: false,
          temVan: false,
          temBicicleta: false,
        };
      }
      const key =
        id === "moto"
          ? "temMoto"
          : id === "carro"
            ? "temCarro"
            : id === "van"
              ? "temVan"
              : "temBicicleta";
      const nextVal = !d[key];
      return {
        ...d,
        semTransporteProprio: false,
        [key]: nextVal,
      };
    });
  }

  return (
    <OnboardingShell
      step={7}
      totalSteps={10}
      accentColor={EMPREGADO_ACCENT}
      title="Você tem transporte próprio?"
      subtitle="Contratantes usam isso para vagas presenciais na sua região."
      onBack={() => router.back()}
      onNext={() => {
        if (!canNext) return;
        setStep(8);
        router.push("/(onboarding)/empregado/codigo");
      }}
      nextDisabled={!canNext}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {TRANSPORTE_OPTIONS.map((opt) => {
          const on = selected.includes(opt.id);
          return (
            <Pressable
              key={opt.id}
              onPress={() => toggleTransport(opt.id)}
              style={[styles.card, on && styles.cardOn]}
            >
              <Text style={styles.cardEmoji}>{opt.emoji}</Text>
              <Text style={[styles.cardLabel, on && styles.cardLabelOn]}>{opt.label}</Text>
            </Pressable>
          );
        })}

        {temVeiculo ? (
          <>
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
          </>
        ) : null}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  cardOn: { borderColor: EMPREGADO_ACCENT, backgroundColor: "#E1F5EE" },
  cardEmoji: { fontSize: 24 },
  cardLabel: { flex: 1, fontWeight: "700", color: colors.mid, lineHeight: 20 },
  cardLabelOn: { color: EMPREGADO_ACCENT, fontWeight: "800" },
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
  pillOn: { borderColor: EMPREGADO_ACCENT, backgroundColor: "#E1F5EE" },
  pillText: { fontWeight: "600", color: colors.mid },
  pillTextOn: { color: EMPREGADO_ACCENT, fontWeight: "800" },
});
