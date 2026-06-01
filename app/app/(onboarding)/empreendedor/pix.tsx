import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { EMPREENDEDOR_ONBOARDING_STEPS, PIX_TIPOS } from "../../../src/constants/empreendedor";
import { useEmpreendedorOnboarding } from "../../../src/context/EmpreendedorOnboardingContext";
import { colors } from "../../../src/constants/theme";
import { Pressable } from "react-native";

const ACCENT = colors.amber;

export default function PixStep() {
  const { draft, setDraft } = useEmpreendedorOnboarding();

  function next() {
    if (!draft.pixChave.trim() || !draft.pixNomeConta.trim()) return;
    router.push("/(onboarding)/empreendedor/termos");
  }

  return (
    <OnboardingShell
      step={3}
      totalSteps={EMPREENDEDOR_ONBOARDING_STEPS}
      accentColor={ACCENT}
      title="Onde receber o dinheiro?"
      subtitle="O cliente paga direto aqui. Sem intermediário."
      onBack={() => router.back()}
      onNext={next}
      nextDisabled={!draft.pixChave.trim() || !draft.pixNomeConta.trim()}
    >
      <ScrollView>
        <Text style={styles.label}>Tipo de chave</Text>
        <View style={styles.row}>
          {PIX_TIPOS.map((p) => (
            <Pressable key={p.id} onPress={() => setDraft((d) => ({ ...d, pixTipo: p.id }))} style={[styles.chip, draft.pixTipo === p.id && styles.chipOn]}>
              <Text style={[styles.chipText, draft.pixTipo === p.id && styles.chipTextOn]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Chave Pix *</Text>
        <TextInput style={styles.input} value={draft.pixChave} onChangeText={(pixChave) => setDraft((d) => ({ ...d, pixChave }))} />
        <Text style={styles.label}>Banco / fintech</Text>
        <TextInput style={styles.input} value={draft.pixBanco} onChangeText={(pixBanco) => setDraft((d) => ({ ...d, pixBanco }))} />
        <Text style={styles.label}>Nome que aparece no Pix *</Text>
        <TextInput style={styles.input} value={draft.pixNomeConta} onChangeText={(pixNomeConta) => setDraft((d) => ({ ...d, pixNomeConta }))} />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pagar para: {draft.pixNomeConta || "—"}</Text>
          <Text style={styles.cardLine}>Chave: {draft.pixChave || "—"}</Text>
          <Text style={styles.cardLine}>Banco: {draft.pixBanco || "—"}</Text>
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "700", color: colors.soft, marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, backgroundColor: colors.white },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.line },
  chipOn: { borderColor: colors.amber, backgroundColor: "rgba(217,119,6,0.12)" },
  chipText: { fontSize: 11, fontWeight: "700", color: colors.mid },
  chipTextOn: { color: colors.amber },
  card: { marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  cardTitle: { fontWeight: "800", color: colors.dark, marginBottom: 6 },
  cardLine: { fontSize: 13, color: colors.soft },
});
