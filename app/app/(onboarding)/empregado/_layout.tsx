import { Stack } from "expo-router";
import { EmpregadoOnboardingProvider } from "../../../src/context/EmpregadoOnboardingContext";

export default function EmpregadoOnboardingLayout() {
  return (
    <EmpregadoOnboardingProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0A0D14" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#F8FAFB" },
          headerBackTitle: "Voltar",
        }}
      >
        <Stack.Screen name="dados" options={{ title: "Seus dados" }} />
        <Stack.Screen name="trabalho" options={{ title: "Tipo de trabalho" }} />
        <Stack.Screen name="habilidades" options={{ title: "Habilidades" }} />
        <Stack.Screen name="disponibilidade" options={{ title: "Disponibilidade" }} />
        <Stack.Screen name="codigo" options={{ title: "Código" }} />
        <Stack.Screen name="experiencias" options={{ title: "Experiências" }} />
        <Stack.Screen name="contato" options={{ title: "Contato" }} />
      </Stack>
    </EmpregadoOnboardingProvider>
  );
}
