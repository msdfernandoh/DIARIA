import { Stack, router } from "expo-router";
import { Pressable, Text } from "react-native";
import { colors } from "../../src/constants/theme";

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: "#fff",
        headerTitle: "Diária da Cidade",
        headerRight: () => (
          <Pressable onPress={() => router.push("/(auth)/login")} style={{ paddingHorizontal: 12 }}>
            <Text style={{ color: "#93C5FD", fontWeight: "700" }}>Entrar</Text>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="vagas-preview" options={{ title: "Vagas" }} />
      <Stack.Screen name="contratar-preview" options={{ title: "Para empresas" }} />
    </Stack>
  );
}
