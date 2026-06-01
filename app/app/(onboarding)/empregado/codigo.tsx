import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { useEmpregadoOnboarding } from "../../../src/context/EmpregadoOnboardingContext";
import { validateEntrepreneurCode } from "../../../src/lib/empregadoOnboarding";
import { PENDING_REF_KEY } from "../../../src/lib/deepLinks";
import { colors } from "../../../src/constants/theme";

export default function CodigoStep() {
  const { draft, setDraft, setStep } = useEmpregadoOnboarding();
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
            `Código de ${row.nome_instancia ?? row.codigo} confirmado! +100 moedas de bônus (liberadas em 7 dias).`
          );
        } else {
          setDraft((d) => ({
            ...d,
            codigoValido: false,
            codigoEmpreendedorId: null,
            codigoInstancia: null,
          }));
          setMsg("Código não encontrado. Pode continuar sem ele.");
        }
      } catch {
        setMsg("Erro ao validar. Tente de novo.");
      } finally {
        setChecking(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [draft.codigo, setDraft]);

  return (
    <OnboardingShell
      step={5}
      title="Tem um código de indicação?"
      subtitle="Opcional — quem te indicou ganha crédito quando você usar o app."
      onBack={() => router.back()}
      onNext={() => {
        setStep(6);
        router.push("/(onboarding)/empregado/experiencias");
      }}
      secondaryAction={{
        label: "Continuar sem código",
        onPress: () => {
          setDraft((d) => ({
            ...d,
            codigo: "",
            codigoValido: false,
            codigoEmpreendedorId: null,
            codigoInstancia: null,
          }));
          setStep(6);
          router.push("/(onboarding)/empregado/experiencias");
        },
      }}
    >
      <Text style={styles.label}>Código</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="characters"
        value={draft.codigo}
        onChangeText={(codigo) =>
          setDraft((d) => ({ ...d, codigo: codigo.toUpperCase().replace(/\s/g, "") }))
        }
        placeholder="EX: JOAO25"
      />
      {checking ? <ActivityIndicator color={colors.green} style={{ marginTop: 8 }} /> : null}
      {msg ? (
        <Text
          style={[
            styles.msg,
            draft.codigoValido ? styles.ok : styles.warn,
          ]}
        >
          {draft.codigoValido ? "✅ " : ""}
          {msg}
        </Text>
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
  ok: { color: colors.green, fontWeight: "700" },
  warn: { color: colors.soft },
});
