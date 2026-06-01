import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../constants/theme";
import {
  fetchConversationsAsCandidate,
  fetchConversationsAsEmployer,
  relativeChatTime,
  type ConversationRow,
} from "../lib/chat";
import { supabase } from "../lib/supabase";

type Props = {
  mode: "empregado" | "empregador";
  chatPath: "/(app)/(empregado)/chat/[applicationId]" | "/(app)/(empregador)/chat/[applicationId]";
  accent: string;
};

function initials(nome: string) {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p[0][0] + (p[p.length - 1]?.[0] ?? "")).toUpperCase();
}

export function ChatInboxList({ mode, chatPath, accent }: Props) {
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setRows([]);
      return;
    }
    const data =
      mode === "empregado"
        ? await fetchConversationsAsCandidate(uid)
        : await fetchConversationsAsEmployer(uid);
    setRows(data);
  }, [mode]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.applicationId}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load().finally(() => setRefreshing(false));
          }}
          tintColor={accent}
        />
      }
      contentContainerStyle={rows.length ? styles.list : styles.listEmpty}
      ListEmptyComponent={
        <Text style={styles.empty}>Nenhuma conversa ainda. Candidate-se ou receba contatos.</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() =>
            router.push({
              pathname: chatPath,
              params: { applicationId: item.applicationId },
            })
          }
        >
          <View style={[styles.av, { backgroundColor: accent }]}>
            <Text style={styles.avText}>{initials(item.otherName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.rowTop}>
              <Text style={styles.name} numberOfLines={1}>
                {item.otherName}
              </Text>
              <Text style={styles.time}>{relativeChatTime(item.lastAt)}</Text>
            </View>
            <Text style={styles.job} numberOfLines={1}>
              {item.jobTitle}
            </Text>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastPreview}
            </Text>
          </View>
          {item.unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  list: { paddingVertical: 8 },
  listEmpty: { flexGrow: 1, justifyContent: "center", padding: 32 },
  empty: { textAlign: "center", color: colors.soft, lineHeight: 22 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
  },
  av: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { fontWeight: "800", color: colors.dark, flex: 1 },
  time: { fontSize: 11, color: colors.soft },
  job: { fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: "600" },
  preview: { fontSize: 13, color: colors.soft, marginTop: 4 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
});
