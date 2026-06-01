import { Stack } from "expo-router";
import { EmpregadorOnboardingProvider } from "../../../src/context/EmpregadorOnboardingContext";

export default function EmpregadorOnboardingLayout() {
  return (
    <EmpregadorOnboardingProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0A0D14" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#F8FAFB" },
          headerBackTitle: "Voltar",
        }}
      >
        <Stack.Screen name="localizacao" options={{ title: "Localização" }} />
        <Stack.Screen name="tipo" options={{ title: "Tipo de contratante" }} />
        <Stack.Screen name="codigo" options={{ title: "Código" }} />
      </Stack>
    </EmpregadorOnboardingProvider>
  );
}
