import { Stack } from "expo-router";
import { EmpreendedorOnboardingProvider } from "../../../src/context/EmpreendedorOnboardingContext";

export default function EmpreendedorOnboardingLayout() {
  return (
    <EmpreendedorOnboardingProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0A0D14" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#F8FAFB" },
          headerBackTitle: "Voltar",
        }}
      >
        <Stack.Screen name="personal" options={{ title: "Seus dados" }} />
        <Stack.Screen name="instancia" options={{ title: "Sua instância" }} />
        <Stack.Screen name="pix" options={{ title: "Pix" }} />
        <Stack.Screen name="termos" options={{ title: "Termos" }} />
        <Stack.Screen name="metas" options={{ title: "Metas" }} />
        <Stack.Screen name="conclusao" options={{ title: "Pronto!" }} />
      </Stack>
    </EmpreendedorOnboardingProvider>
  );
}
