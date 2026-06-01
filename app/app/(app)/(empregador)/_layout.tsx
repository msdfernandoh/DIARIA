import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../../src/constants/theme";
import { useUnreadChatCount } from "../../../src/hooks/useUnreadChatCount";

export default function EmpregadorTabLayout() {
  const unread = useUnreadChatCount();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: "#fff",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.soft,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="painel"
        options={{
          title: "Painel",
          tabBarLabel: "Painel",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="publicar"
        options={{
          title: "Publicar vaga",
          tabBarLabel: "Publicar",
          tabBarIcon: ({ focused }) => <TabIcon emoji="➕" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="moedas"
        options={{
          title: "Moedas",
          tabBarLabel: "Moedas",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🪙" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarLabel: "Chat",
          headerShown: false,
          tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="conta"
        options={{
          title: "Conta",
          tabBarLabel: "Conta",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
      <Tabs.Screen name="qr-scanner" options={{ href: null, title: "Confirmar QR" }} />
      <Tabs.Screen name="destaque/[jobId]" options={{ href: null, title: "Destaque" }} />
    </Tabs>
  );
}

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
}
