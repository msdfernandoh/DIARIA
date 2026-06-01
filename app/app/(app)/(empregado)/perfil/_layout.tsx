import { Stack } from "expo-router";
import { colors } from "../../../../src/constants/theme";

export default function PerfilLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: "#fff",
      }}
    />
  );
}
