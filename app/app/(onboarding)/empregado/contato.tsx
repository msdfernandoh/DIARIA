import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { useEmpregadoOnboarding } from "../../../src/context/EmpregadoOnboardingContext";
import {
  completeEmpregadoOnboarding,
} from "../../../src/lib/empregadoOnboarding";
import { resolveAppRoute } from "../../../src/lib/authRouting";
import { supabase } from "../../../src/lib/supabase";
import { EMPREGADO_ACCENT } from "../../../src/constants/empregado";
import { colors } from "../../../src/constants/theme";

export default function ContatoStep() {
  const { draft, setDraft } = useEmpregadoOnboarding();
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    try {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id;
      if (!id) throw new Error("Sessão expirada. Entre de novo.");
      await completeEmpregadoOnboarding(id, draft);
      router.replace(await resolveAppRoute(id));
    } catch (e) {
      Alert.alert(
        "Erro ao salvar",
        e instanceof Error ? e.message : "Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingShell
      step={10}
      totalSteps={10}
      accentColor={EMPREGADO_ACCENT}
      title="Contato com contratantes"
      subtitle="Por padrão seu número fica oculto — só no chat se você quiser."
      onBack={() => router.back()}
      onNext={finish}
      nextLabel={saving ? "Salvando…" : "Concluir cadastro"}
      nextDisabled={saving}
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Exibir celular no perfil</Text>
          <Text style={styles.sub}>
            Contratantes poderão ligar ou mandar WhatsApp diretamente.
          </Text>
        </View>
        <Switch
          value={draft.celularVisivel}
          onValueChange={(celularVisivel) =>
            setDraft((d) => ({ ...d, celularVisivel }))
          }
          trackColor={{ true: colors.green }}
        />
      </View>
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
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: { fontWeight: "800", color: colors.dark, marginBottom: 4 },
  sub: { fontSize: 13, color: colors.soft, lineHeight: 18 },
});
