import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../../../src/constants/theme";
import { fetchRatings, type RatingRow } from "../../../../../src/lib/ratings";
import { supabase } from "../../../../../src/lib/supabase";

export default function TodasAvaliacoesScreen() {
  const [rows, setRows] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      setRows(await fetchRatings(uid, 50, 0));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.wrap}
      data={rows}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      ListEmptyComponent={<Text style={styles.empty}>Nenhuma avaliação ainda.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.stars}>{"★".repeat(item.nota)}</Text>
          <Text style={styles.meta}>
            {item.avaliador_nome} · {item.job_titulo}
          </Text>
          {item.comentario ? <Text style={styles.body}>{item.comentario}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", color: colors.soft, marginTop: 40 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stars: { color: "#F59E0B", fontWeight: "800" },
  meta: { fontSize: 12, color: colors.soft, marginTop: 4 },
  body: { marginTop: 8, color: colors.mid, lineHeight: 20 },
});
