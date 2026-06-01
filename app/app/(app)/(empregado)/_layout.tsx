import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../../src/constants/theme";
import { useUnreadChatCount } from "../../../src/hooks/useUnreadChatCount";

export default function EmpregadoTabLayout() {
  const unread = useUnreadChatCount();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: "#fff",
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.soft,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, borderTopWidth: 1 },
      }}
    >
      <Tabs.Screen name="vagas" options={{ title: "Vagas", tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
      <Tabs.Screen name="agenda" options={{ title: "Agenda", tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} /> }} />
      <Tabs.Screen
        name="moedas"
        options={{
          title: "Moedas",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🪙" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="oportunidades"
        options={{
          title: "Oportunidades",
          tabBarLabel: "Brindes",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎁" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" focused={focused} />,
        }}
      />
      <Tabs.Screen name="destaque" options={{ href: null, title: "Destaque" }} />
    </Tabs>
  );
}

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
}
