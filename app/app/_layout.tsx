import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { InAppNotificationBanner } from "../src/components/InAppNotificationBanner";
import { resolveAppRoute } from "../src/lib/authRouting";
import {
  registerForPushNotifications,
  registerInAppBannerHandler,
  setupNotificationListeners,
} from "../src/lib/notifications";
import { supabase, supabaseConfigured } from "../src/lib/supabase";
import { registerUnreadRefreshFromPush } from "../src/hooks/useUnreadChatCount";
import { PENDING_REF_KEY, resolveIncomingLink } from "../src/lib/deepLinks";

export default function RootLayout() {
  const router = useRouter();
  const [banner, setBanner] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    registerInAppBannerHandler((title, body) => setBanner({ title, body }));
    registerUnreadRefreshFromPush();
  }, []);

  useEffect(() => {
    function openUrl(url: string) {
      const href = resolveIncomingLink(url);
      if (href) {
        const codigoMatch = href.match(/[?&]codigo=([^&]+)/);
        if (codigoMatch?.[1]) {
          void AsyncStorage.setItem(
            PENDING_REF_KEY,
            decodeURIComponent(codigoMatch[1]).toUpperCase()
          );
        }
        router.push(href as never);
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) openUrl(url);
    });
    const linkSub = Linking.addEventListener("url", ({ url }) => openUrl(url));

    if (!supabaseConfigured) {
      return () => linkSub.remove();
    }
    const removeListeners = setupNotificationListeners(router);

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        router.replace("/(auth)/choose-profile");
        return;
      }
      if (event === "SIGNED_IN" && session?.user?.id) {
        void registerForPushNotifications(session.user.id);
        const route = await resolveAppRoute(session.user.id);
        router.replace(route);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) void registerForPushNotifications(uid);
    });

    return () => {
      linkSub.remove();
      sub.subscription.unsubscribe();
      removeListeners();
    };
  }, [router]);

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        {banner ? (
          <InAppNotificationBanner
            title={banner.title}
            body={banner.body}
            onDismiss={() => setBanner(null)}
          />
        ) : null}
        <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0A0D14" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#F8FAFB" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(public)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/choose-profile" options={{ title: "Perfil" }} />
        <Stack.Screen name="(auth)/login" options={{ title: "Entrar" }} />
        <Stack.Screen name="(auth)/register" options={{ title: "Criar conta" }} />
        <Stack.Screen name="(onboarding)/empregado" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)/empreendedor" options={{ headerShown: false }} />
        <Stack.Screen name="(app)/(empregado)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)/(empregador)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)/(empreendedor)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)/(admin)/dashboard" options={{ title: "Admin" }} />
        <Stack.Screen name="(app)/pagamento/pix" options={{ title: "Pagamento Pix" }} />
        <Stack.Screen name="(app)/home" options={{ headerShown: false }} />
        <Stack.Screen
          name="(app)/avaliar/[applicationId]"
          options={{ title: "Avaliar diária" }}
        />
        <Stack.Screen
          name="(app)/oportunidades/qrcode/confirmar"
          options={{ title: "QR Code" }}
        />
      </Stack>
      </View>
    </>
  );
}
