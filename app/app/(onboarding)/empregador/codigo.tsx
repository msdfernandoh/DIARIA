import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { EMPREGADOR_ONBOARDING_STEPS } from "../../../src/constants/empregador";
import { useEmpregadorOnboarding } from "../../../src/context/EmpregadorOnboardingContext";
import {
  completeEmpregadorOnboarding,
  validateEntrepreneurCode,
} from "../../../src/lib/empregadorOnboarding";
import { PENDING_REF_KEY } from "../../../src/lib/deepLinks";
import { supabase } from "../../../src/lib/supabase";
import { colors } from "../../../src/constants/theme";

const ACCENT = colors.primary;

export default function CodigoStep() {
  const { draft, setDraft } = useEmpregadorOnboarding();
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(PENDING_REF_KEY).then((stored) => {
      if (stored && !draft.codigo.trim()) {
        setDraft((d) => ({ ...d, codigo: stored }));
        void AsyncStorage.removeItem(PENDING_REF_KEY);
      }
    });
  }, []);

  useEffect(() => {
    const code = draft.codigo.trim();
    if (code.length < 4) {
      setDraft((d) => ({
        ...d,
        codigoValido: false,
        codigoEmpreendedorId: null,
        codigoInstancia: null,
      }));
      setMsg(null);
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const row = await validateEntrepreneurCode(code);
        if (row) {
          setDraft((d) => ({
            ...d,
            codigoValido: true,
            codigoEmpreendedorId: row.user_id,
            codigoInstancia: row.nome_instancia,
          }));
          setMsg(
            `Código de ${row.nome_instancia ?? row.codigo} confirmado! 1 vaga em destaque grátis por 7 dias + filtro avançado 30 dias.`
          );
        } else {
          setDraft((d) => ({
            ...d,
            codigoValido: false,
            codigoEmpreendedorId: null,
            codigoInstancia: null,
          }));
          setMsg("Código não encontrado. Você pode continuar sem ele.");
        }
      } catch {
        setMsg("Erro ao validar. Tente de novo.");
      } finally {
        setChecking(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [draft.codigo, setDraft]);

  async function finish(skipCode?: boolean) {
    setSaving(true);
    try {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id;
      if (!id) throw new Error("Sessão expirada. Entre de novo.");
      const payload = skipCode
        ? {
            ...draft,
            codigo: "",
            codigoValido: false,
            codigoEmpreendedorId: null,
            codigoInstancia: null,
          }
        : draft;
      await completeEmpregadorOnboarding(id, payload);
      router.replace("/(app)/(empregador)/publicar");
    } catch (e) {
      Alert.alert("Erro ao salvar", e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingShell
      step={3}
      totalSteps={EMPREGADOR_ONBOARDING_STEPS}
      accentColor={ACCENT}
      title="Tem um código de indicação?"
      subtitle="Opcional — parceiros da cidade podem liberar benefícios na publicação."
      onBack={() => router.back()}
      onNext={() => finish(false)}
      nextLabel={saving ? "Salvando…" : "Publicar minha primeira vaga →"}
      nextDisabled={saving || checking}
      secondaryAction={{
        label: "Continuar sem código",
        onPress: () => finish(true),
      }}
    >
      <Text style={styles.label}>Código</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="characters"
        maxLength={10}
        value={draft.codigo}
        onChangeText={(codigo) =>
          setDraft((d) => ({ ...d, codigo: codigo.toUpperCase().replace(/\s/g, "") }))
        }
        placeholder="EX: JOAO2025"
      />
      {checking ? <ActivityIndicator color={ACCENT} style={{ marginTop: 8 }} /> : null}
      {msg ? (
        <Text style={[styles.msg, draft.codigoValido ? styles.ok : styles.warn]}>
          {draft.codigoValido ? "✅ " : ""}
          {msg}
        </Text>
      ) : null}
      {draft.codigoValido ? (
        <View style={styles.bonus}>
          <Text style={styles.bonusTitle}>Bônus ativado</Text>
          <Text style={styles.bonusText}>
            1 vaga em destaque grátis por 7 dias + filtro avançado por 30 dias.
          </Text>
        </View>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "700", color: colors.soft, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.white,
    fontWeight: "800",
    letterSpacing: 1,
  },
  msg: { marginTop: 10, fontSize: 14, lineHeight: 20 },
  ok: { color: ACCENT, fontWeight: "700" },
  warn: { color: colors.soft },
  bonus: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(21,87,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(21,87,255,0.25)",
  },
  bonusTitle: { fontWeight: "800", color: ACCENT, marginBottom: 4 },
  bonusText: { fontSize: 13, color: colors.mid, lineHeight: 18 },
});
