import { router } from "expo-router";
import { StyleSheet, Switch, Text, View } from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { EMPREENDEDOR_ONBOARDING_STEPS } from "../../../src/constants/empreendedor";
import { useEmpreendedorOnboarding } from "../../../src/context/EmpreendedorOnboardingContext";
import { colors } from "../../../src/constants/theme";

const ACCENT = colors.amber;

export default function TermosStep() {
  const { draft, setDraft } = useEmpreendedorOnboarding();

  return (
    <OnboardingShell
      step={4}
      totalSteps={EMPREENDEDOR_ONBOARDING_STEPS}
      accentColor={ACCENT}
      title="Termos e contrato"
      subtitle="Obrigatório para empreendedores."
      onBack={() => router.back()}
      onNext={() => router.push("/(onboarding)/empreendedor/metas")}
      nextDisabled={!draft.termosOk || !draft.parceiroOk}
    >
      <Row
        label="Li e aceito os Termos de Uso"
        value={draft.termosOk}
        onChange={(termosOk) => setDraft((d) => ({ ...d, termosOk }))}
      />
      <Row
        label="Li e aceito a Política de Privacidade"
        value={draft.termosOk}
        onChange={(termosOk) => setDraft((d) => ({ ...d, termosOk }))}
      />
      <Row
        label="Li e aceito o Contrato de Parceiro"
        value={draft.parceiroOk}
        onChange={(parceiroOk) => setDraft((d) => ({ ...d, parceiroOk }))}
      />
      <Text style={styles.hint}>Os textos completos serão exibidos em WebView na próxima versão.</Text>
    </OnboardingShell>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.amber }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
  },
  rowLabel: { flex: 1, fontWeight: "600", color: colors.dark, paddingRight: 8 },
  hint: { fontSize: 12, color: colors.soft, marginTop: 8 },
});
