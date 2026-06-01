import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { EMPREENDEDOR_ONBOARDING_STEPS, TIPO_PESSOA } from "../../../src/constants/empreendedor";
import { useEmpreendedorOnboarding } from "../../../src/context/EmpreendedorOnboardingContext";
import { formatCnpj, isValidCnpj } from "../../../src/lib/cnpj";
import { formatCpf, isValidCpf } from "../../../src/lib/cpf";
import { colors } from "../../../src/constants/theme";
import { buscarCep, formatCep } from "../../../src/lib/viacep";
import { supabase } from "../../../src/lib/supabase";

const ACCENT = colors.amber;

export default function PersonalStep() {
  const { draft, setDraft } = useEmpreendedorOnboarding();
  const [loadingCep, setLoadingCep] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id;
      if (!id) return;
      const { data: row } = await supabase
        .from("users")
        .select("nome, celular, email")
        .eq("id", id)
        .maybeSingle();
      if (row) {
        setDraft((d) => ({
          ...d,
          nome: row.nome ?? d.nome,
          celular: row.celular ?? d.celular,
          email: row.email ?? d.email,
        }));
      }
    });
  }, [setDraft]);

  async function onCepBlur() {
    const digits = draft.cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const r = await buscarCep(digits);
      if (!r) return;
      setDraft((d) => ({
        ...d,
        cep: formatCep(digits),
        cidade: r.cidade,
        estado: r.estado,
        nomeInstancia: d.nomeInstancia || `Diária ${r.cidade}`,
      }));
    } finally {
      setLoadingCep(false);
    }
  }

  function next() {
    if (!draft.nome.trim() || !draft.email.trim() || draft.celular.replace(/\D/g, "").length < 10) {
      setErr("Preencha nome, celular e e-mail.");
      return;
    }
    if (draft.cep.replace(/\D/g, "").length !== 8 || !draft.cidade) {
      setErr("Informe um CEP válido.");
      return;
    }
    const docOk =
      draft.tipoPessoa === "cnpj"
        ? isValidCnpj(draft.documento)
        : isValidCpf(draft.documento);
    if (!docOk) {
      setErr(draft.tipoPessoa === "cnpj" ? "CNPJ inválido." : "CPF inválido.");
      return;
    }
    setErr("");
    router.push("/(onboarding)/empreendedor/instancia");
  }

  return (
    <OnboardingShell
      step={1}
      totalSteps={EMPREENDEDOR_ONBOARDING_STEPS}
      accentColor={ACCENT}
      title="Seus dados"
      subtitle="Confirme contato e documento para abrir sua instância."
      onNext={next}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome completo *</Text>
        <TextInput style={styles.input} value={draft.nome} onChangeText={(nome) => setDraft((d) => ({ ...d, nome }))} />
        <Text style={styles.label}>Celular *</Text>
        <TextInput style={styles.input} keyboardType="phone-pad" value={draft.celular} onChangeText={(celular) => setDraft((d) => ({ ...d, celular }))} />
        <Text style={styles.label}>E-mail *</Text>
        <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" value={draft.email} onChangeText={(email) => setDraft((d) => ({ ...d, email }))} />
        <Text style={styles.label}>CEP *</Text>
        <TextInput style={styles.input} keyboardType="number-pad" value={draft.cep} onChangeText={(t) => setDraft((d) => ({ ...d, cep: formatCep(t) }))} onBlur={onCepBlur} />
        {loadingCep ? <ActivityIndicator color={ACCENT} /> : null}
        <Text style={styles.label}>Cidade / UF</Text>
        <Text style={styles.readonly}>{draft.cidade}{draft.estado ? `, ${draft.estado}` : ""}</Text>
        <Text style={styles.label}>Tipo de pessoa *</Text>
        <View style={styles.row}>
          {TIPO_PESSOA.map((t) => (
            <Pressable key={t.id} onPress={() => setDraft((d) => ({ ...d, tipoPessoa: t.id, documento: "" }))} style={[styles.chip, draft.tipoPessoa === t.id && styles.chipOn]}>
              <Text style={[styles.chipText, draft.tipoPessoa === t.id && styles.chipTextOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>{draft.tipoPessoa === "cnpj" ? "CNPJ *" : "CPF *"}</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={draft.documento}
          onChangeText={(t) =>
            setDraft((d) => ({
              ...d,
              documento: d.tipoPessoa === "cnpj" ? formatCnpj(t) : formatCpf(t),
            }))
          }
        />
        {err ? <Text style={styles.err}>{err}</Text> : null}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "700", color: colors.soft, marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, backgroundColor: colors.white },
  readonly: { padding: 12, color: colors.mid, fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.line },
  chipOn: { borderColor: colors.amber, backgroundColor: "rgba(217,119,6,0.12)" },
  chipText: { fontWeight: "700", color: colors.mid, fontSize: 12 },
  chipTextOn: { color: colors.amber },
  err: { color: "#DC2626", marginTop: 10 },
});
