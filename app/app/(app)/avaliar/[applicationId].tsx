import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RATING_TOPICS_EMPREGADO, RATING_TOPICS_EMPREGADOR } from "../../../src/constants/ratingTopics";
import { colors } from "../../../src/constants/theme";
import {
  fetchRatingApplicationContext,
  hasUserRated,
  submitRating,
  type RatingApplicationContext,
} from "../../../src/lib/ratings";
import { supabase } from "../../../src/lib/supabase";

const STAR_COLOR = "#F59E0B";
const STAR_OFF = "#E2E8F0";

function initials(nome: string) {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

function StarRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const scales = useRef([1, 1, 1, 1, 1].map(() => new Animated.Value(1))).current;

  function pick(n: number) {
    onChange(n);
    const anim = scales[n - 1];
    anim.setValue(1.3);
    Animated.spring(anim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }

  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => pick(n)} hitSlop={8}>
          <Animated.Text
            style={[
              styles.star,
              { color: n <= value ? STAR_COLOR : STAR_OFF, transform: [{ scale: scales[n - 1] }] },
            ]}
          >
            ★
          </Animated.Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function AvaliarScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const [loading, setLoading] = useState(true);
  const [ctx, setCtx] = useState<RatingApplicationContext | null>(null);
  const [accent, setAccent] = useState(colors.green);
  const [nota, setNota] = useState(0);
  const [topicos, setTopicos] = useState<string[]>([]);
  const [comentario, setComentario] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!applicationId) return;
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      router.back();
      return;
    }
    const { data: me } = await supabase.from("users").select("tipo").eq("id", uid).maybeSingle();
    setAccent(me?.tipo === "empregador" ? colors.primary : colors.green);

    if (await hasUserRated(applicationId, uid)) {
      Alert.alert("Já avaliado", "Você já enviou sua avaliação desta diária.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }

    const context = await fetchRatingApplicationContext(applicationId, uid);
    if (!context) {
      Alert.alert("Erro", "Não foi possível abrir esta avaliação.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }
    if (context.status !== "concluida") {
      Alert.alert("Indisponível", "A diária ainda não foi marcada como concluída.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }
    if (
      context.avaliacao_expires_at &&
      new Date(context.avaliacao_expires_at).getTime() < Date.now()
    ) {
      Alert.alert("Prazo expirado", "O prazo de 48h para avaliar já passou.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }
    setCtx(context);
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const topicList =
    ctx?.avaliadoRole === "empregado" ? RATING_TOPICS_EMPREGADO : RATING_TOPICS_EMPREGADOR;

  function toggleTopic(id: string) {
    setTopicos((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function onSubmit() {
    if (!ctx || !applicationId || nota < 1) {
      Alert.alert("Avaliação", "Selecione de 1 a 5 estrelas.");
      return;
    }
    setSending(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Sessão expirada.");
      await submitRating({
        applicationId,
        avaliadorId: uid,
        avaliadoId: ctx.avaliadoId,
        nota,
        topicos,
        comentario,
        avaliadoRole: ctx.avaliadoRole,
      });
      Alert.alert("Avaliação enviada!", "Obrigado pelo feedback.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  }

  if (loading || !ctx) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.jobMeta}>{ctx.jobTitulo}</Text>

      <View style={styles.personCard}>
        {ctx.avaliadoFoto ? (
          <Image source={{ uri: ctx.avaliadoFoto }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPh]}>
            <Text style={styles.avatarText}>{initials(ctx.avaliadoNome)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.personName}>{ctx.avaliadoNome}</Text>
          <Text style={styles.personSub}>{ctx.avaliadoSubtitle}</Text>
        </View>
      </View>

      <Text style={styles.label}>Sua nota</Text>
      <StarRow value={nota} onChange={setNota} />

      {nota > 0 ? (
        <>
          <Text style={styles.label}>Destaques (opcional)</Text>
          <View style={styles.chips}>
            {topicList.map((t) => {
              const on = topicos.includes(t.id);
              return (
                <Pressable
                  key={t.id}
                  style={[styles.chip, on && { borderColor: accent, backgroundColor: `${accent}18` }]}
                  onPress={() => toggleTopic(t.id)}
                >
                  <Text style={[styles.chipText, on && { color: accent, fontWeight: "800" }]}>
                    {t.emoji} {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <Text style={styles.label}>Comentário (opcional)</Text>
      <TextInput
        style={styles.input}
        value={comentario}
        onChangeText={setComentario}
        placeholder="Conte como foi a experiência..."
        multiline
        maxLength={200}
      />
      <Text style={styles.charCount}>{comentario.length}/200</Text>

      <Pressable
        style={[styles.submit, { backgroundColor: accent }, (sending || nota < 1) && styles.submitOff]}
        onPress={() => void onSubmit()}
        disabled={sending || nota < 1}
      >
        <Text style={styles.submitText}>{sending ? "Enviando..." : "Enviar avaliação ⭐"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  jobMeta: { fontSize: 13, color: colors.soft, marginBottom: 16 },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 24,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPh: { backgroundColor: colors.line, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800", color: colors.mid },
  personName: { fontSize: 18, fontWeight: "800", color: colors.dark },
  personSub: { fontSize: 13, color: colors.soft, marginTop: 4 },
  label: { fontSize: 14, fontWeight: "800", color: colors.dark, marginBottom: 10 },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  star: { fontSize: 44 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipText: { fontSize: 12, color: colors.mid },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: colors.white,
  },
  charCount: { fontSize: 11, color: colors.soft, textAlign: "right", marginTop: 4 },
  submit: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitOff: { opacity: 0.5 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
