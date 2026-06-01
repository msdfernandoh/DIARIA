import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { ConfirmModal } from "./ConfirmModal";
import { COIN_PRODUCTS_EMPREGADO, COIN_PRODUCTS_EMPREGADOR, EARN_TIPS, type CoinProduct } from "../constants/coinProducts";
import { colors } from "../constants/theme";
import { CONFIG } from "../constants/config";
import { daysUntil, reasonLabel, relativeTxDate } from "../lib/coinReasons";
import {
  checkAndUnlockCoins,
  fetchCoinTransactions,
  getCoinWallet,
  spendCoins,
  type CoinTransactionRow,
  type CoinWallet,
} from "../lib/coins";
import { supabase } from "../lib/supabase";

type Props = {
  profile: "empregado" | "empregador";
};

export function CoinsScreen({ profile }: Props) {
  const accent = profile === "empregado" ? colors.green : colors.primary;
  const heroColors =
    profile === "empregado" ? (["#0D4D3A", colors.green] as const) : (["#0A3DBF", colors.primary] as const);
  const products = profile === "empregado" ? COIN_PRODUCTS_EMPREGADO : COIN_PRODUCTS_EMPREGADOR;

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<CoinWallet | null>(null);
  const [txs, setTxs] = useState<CoinTransactionRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [pendingProduct, setPendingProduct] = useState<CoinProduct | null>(null);
  const [spending, setSpending] = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    setUserId(uid);
    await checkAndUnlockCoins(uid);
    const w = await getCoinWallet(uid);
    const list = await fetchCoinTransactions(uid);
    setWallet(w);
    setTxs(list);

    const { data: group } = await supabase
      .from("user_group")
      .select("codigo_usado, entrepreneurs(codigo)")
      .eq("user_id", uid)
      .eq("ativo", true)
      .maybeSingle();
    const ent = group?.entrepreneurs as { codigo?: string } | { codigo?: string }[] | null;
    const codigo = Array.isArray(ent) ? ent[0]?.codigo : ent?.codigo;
    setRefCode(codigo ?? group?.codigo_usado ?? null);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function confirmSpend() {
    if (!pendingProduct || !userId || !wallet) return;
    setSpending(true);
    try {
      const { newBalance } = await spendCoins(userId, pendingProduct.cost, pendingProduct.reason);
      setWallet({ ...wallet, balance: newBalance, available: newBalance });
      const list = await fetchCoinTransactions(userId);
      setTxs(list);
      setPendingProduct(null);
      Alert.alert("Pronto!", `${pendingProduct.title} ativado.`);
    } catch (e) {
      if (e instanceof Error && e.message === "INSUFFICIENT") {
        Alert.alert("Saldo insuficiente", "Ganhe mais moedas indicando amigos!");
      } else {
        Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível usar moedas.");
      }
    } finally {
      setSpending(false);
    }
  }

  async function shareLink() {
    const link = refCode ? CONFIG.refLink(refCode) : `${CONFIG.APP_URL}/ref`;
    await Share.share({
      message: `Entre na Diária da Cidade pelo meu link: ${link}`,
      url: link,
    });
  }

  if (loading || !wallet) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={accent} size="large" />
      </View>
    );
  }

  const displayBalance = wallet.balance + wallet.blockedTotal;

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <LinearGradient colors={[...heroColors]} style={styles.hero}>
          <Text style={styles.heroIcon}>🪙</Text>
          <Text style={styles.heroLabel}>Seu saldo</Text>
          <Text style={styles.heroBalance}>{displayBalance} moedas</Text>
          {wallet.blockedTotal > 0 ? (
            <Text style={styles.heroBlocked}>
              🔒 {wallet.blockedTotal} moedas bloqueadas (liberam em até 7 dias após o bônus)
            </Text>
          ) : null}
          <Text style={styles.heroHint}>Disponível para gastar: {wallet.available} moedas</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>O que você pode fazer com moedas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
          {products.map((p) => (
            <View key={p.id} style={styles.productCard}>
              <Text style={styles.productEmoji}>{p.emoji}</Text>
              <Text style={styles.productTitle}>{p.title}</Text>
              <Text style={styles.productMeta}>
                {p.cost} moedas · {p.duration}
              </Text>
              <Pressable
                style={[styles.useBtn, { backgroundColor: accent }]}
                onPress={() => setPendingProduct(p)}
              >
                <Text style={styles.useBtnText}>Usar</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Como ganhar mais moedas</Text>
        {EARN_TIPS.map((tip) => (
          <View key={tip.text} style={styles.tipRow}>
            <Text style={styles.tipEmoji}>{tip.emoji}</Text>
            <Text style={styles.tipText}>{tip.text}</Text>
            <Text style={[styles.tipCoins, { color: accent }]}>{tip.coins}</Text>
          </View>
        ))}
        <Pressable style={[styles.shareBtn, { borderColor: accent }]} onPress={() => void shareLink()}>
          <Text style={[styles.shareBtnText, { color: accent }]}>Compartilhar meu link</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Extrato</Text>
        {txs.length === 0 ? (
          <Text style={styles.empty}>Nenhuma movimentação ainda.</Text>
        ) : (
          txs.map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <Text style={styles.txIcon}>{tx.type === "earn" ? "↑" : "↓"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.txReason}>{reasonLabel(tx.reason)}</Text>
                <Text style={styles.txDate}>{relativeTxDate(tx.created_at)}</Text>
                {tx.bloqueado && tx.libera_em ? (
                  <Text style={styles.txLock}>
                    🔒 Libera em {daysUntil(tx.libera_em)} dia(s)
                  </Text>
                ) : null}
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.type === "earn" ? colors.green : "#DC2626" },
                ]}
              >
                {tx.type === "earn" ? "+" : "-"}
                {tx.amount}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!pendingProduct}
        title={pendingProduct ? `Usar ${pendingProduct.cost} moedas?` : ""}
        message={
          pendingProduct
            ? `Usar ${pendingProduct.cost} moedas para ${pendingProduct.title}?\nSaldo após: ${wallet.available - pendingProduct.cost} moedas`
            : ""
        }
        accentColor={accent}
        onConfirm={() => void confirmSpend()}
        onCancel={() => setPendingProduct(null)}
        loading={spending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { padding: 24, alignItems: "center" },
  heroIcon: { fontSize: 40, marginBottom: 8 },
  heroLabel: { color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  heroBalance: { fontSize: 36, fontWeight: "800", color: "#fff", marginTop: 4 },
  heroBlocked: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 16,
  },
  heroHint: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.dark,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  productRow: { paddingHorizontal: 12, gap: 10 },
  productCard: {
    width: 160,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  productEmoji: { fontSize: 28, marginBottom: 6 },
  productTitle: { fontWeight: "800", color: colors.dark, fontSize: 14 },
  productMeta: { fontSize: 11, color: colors.soft, marginTop: 4, marginBottom: 10 },
  useBtn: { paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  useBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tipEmoji: { fontSize: 20 },
  tipText: { flex: 1, color: colors.mid, fontSize: 13 },
  tipCoins: { fontWeight: "800", fontSize: 13 },
  shareBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  shareBtnText: { fontWeight: "800" },
  empty: { marginHorizontal: 16, color: colors.soft },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  txIcon: { fontSize: 18, fontWeight: "800", color: colors.soft },
  txReason: { fontWeight: "700", color: colors.dark, fontSize: 13 },
  txDate: { fontSize: 11, color: colors.soft, marginTop: 2 },
  txLock: { fontSize: 10, color: colors.amber, marginTop: 4 },
  txAmount: { fontWeight: "800", fontSize: 16 },
});
