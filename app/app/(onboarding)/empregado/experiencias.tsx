import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ChipSelect } from "../../../src/components/ChipSelect";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { EMPREGADO_ACCENT, HIGHLIGHT_TAGS } from "../../../src/constants/empregado";
import { useEmpregadoOnboarding } from "../../../src/context/EmpregadoOnboardingContext";
import { colors } from "../../../src/constants/theme";

export default function ExperienciasStep() {
  const { draft, setDraft, setStep } = useEmpregadoOnboarding();
  const [cargo, setCargo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [periodo, setPeriodo] = useState("");

  function addExperience() {
    if (!cargo.trim()) {
      Alert.alert("Cargo", "Informe pelo menos o cargo.");
      return;
    }
    setDraft((d) => ({
      ...d,
      experiences: [
        ...d.experiences,
        {
          id: String(Date.now()),
          cargo: cargo.trim(),
          empresa: empresa.trim(),
          periodo: periodo.trim(),
          tipo: "presencial",
          descricao: "",
        },
      ],
    }));
    setCargo("");
    setEmpresa("");
    setPeriodo("");
  }

  function remove(id: string) {
    setDraft((d) => ({
      ...d,
      experiences: d.experiences.filter((e) => e.id !== id),
    }));
  }

  return (
    <OnboardingShell
      step={9}
      totalSteps={10}
      accentColor={EMPREGADO_ACCENT}
      title="Suas experiências"
      subtitle="Opcional — ajuda contratantes a confiar no seu perfil."
      onBack={() => router.back()}
      onNext={() => {
        setStep(10);
        router.push("/(onboarding)/empregado/contato");
      }}
      secondaryAction={{
        label: "Pular esta etapa",
        onPress: () => {
          setStep(10);
          router.push("/(onboarding)/empregado/contato");
        },
      }}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Adicionar experiência</Text>
        <TextInput
          style={styles.input}
          placeholder="Cargo"
          value={cargo}
          onChangeText={setCargo}
        />
        <TextInput
          style={styles.input}
          placeholder="Empresa (opcional)"
          value={empresa}
          onChangeText={setEmpresa}
        />
        <TextInput
          style={styles.input}
          placeholder="Período (ex: Jan 2023 – Dez 2024)"
          value={periodo}
          onChangeText={setPeriodo}
        />
        <Pressable style={styles.addBtn} onPress={addExperience}>
          <Text style={styles.addText}>+ Adicionar</Text>
        </Pressable>
        {draft.experiences.map((e) => (
          <View key={e.id} style={styles.card}>
            <Text style={styles.cardTitle}>{e.cargo}</Text>
            {e.empresa ? <Text style={styles.cardSub}>{e.empresa}</Text> : null}
            {e.periodo ? <Text style={styles.cardSub}>{e.periodo}</Text> : null}
            <Pressable onPress={() => remove(e.id)}>
              <Text style={styles.remove}>Remover</Text>
            </Pressable>
          </View>
        ))}
        <Text style={styles.section}>Tópicos de destaque</Text>
        <ChipSelect
          items={HIGHLIGHT_TAGS}
          selected={draft.highlightTags}
          onChange={(highlightTags) => setDraft((d) => ({ ...d, highlightTags }))}
          accentColor={EMPREGADO_ACCENT}
        />
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.soft,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  addBtn: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginBottom: 12,
  },
  addText: { color: "#fff", fontWeight: "800" },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: { fontWeight: "800", color: colors.dark },
  cardSub: { color: colors.soft, fontSize: 13, marginTop: 2 },
  remove: { color: "#DC2626", marginTop: 8, fontWeight: "700" },
});
