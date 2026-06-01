import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../src/constants/theme";
import {
  corProgresso,
  fetchPainelData,
  formatBRL,
  gerarAcoesDiarias,
  mensagemMotivacional,
  MICROFRANQUIA_META_PESSOAS,
  MICROFRANQUIA_META_VAGAS,
  type AcaoDiaria,
  type PainelData,
} from "../../../src/lib/empreendedorPainel";
import { supabase } from "../../../src/lib/supabase";

const HERO = ["#451A03", "#D97706"] as const;
const POLL_MS = 5 * 60 * 1000;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(acaoId: string) {
  return `painel_acao_${todayKey()}_${acaoId}`;
}

function MetaProgressBar({ label, current, meta, pct }: { label: string; current: number; meta: number; pct: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const color = corProgresso(pct);
  const widthPct = Math.min(100, pct);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: widthPct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [anim, widthPct]);

  useEffect(() => {
    if (pct < 100) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pct, pulse]);

  const barWidth = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", `${widthPct}%`],
  });

  return (
    <View style={styles.barBlock}>
      <View style={styles.barHead}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barVal}>
          {current} / {meta}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: color, width: barWidth, transform: [{ scaleY: pulse }] },
          ]}
        />
      </View>
    </View>
  );
}

function AcaoCard({
  acao,
  done,
  onToggle,
}: {
  acao: AcaoDiaria;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.acaoCard, acao.urgent && styles.acaoUrgent, done && styles.acaoDone]}
    >
      <Text style={styles.acaoIcon}>{acao.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.acaoText, done && styles.acaoTextDone]}>{acao.texto}</Text>
        <View style={styles.impactBadge}>
          <Text style={styles.impactText}>{acao.impacto}</Text>
        </View>
      </View>
      <Text style={styles.check}>{done ? "☑" : "☐"}</Text>
    </Pressable>
  );
}

