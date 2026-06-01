import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes";
import type { NotificationPayload } from "../constants/notificationTypes";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let inAppBannerHandler: ((title: string, body: string) => void) | null = null;
let unreadRefreshHandler: (() => void) | null = null;

export function registerInAppBannerHandler(handler: (title: string, body: string) => void) {
  inAppBannerHandler = handler;
}

export function registerUnreadRefreshHandler(handler: () => void) {
  unreadRefreshHandler = handler;
}

export function showInAppBanner(title: string, body: string) {
  inAppBannerHandler?.(title, body);
}

function pushPlatform(): "ios" | "android" {
  return Platform.OS === "ios" ? "ios" : "android";
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const token = tokenResult.data;
  if (!token) return null;

  const { error } = await supabase.from("user_push_tokens").upsert(
    {
      user_id: userId,
      token,
      plataforma: pushPlatform(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,token" }
  );
  if (error) {
    console.warn("push token upsert", error.message);
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Padrão",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return token;
}

export type SendNotificationParams = {
  userId: string;
  titulo: string;
  corpo: string;
  data?: NotificationPayload | Record<string, unknown>;
};

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  try {
    await supabase.functions.invoke("send-notification", {
      body: {
        user_id: params.userId,
        titulo: params.titulo,
        corpo: params.corpo,
        data: params.data ?? {},
      },
    });
  } catch (e) {
    console.warn("sendNotification", e);
  }
}

export async function sendNotificationToUsers(
  userIds: string[],
  titulo: string,
  corpo: string,
  data?: NotificationPayload | Record<string, unknown>
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;
  try {
    await supabase.functions.invoke("send-notification", {
      body: {
        user_ids: unique,
        titulo,
        corpo,
        data: data ?? {},
      },
    });
  } catch (e) {
    console.warn("sendNotificationToUsers", e);
  }
}

export async function resolveNotificationRoute(
  data: Record<string, unknown>
): Promise<string | null> {
  const tipo = data.tipo as string | undefined;
  if (!tipo) return null;

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;

  const { data: me } = await supabase.from("users").select("tipo").eq("id", uid).maybeSingle();
  const profile = me?.tipo;

  switch (tipo) {
    case "chat": {
      const applicationId = data.applicationId as string;
      if (!applicationId) return null;
      if (profile === "empregador") {
        return `/(app)/(empregador)/chat/${applicationId}`;
      }
      return `/(app)/(empregado)/chat/${applicationId}`;
    }
    case "candidatura": {
      const applicationId = data.applicationId as string;
      if (applicationId && profile === "empregador") {
        return `/(app)/(empregador)/chat/${applicationId}`;
      }
      return "/(app)/(empregador)/painel";
    }
    case "nova_vaga": {
      const jobId = data.jobId as string;
      return jobId ? `/(app)/(empregado)/vagas/${jobId}` : "/(app)/(empregado)/vagas";
    }
    case "vaga":
      return "/(app)/(empregador)/painel";
    case "painel":
      return "/(app)/(empreendedor)/painel";
    case "grupo":
      return "/(app)/(empreendedor)/grupo";
    default:
      return null;
  }
}

export function setupNotificationListeners(router: { push: (href: string) => void }) {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const content = notification.request.content;
    const data = (content.data ?? {}) as Record<string, unknown>;
    showInAppBanner(content.title ?? "Notificação", content.body ?? "");
    if (data.tipo === "chat") {
      unreadRefreshHandler?.();
    }
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
    void resolveNotificationRoute(data).then((href) => {
      if (href) router.push(href as never);
    });
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

export async function notifyEmpreendedorNovoGrupo(empreendedorId: string): Promise<void> {
  const { count } = await supabase
    .from("user_group")
    .select("user_id", { count: "exact", head: true })
    .eq("empreendedor_id", empreendedorId)
    .eq("ativo", true);
  const T = NOTIFICATION_TYPES.EMPREENDEDOR.NOVO_USUARIO_GRUPO;
  await sendNotification({
    userId: empreendedorId,
    titulo: T.buildTitle(),
    corpo: T.buildBody(count ?? 0),
    data: T.data(),
  });
}

export async function maybeNotifyMetaBatida(userId: string, pctGeral: number): Promise<void> {
  if (pctGeral < 100) return;
  const month = new Date().toISOString().slice(0, 7);
  const key = `meta_batida_push_${userId}_${month}`;
  const sent = await AsyncStorage.getItem(key);
  if (sent) return;
  await AsyncStorage.setItem(key, "1");
  const T = NOTIFICATION_TYPES.EMPREENDEDOR.META_BATIDA;
  await sendNotification({
    userId,
    titulo: T.buildTitle(),
    corpo: T.buildBody(),
    data: T.data(),
  });
}

export async function notifyMicrofranquia(userId: string): Promise<void> {
  const T = NOTIFICATION_TYPES.EMPREENDEDOR.MICROFRANQUIA;
  await sendNotification({
    userId,
    titulo: T.buildTitle(),
    corpo: T.buildBody(),
    data: T.data(),
  });
}
