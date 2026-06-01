import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../../../../src/constants/theme";
import {
  fetchOpportunities,
  formatValidUntil,
  generateQrToken,
  redeemErrorMessage,
  redeemOpportunity,
  tipoEmoji,
  type PhysicalOpportunity,
} from "../../../../src/lib/opportunities";
import { getCoinWallet } from "../../../../src/lib/coins";
import { supabase } from "../../../../src/lib/supabase";

export default function OportunidadesListScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PhysicalOpportunity[]>([]);
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<PhysicalOpportunity | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    setUserId(uid);
    const wallet = await getCoinWallet(uid);
    setBalance(wallet.available);
    const list = await fetchOpportunities(uid);
    setItems(list);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  async function onConfirmRedeem() {
    if (!selected || !userId) return;
    setRedeeming(true);
    try {
      const token = generateQrToken();
      const { redemptionId } = await redeemOpportunity(selected.id, token);
      setSelected(null);
      router.push(`/(app)/(empregado)/oportunidades/qrcode/${redemptionId}`);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      Alert.alert("Resgate", redeemErrorMessage(code));
    } finally {
      setRedeeming(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.balance}>Seu saldo: 🪙 {balance} moedas</Text>
      <FlatList
        data={items}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhuma oportunidade na sua cidade ou grupo agora. Volte em breve!
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => setSelected(item)}>
            {item.foto_url ? (
              <Image source={{ uri: item.foto_url }} style={styles.photo} />
            ) : (
              <Text style={styles.emoji}>{tipoEmoji(item.tipo)}</Text>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.titulo}</Text>
              <Text style={styles.meta}>{item.local_nome ?? "Local a combinar"}</Text>
              <Text style={styles.coins}>🪙 {item.custo_moedas} moedas</Text>
              <Text
                style={[
                  styles.stock,
                  item.quantidade_restante <= 3 && { color: "#DC2626", fontWeight: "800" },
                ]}
              >
                {item.quantidade_restante} restante(s)
              </Text>
              <Text style={styles.valid}>Válido até {formatValidUntil(item.valida_ate)}</Text>
              {item.distancia_km != null ? (
                <Text style={styles.dist}>{item.distancia_km.toFixed(1)} km de você</Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />

      <Modal visible={!!selected} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {selected ? (
              <>
                <Text style={styles.modalEmoji}>{tipoEmoji(selected.tipo)}</Text>
                <Text style={styles.modalTitle}>
                  Trocar {selected.custo_moedas} moedas por {selected.titulo}?
                </Text>
                <Text style={styles.modalSub}>
                  Seu saldo: {balance} → {Math.max(0, balance - selected.custo_moedas)} moedas
                </Text>
                <Text style={styles.modalHint}>Válido por 48h após resgatar (QR no estabelecimento)</Text>
                <Pressable
                  style={[styles.modalBtn, styles.modalPrimary]}
                  onPress={() => void onConfirmRedeem()}
                  disabled={redeeming || balance < selected.custo_moedas}
                >
                  <Text style={styles.modalPrimaryText}>
                    {redeeming ? "Resgatando..." : "Resgatar agora"}
                  </Text>
                </Pressable>
                <Pressable style={styles.modalBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.modalCancel}>Cancelar</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  balance: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontWeight: "800",
    color: colors.dark,
  },
  empty: { textAlign: "center", color: colors.soft, marginTop: 40, paddingHorizontal: 24 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  photo: { width: 72, height: 72, borderRadius: 10 },
  emoji: { fontSize: 48, width: 72, textAlign: "center" },
  title: { fontWeight: "800", color: colors.dark, fontSize: 16 },
  meta: { color: colors.soft, fontSize: 12, marginTop: 4 },
  coins: { color: colors.green, fontWeight: "800", marginTop: 6 },
  stock: { fontSize: 12, color: colors.mid, marginTop: 2 },
  valid: { fontSize: 11, color: colors.soft, marginTop: 2 },
  dist: { fontSize: 11, color: colors.primary, marginTop: 2 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  modalEmoji: { fontSize: 48, textAlign: "center", marginBottom: 8 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: colors.dark, textAlign: "center" },
  modalSub: { textAlign: "center", color: colors.mid, marginTop: 10 },
  modalHint: { textAlign: "center", color: colors.soft, fontSize: 12, marginTop: 8 },
  modalBtn: { marginTop: 14, alignItems: "center", paddingVertical: 12 },
  modalPrimary: { backgroundColor: colors.green, borderRadius: 12 },
  modalPrimaryText: { color: "#fff", fontWeight: "800" },
  modalCancel: { color: colors.soft, fontWeight: "700" },
});
