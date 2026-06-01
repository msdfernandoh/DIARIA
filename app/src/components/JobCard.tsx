import { Pressable, StyleSheet, Text, View } from "react-native";
import type { JobRow } from "../types/job";
import { colors } from "../constants/theme";

type Props = {
  job: JobRow;
  onPress: () => void;
  highlightGrupo?: boolean;
};

export function JobCard({ job, onPress, highlightGrupo }: Props) {
  const patrocinado = job.destaque_nivel && job.destaque_nivel !== "organico";
  const valor =
    job.valor != null
      ? `R$ ${Number(job.valor).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
      : "A combinar";

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, highlightGrupo && styles.cardGrupo]}
    >
      {patrocinado ? <Text style={styles.sponsored}>Patrocinado</Text> : null}
      <Text style={styles.title} numberOfLines={2}>
        {job.titulo}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {job.empregador_nome ?? "Contratante"} · {job.cidade ?? "Remoto"}
        {job.distancia_km != null ? ` · ${job.distancia_km.toFixed(1)} km` : ""}
      </Text>
      <View style={styles.row}>
        <Text style={styles.valor}>{valor}</Text>
        <View style={styles.badges}>
          {job.urgente ? <Text style={styles.urgente}>Urgente</Text> : null}
          {job.formato === "remoto" ? <Text style={styles.remote}>Home Office</Text> : null}
          {job.recorrente ? <Text style={styles.rec}>Recorrente</Text> : null}
        </View>
      </View>
      <Text style={styles.stars}>★ 5.0 · avaliações em breve</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardGrupo: { borderLeftWidth: 3, borderLeftColor: colors.green },
  sponsored: { fontSize: 9, color: colors.soft, opacity: 0.7, marginBottom: 4 },
  title: { fontWeight: "800", color: colors.dark, fontSize: 15, marginBottom: 4 },
  meta: { fontSize: 12, color: colors.soft, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  valor: { fontWeight: "800", color: colors.green, fontSize: 16 },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" },
  urgente: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  remote: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rec: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7C3AED",
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stars: { marginTop: 8, fontSize: 11, color: colors.soft },
});
