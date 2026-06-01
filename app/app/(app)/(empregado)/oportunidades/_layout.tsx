import { Stack } from "expo-router";
import { colors } from "../../../../src/constants/theme";

export default function OportunidadesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: "#fff",
      }}
    />
  );
}
