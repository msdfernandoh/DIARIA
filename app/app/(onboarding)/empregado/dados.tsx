import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { useEmpregadoOnboarding } from "../../../src/context/EmpregadoOnboardingContext";
import { buscarCep, formatCep } from "../../../src/lib/viacep";
import { colors } from "../../../src/constants/theme";

export default function DadosStep() {
  const { draft, setDraft, setStep } = useEmpregadoOnboarding();
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");

  async function onCepBlur() {
    const digits = draft.cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingCep(true);
    setCepError("");
    try {
      const r = await buscarCep(digits);
      if (!r) {
        setCepError("CEP não encontrado.");
        return;
      }
      setDraft((d) => ({
        ...d,
        cep: formatCep(digits),
        cidade: r.cidade,
        estado: r.estado,
        bairro: r.bairro,
        endereco: r.logradouro,
      }));
    } finally {
      setLoadingCep(false);
    }
  }

  function next() {
    if (draft.cep.replace(/\D/g, "").length !== 8 || !draft.cidade || !draft.estado) {
      setCepError("Informe um CEP válido para preencher cidade e estado.");
      return;
    }
    setStep(2);
    router.push("/(onboarding)/empregado/trabalho");
  }

  return (
    <OnboardingShell
      step={1}
      title="Onde você mora?"
      subtitle="Usamos seu CEP para mostrar vagas perto de você."
      onNext={next}
      nextDisabled={loadingCep}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>CEP</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={draft.cep}
          onChangeText={(t) => setDraft((d) => ({ ...d, cep: formatCep(t) }))}
          onBlur={onCepBlur}
          placeholder="00000-000"
        />
        {loadingCep ? <ActivityIndicator color={colors.green} style={{ marginVertical: 8 }} /> : null}
        {cepError ? <Text style={styles.err}>{cepError}</Text> : null}
        <Text style={styles.label}>Cidade</Text>
        <TextInput style={styles.input} value={draft.cidade} editable={false} />
        <Text style={styles.label}>Estado (UF)</Text>
        <TextInput style={styles.input} value={draft.estado} editable={false} />
        <Text style={styles.label}>Bairro</Text>
        <TextInput
          style={styles.input}
          value={draft.bairro}
          onChangeText={(bairro) => setDraft((d) => ({ ...d, bairro }))}
        />
        <Text style={styles.label}>Endereço (rua)</Text>
        <TextInput
          style={styles.input}
          value={draft.endereco}
          onChangeText={(endereco) => setDraft((d) => ({ ...d, endereco }))}
        />
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "700", color: colors.soft, marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.white,
  },
  err: { color: "#DC2626", fontSize: 13, marginTop: 6 },
});
