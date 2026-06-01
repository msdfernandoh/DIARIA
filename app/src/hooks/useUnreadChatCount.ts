import { useCallback, useEffect, useState } from "react";
import {
  countUnreadForUser,
  subscribeUnreadMessages,
} from "../lib/chat";
import { registerUnreadRefreshHandler } from "../lib/notifications";
import { supabase } from "../lib/supabase";

const refreshListeners = new Set<() => void>();

export function registerUnreadRefreshFromPush() {
  registerUnreadRefreshHandler(() => {
    refreshListeners.forEach((fn) => fn());
  });
}

export function useUnreadChatCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setCount(0);
      return;
    }
    const { data: me } = await supabase.from("users").select("tipo").eq("id", uid).maybeSingle();
    try {
      const n = await countUnreadForUser(uid, me?.tipo ?? null);
      setCount(n);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    refreshListeners.add(refresh);
    refresh();
    let channel: ReturnType<typeof subscribeUnreadMessages> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      channel = subscribeUnreadMessages(uid, refresh);
    });
    return () => {
      refreshListeners.delete(refresh);
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh]);

  return count;
}
