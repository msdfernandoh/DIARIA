import { useNavigation } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/theme";
import {
  fetchApplicationContext,
  fetchMessages,
  markMessagesRead,
  sendTextMessage,
  sharePhoneInChat,
  subscribeMessages,
  type ApplicationContext,
  type ChatMessage,
} from "../lib/chat";
import { supabase } from "../lib/supabase";

type Props = {
  applicationId: string;
  accentColor: string;
};

function statusLabel(status: string) {
  if (status === "aceita") return "Aceita";
  if (status === "concluida") return "Concluída";
  if (status === "recusada") return "Recusada";
  if (status === "cancelada") return "Cancelada";
  return "Pendente";
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function isSystemTipo(tipo: string) {
  return tipo === "sistema" || tipo === "celular_compartilhado";
}

export function ChatConversationScreen({ applicationId, accentColor }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ctx, setCtx] = useState<ApplicationContext | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [cardOpen, setCardOpen] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const listRef = useRef<FlatList>(null);

  const upsertMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const i = prev.findIndex((m) => m.id === msg.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = msg;
        return next;
      }
      return [...prev, msg];
    });
  }, []);

  useEffect(() => {
    if (!applicationId) return;
    let channel: ReturnType<typeof subscribeMessages> | null = null;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      setUserId(uid);
      const context = await fetchApplicationContext(applicationId, uid ?? "");
      setCtx(context);
      const msgs = await fetchMessages(applicationId);
      setMessages(msgs);
      if (uid) await markMessagesRead(applicationId, uid);
      setLoading(false);

      channel = subscribeMessages(applicationId, {
        onInsert: (msg) => {
          upsertMessage(msg);
          if (uid && msg.sender_id !== uid) {
            markMessagesRead(applicationId, uid);
          }
        },
        onUpdate: (msg) => upsertMessage(msg),
      });
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [applicationId, upsertMessage]);

  useLayoutEffect(() => {
    if (!ctx) return;
    navigation.setOptions({
      title: ctx.otherName,
      headerRight: () =>
        ctx.otherCelularVisivel && ctx.otherCelular ? (
          <Pressable
            onPress={() => Linking.openURL(`tel:${ctx.otherCelular}`)}
            style={{ paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Text style={{ fontSize: 16 }}>📞</Text>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }} numberOfLines={1}>
              {ctx.otherCelular}
            </Text>
          </Pressable>
        ) : null,
    });
  }, [ctx, navigation]);

  async function onSend() {
    if (!userId || !text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendTextMessage(applicationId, userId, text);
      upsertMessage(msg);
      setText("");
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  }

  async function onSharePhone() {
    if (!userId || !ctx) return;
    const myNome = userId === ctx.candidatoId ? ctx.candidatoNome : ctx.empregadorNome;
    try {
      await sharePhoneInChat(applicationId, userId, myNome, ctx.myCelular || "—");
      setCtx({ ...ctx, myCelularVisivel: true });
      setBannerDismissed(true);
      const msgs = await fetchMessages(applicationId);
      setMessages(msgs);
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível compartilhar.");
    }
  }

  if (loading || !ctx) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={accentColor} />
      </View>
    );
  }

  const showBanner = !ctx.myCelularVisivel && !bannerDismissed;

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Pressable style={styles.jobCard} onPress={() => setCardOpen((o) => !o)}>
        <View style={styles.jobCardHead}>
          <Text style={styles.jobCardTitle} numberOfLines={cardOpen ? 2 : 1}>
            {ctx.jobTitle}
          </Text>
          <Text style={styles.jobCardChevron}>{cardOpen ? "▲" : "▼"}</Text>
        </View>
        {cardOpen ? (
          <>
            <Text style={styles.jobCardMeta}>
              {ctx.empregadorNome} · {ctx.jobDate ?? "Data a combinar"}
            </Text>
            <Text style={[styles.jobCardStatus, { color: accentColor }]}>
              Candidatura: {statusLabel(ctx.status)}
            </Text>
          </>
        ) : null}
      </Pressable>

      {showBanner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Facilite o contato — compartilhe seu número?</Text>
          <View style={styles.bannerActions}>
            <Pressable onPress={onSharePhone}>
              <Text style={[styles.bannerBtn, { color: accentColor }]}>Compartilhar</Text>
            </Pressable>
            <Pressable onPress={() => setBannerDismissed(true)}>
              <Text style={styles.bannerLater}>Agora não</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        inverted
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={<Text style={styles.empty}>Envie a primeira mensagem.</Text>}
        renderItem={({ item }) => {
          if (isSystemTipo(item.tipo)) {
            return (
              <View style={styles.systemWrap}>
                <Text style={styles.system}>{item.texto}</Text>
              </View>
            );
          }
          const mine = item.sender_id === userId;
          return (
            <View style={[styles.bubbleWrap, mine ? styles.alignEnd : styles.alignStart]}>
              <View style={[styles.bubble, mine ? { backgroundColor: accentColor } : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.texto}</Text>
              </View>
              <Text style={styles.meta}>
                {formatMsgTime(item.criado_em)}
                {mine ? (item.lida ? " · ✓✓" : " · ✓") : ""}
              </Text>
            </View>
          );
        }}
      />

      <View style={[styles.inputBar, { paddingBottom: 8 + insets.bottom }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Mensagem..."
          multiline
          maxLength={500}
        />
        <Pressable
          style={[styles.sendBtn, { backgroundColor: accentColor }, (!text.trim() || sending) && styles.sendDisabled]}
          onPress={onSend}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendText}>→</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  jobCard: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  jobCardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  jobCardTitle: { fontWeight: "800", color: colors.dark, flex: 1 },
  jobCardChevron: { color: colors.soft, marginLeft: 8 },
  jobCardMeta: { fontSize: 12, color: colors.soft, marginTop: 6 },
  jobCardStatus: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  banner: {
    backgroundColor: "#FFFBEB",
    borderBottomWidth: 1,
    borderBottomColor: "#FCD34D",
    padding: 12,
  },
  bannerText: { fontSize: 13, color: colors.dark, marginBottom: 8 },
  bannerActions: { flexDirection: "row", gap: 16 },
  bannerBtn: { fontWeight: "800" },
  bannerLater: { color: colors.soft, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.soft, transform: [{ scaleY: -1 }] },
  systemWrap: { alignItems: "center", marginVertical: 4 },
  system: {
    fontSize: 12,
    color: colors.soft,
    fontStyle: "italic",
    backgroundColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: "90%",
    textAlign: "center",
  },
  bubbleWrap: { maxWidth: "88%" },
  alignEnd: { alignSelf: "flex-end" },
  alignStart: { alignSelf: "flex-start" },
  bubble: {
    padding: 12,
    borderRadius: 14,
  },
  bubbleOther: {
    backgroundColor: "#F0F2F7",
    borderTopLeftRadius: 4,
  },
  bubbleText: { color: colors.dark },
  bubbleTextMine: { color: "#fff" },
  meta: { fontSize: 10, color: colors.soft, marginTop: 4, alignSelf: "flex-end" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.bg,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: "#fff", fontSize: 20, fontWeight: "800" },
});
