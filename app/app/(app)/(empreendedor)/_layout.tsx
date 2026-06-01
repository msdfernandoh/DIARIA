import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../../src/constants/theme";

export default function EmpreendedorTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: "#fff",
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.soft,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, borderTopWidth: 1 },
      }}
    >
      <Tabs.Screen name="painel" options={{ title: "Painel", headerShown: false, tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }} />
      <Tabs.Screen name="vender" options={{ title: "Vender", tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} /> }} />
      <Tabs.Screen name="config" options={{ title: "Config", tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} /> }} />
      <Tabs.Screen name="vendas" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="grupo" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
}
