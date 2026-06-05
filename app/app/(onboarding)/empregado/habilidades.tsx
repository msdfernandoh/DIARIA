import { router } from "expo-router";
import { Text } from "react-native";
import { ChipSelect } from "../../../src/components/ChipSelect";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { EMPREGADO_ACCENT, SKILLS } from "../../../src/constants/empregado";
import { useEmpregadoOnboarding } from "../../../src/context/EmpregadoOnboardingContext";

export default function HabilidadesStep() {
  const { draft, setDraft, setStep } = useEmpregadoOnboarding();

  return (
    <OnboardingShell
      step={3}
      totalSteps={10}
      accentColor={EMPREGADO_ACCENT}
      title="Suas áreas de atuação"
      subtitle="Escolha até 6 categorias — aparecem no seu perfil e nas buscas."
      onBack={() => router.back()}
      onNext={() => {
        if (draft.skills.length === 0) return;
        setStep(4);
        router.push("/(onboarding)/empregado/valor");
      }}
      nextDisabled={draft.skills.length === 0}
    >
      <ChipSelect
        items={SKILLS}
        selected={draft.skills}
        onChange={(skills) => setDraft((d) => ({ ...d, skills }))}
        max={6}
        accentColor={EMPREGADO_ACCENT}
      />
      <Text style={{ marginTop: 10, fontSize: 12, color: "#718096" }}>
        {draft.skills.length}/6 selecionadas
      </Text>
    </OnboardingShell>
  );
}
