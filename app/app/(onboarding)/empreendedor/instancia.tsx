import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { CORES_INSTANCIA, EMPREENDEDOR_ONBOARDING_STEPS } from "../../../src/constants/empreendedor";
import { useEmpreendedorOnboarding } from "../../../src/context/EmpreendedorOnboardingContext";
import { colors } from "../../../src/constants/theme";

const ACCENT = colors.amber;

export default function InstanciaStep() {
  const { draft, setDraft } = useEmpreendedorOnboarding();

  async function pickLogo() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setDraft((d) => ({ ...d, logoUri: res.assets[0].uri }));
    }
  }

  function next() {
    if (!draft.nomeInstancia.trim()) return;
    router.push("/(onboarding)/empreendedor/pix");
  }

  return (
    <OnboardingShell
      step={2}
      totalSteps={EMPREENDEDOR_ONBOARDING_STEPS}
      accentColor={ACCENT}
      title="Dê um nome para sua instância"
      subtitle="É como sua Diária aparece para profissionais e empresas."
      onBack={() => router.back()}
      onNext={next}
      nextDisabled={!draft.nomeInstancia.trim()}
    >
      <ScrollView>
        <Text style={styles.label}>Nome da instância *</Text>
        <TextInput
          style={styles.input}
          maxLength={40}
          value={draft.nomeInstancia}
          onChangeText={(nomeInstancia) => setDraft((d) => ({ ...d, nomeInstancia }))}
          placeholder="Ex: Diária Sinop"
        />
        <Text style={styles.label}>Cor principal</Text>
        <View style={styles.colors}>
          {CORES_INSTANCIA.map((c) => (
            <Pressable
              key={c}
              onPress={() => setDraft((d) => ({ ...d, corPrincipal: c }))}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                draft.corPrincipal === c && styles.colorDotOn,
              ]}
            />
          ))}
        </View>
        <Pressable onPress={pickLogo} style={styles.logoBtn}>
          <Text style={styles.logoBtnText}>{draft.logoUri ? "Trocar logo" : "Adicionar logo (opcional)"}</Text>
        </Pressable>
        <View style={[styles.preview, { borderColor: draft.corPrincipal }]}>
          <Text style={[styles.previewTitle, { color: draft.corPrincipal }]}>
            {draft.logoUri ? "🖼️" : "📅"} {draft.nomeInstancia || "Sua instância"}
          </Text>
          <Text style={styles.previewSub}>Preview do header do app</Text>
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "700", color: colors.soft, marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, backgroundColor: colors.white },
  colors: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 8 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotOn: { borderWidth: 2, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4 },
  logoBtn: { marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: "center" },
  logoBtnText: { fontWeight: "700", color: colors.amber },
  preview: { marginTop: 16, padding: 16, borderRadius: 14, borderWidth: 2, backgroundColor: colors.white },
  previewTitle: { fontSize: 18, fontWeight: "800" },
  previewSub: { fontSize: 12, color: colors.soft, marginTop: 4 },
});