export default function EmpreendedorPainelScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<PainelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setData(null);
      return;
    }
    const panel = await fetchPainelData(uid);
    setData(panel);
    if (panel?.microfranquiaNova) {
      Alert.alert("🏆 Microfranquia conquistada!", "Parabéns! Você atingiu as metas vitalícias.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!data) return;
    const acoes = gerarAcoesDiarias(data.pctVagas, data.pctPessoas, data.pctGeral, data.diasRestantes);
    Promise.all(
      acoes.map(async (a) => {
        const v = await AsyncStorage.getItem(storageKey(a.id));
        return [a.id, v === "1"] as const;
      })
    ).then((pairs) => {
      const m: Record<string, boolean> = {};
      pairs.forEach(([id, d]) => {
        m[id] = d;
      });
      setDoneMap(m);
    });
  }, [data]);

  async function toggleAcao(id: string) {
    const next = !doneMap[id];
    setDoneMap((m) => ({ ...m, [id]: next }));
    await AsyncStorage.setItem(storageKey(id), next ? "1" : "0");
  }

  async function copyLink() {
    if (!data?.refLink) return;
    await Clipboard.setStringAsync(data.refLink);
    Alert.alert("Copiado!", "Link copiado para a área de transferência.");
  }

  function shareLink() {
    if (!data?.refLink) return;
    Share.share({
      message: `Entre na Diária da Cidade pelo meu link: ${data.refLink}`,
      url: data.refLink,
    });
  }

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Complete o onboarding de empreendedor para ver o painel.</Text>
      </View>
    );
  }

  const { entrepreneur: ent } = data;
  const acoes = gerarAcoesDiarias(data.pctVagas, data.pctPessoas, data.pctGeral, data.diasRestantes);
  const diasColor =
    data.diasRestantes > 15 ? colors.green : data.diasRestantes >= 8 ? colors.amber : "#DC2626";
  const diasWeight = data.diasRestantes < 7 ? "800" : "600";
  const lucro = data.receitaMes;
  const taxa =
    data.periodoGratisAtivo ? 0 : data.taxaPlataformaMes > 0 ? data.taxaPlataformaMes : lucro * 0.1;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load().finally(() => setRefreshing(false));
          }}
          tintColor={colors.amber}
        />
      }
    >
      <LinearGradient colors={[...HERO]} style={[styles.hero, { paddingTop: 16 + insets.top }]}>
        {ent.logo_url ? (
          <Image source={{ uri: ent.logo_url }} style={styles.logo} />
        ) : (
          <Text style={styles.logoEmoji}>📅</Text>
        )}
        <Text style={styles.heroTitle}>{ent.nome_instancia ?? "Minha instância"}</Text>
        <Text style={styles.heroCode}>Código: {ent.codigo}</Text>
        <View style={styles.heroActions}>
          <Pressable style={styles.heroBtn} onPress={() => void copyLink()}>
            <Text style={styles.heroBtnText}>📋 Copiar</Text>
          </Pressable>
          <Pressable style={styles.heroBtn} onPress={shareLink}>
            <Text style={styles.heroBtnText}>📤 Compartilhar</Text>
          </Pressable>
        </View>
        <Text style={styles.heroStatus}>
          {ent.status === "ativo" ? "Ativo" : ent.status} · Dia {data.diaAtual} de 30
        </Text>
        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Text style={styles.miniVal}>{data.totalGrupo}</Text>
            <Text style={styles.miniLabel}>Pessoas no grupo</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniVal}>{formatBRL(data.receitaMes)}</Text>
            <Text style={styles.miniLabel}>Receita do mês</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniVal}>{data.pctGeral}%</Text>
            <Text style={styles.miniLabel}>Meta %</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sua meta este mês</Text>
        <MetaProgressBar label="Vagas ativas" current={data.vagasAtivas} meta={ent.meta_vagas} pct={data.pctVagas} />
        <MetaProgressBar
          label="Pessoas no grupo"
          current={data.totalGrupo}
          meta={ent.meta_pessoas}
          pct={data.pctPessoas}
        />
        <Text style={[styles.diasRestantes, { color: diasColor, fontWeight: diasWeight }]}>
          {data.diasRestantes} dias restantes no período de 30 dias
        </Text>
        <View style={styles.pctCenter}>
          <Text style={styles.pctBig}>{data.pctGeral}%</Text>
          <Text style={styles.pctSub}>concluído</Text>
        </View>
        <Text style={styles.motiv}>{mensagemMotivacional(data.pctGeral)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Faça isso hoje</Text>
        {acoes.map((a) => (
          <AcaoCard key={a.id} acao={a} done={!!doneMap[a.id]} onToggle={() => void toggleAcao(a.id)} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receita</Text>
        <Text style={styles.recvLine}>Receita este mês: {formatBRL(data.receitaMes)}</Text>
        {data.periodoGratisAtivo ? (
          <>
            <Text style={styles.recvLine}>Taxa plataforma: {formatBRL(0)}</Text>
            <Text style={styles.recvOk}>✅ Grátis por mais {data.diasGratisRestantes} dias</Text>
          </>
        ) : (
          <Text style={styles.recvLine}>Taxa plataforma (10%): {formatBRL(taxa)}</Text>
        )}
        <Text style={styles.lucro}>Seu lucro: {formatBRL(lucro)}</Text>
        <Pressable onPress={() => router.push("/(app)/(empreendedor)/vendas/historico")}>
          <Text style={styles.link}>Ver histórico →</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conquiste sua microfranquia vitalícia</Text>
        {data.microfranquiaConquistada ? (
          <View style={styles.microBadge}>
            <Text style={styles.microBadgeText}>🏆 Microfranquia conquistada!</Text>
          </View>
        ) : null}
        <MetaProgressBar
          label="Vagas (total acumulado)"
          current={data.vagasTotalAcumulado}
          meta={MICROFRANQUIA_META_VAGAS}
          pct={data.pctMicroVagas}
        />
        <MetaProgressBar
          label="Pessoas no grupo (total)"
          current={data.totalGrupo}
          meta={MICROFRANQUIA_META_PESSOAS}
          pct={data.pctMicroPessoas}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atalhos</Text>
        <View style={styles.grid}>
          <Pressable style={styles.gridBtn} onPress={shareLink}>
            <Text style={styles.gridEmoji}>📤</Text>
            <Text style={styles.gridLabel}>Compartilhar link</Text>
          </Pressable>
          <Pressable style={styles.gridBtn} onPress={() => setQrOpen(true)}>
            <Text style={styles.gridEmoji}>🔲</Text>
            <Text style={styles.gridLabel}>Meu QR Code</Text>
          </Pressable>
          <Pressable style={styles.gridBtn} onPress={() => router.push("/(app)/(empreendedor)/vendas/nova")}>
            <Text style={styles.gridEmoji}>💰</Text>
            <Text style={styles.gridLabel}>Nova venda</Text>
          </Pressable>
          <Pressable style={styles.gridBtn} onPress={() => router.push("/(app)/(empreendedor)/grupo")}>
            <Text style={styles.gridEmoji}>👥</Text>
            <Text style={styles.gridLabel}>Ver meu grupo</Text>
          </Pressable>
          <Pressable
            style={styles.gridBtn}
            onPress={() => router.push("/(app)/(empreendedor)/oportunidades/nova")}
          >
            <Text style={styles.gridEmoji}>🎁</Text>
            <Text style={styles.gridLabel}>Oportunidade física</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={qrOpen} transparent animationType="slide" onRequestClose={() => setQrOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Seu QR Code</Text>
            <View style={styles.qrWrap}>
              <QRCode value={data.refLink} size={200} />
            </View>
            <Text style={styles.modalLink} numberOfLines={2}>
              {data.refLink}
            </Text>
            <Pressable style={styles.modalClose} onPress={() => setQrOpen(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  empty: { textAlign: "center", color: colors.soft },
  hero: { paddingHorizontal: 20, paddingBottom: 20 },
  logo: { width: 56, height: 56, borderRadius: 14, marginBottom: 8 },
  logoEmoji: { fontSize: 48, marginBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  heroCode: { color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: "600" },
  heroActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  heroBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  heroBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  heroStatus: { color: "rgba(255,255,255,0.9)", marginTop: 12, fontSize: 13 },
  miniStats: { flexDirection: "row", gap: 8, marginTop: 16 },
  miniStat: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  miniVal: { color: "#fff", fontWeight: "800", fontSize: 13 },
  miniLabel: { color: "rgba(255,255,255,0.8)", fontSize: 9, textAlign: "center", marginTop: 4 },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.dark, marginBottom: 12 },
  barBlock: { marginBottom: 14 },
  barHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  barLabel: { fontWeight: "700", color: colors.mid, fontSize: 13 },
  barVal: { fontWeight: "700", color: colors.soft, fontSize: 13 },
  barTrack: {
    height: 10,
    backgroundColor: colors.line,
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: { height: 10, borderRadius: 999 },
  diasRestantes: { marginTop: 4, fontSize: 13 },
  pctCenter: { alignItems: "center", marginVertical: 12 },
  pctBig: { fontSize: 42, fontWeight: "800", color: colors.dark },
  pctSub: { color: colors.soft, fontWeight: "600" },
  motiv: { textAlign: "center", color: colors.amber, fontWeight: "700", fontSize: 14 },
  acaoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  acaoUrgent: { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
  acaoDone: { opacity: 0.55 },
  acaoIcon: { fontSize: 22 },
  acaoText: { fontWeight: "600", color: colors.dark, fontSize: 13 },
  acaoTextDone: { textDecorationLine: "line-through" },
  impactBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E1F5EE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  impactText: { fontSize: 10, fontWeight: "800", color: colors.green },
  check: { fontSize: 20, color: colors.mid },
  recvLine: { color: colors.mid, marginBottom: 6, fontSize: 14 },
  recvOk: { color: colors.green, fontWeight: "700", marginBottom: 6 },
  lucro: { fontSize: 18, fontWeight: "800", color: colors.dark, marginTop: 4 },
  link: { color: colors.primary, fontWeight: "700", marginTop: 10 },
  microBadge: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  microBadgeText: { fontWeight: "800", color: colors.amber, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridBtn: {
    width: "48%",
    backgroundColor: colors.bg,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  gridEmoji: { fontSize: 28, marginBottom: 6 },
  gridLabel: { fontWeight: "700", color: colors.mid, fontSize: 12, textAlign: "center" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  qrWrap: { padding: 12, backgroundColor: "#fff", borderRadius: 12 },
  modalLink: { fontSize: 11, color: colors.soft, marginTop: 12, textAlign: "center" },
  modalClose: {
    marginTop: 16,
    backgroundColor: colors.amber,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCloseText: { color: "#fff", fontWeight: "800" },
});
