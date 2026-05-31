import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0A0D14" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#F8FAFB" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/choose-profile" options={{ title: "Perfil" }} />
        <Stack.Screen name="(auth)/login" options={{ title: "Entrar" }} />
        <Stack.Screen name="(auth)/register" options={{ title: "Criar conta" }} />
        <Stack.Screen name="(onboarding)/empregado" options={{ headerShown: false }} />
        <Stack.Screen name="(app)/home" options={{ title: "Diária da Cidade" }} />
      </Stack>
    </>
  );
}
