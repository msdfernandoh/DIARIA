import { Stack } from "expo-router";

export default function ChatStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#0A0D14" },
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Chat" }} />
      <Stack.Screen name="[applicationId]" options={{ title: "Conversa" }} />
    </Stack>
  );
}
