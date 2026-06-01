import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { RATING_TOPICS_EMPREGADO, RATING_TOPICS_EMPREGADOR } from "../constants/ratingTopics";
import { colors } from "../constants/theme";
import { fetchRatingSummary, type RatingSummary } from "../lib/ratings";

const TOPIC_LABEL: Record<string, string> = {};
[...RATING_TOPICS_EMPREGADO, ...RATING_TOPICS_EMPREGADOR].forEach((t) => {
  TOPIC_LABEL[t.id] = `${t.emoji} ${t.label}`;
});

type Props =
  | {
      userId: string;
      variant: "mini" | "full";
      accentColor?: string;
    }
  | {
      variant: "summary";
      nota: number | null;
      total: number;
      topTopics?: { tag: string; count: number }[];
      nome?: string;
    };

function starsText(nota: number | null, total: number) {
  if (nota == null || total === 0) return "Sem avaliações";
  return `★ ${nota.toFixed(1)} (${total})`;
}

function topicLabel(tag: string) {
  return TOPIC_LABEL[tag] ?? tag.replace(/_/g, " ");
}

export function RatingDisplay(props: Props) {
  if (props.variant === "summary") {
    const { nota, total, topTopics } = props;
    return (
      <View style={styles.summaryRow}>
        <Text style={styles.summaryStars}>{starsText(nota, total)}</Text>
        {topTopics?.slice(0, 2).map((t) => (
          <Text key={t.tag} style={styles.summaryChip}>
            {topicLabel(t.tag)}
          </Text>
        ))}
      </View>
    );
  }

  const { userId, variant, accentColor = colors.primary } = props;
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchRatingSummary(userId)
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <ActivityIndicator size="small" color={accentColor} />;
  }

  if (!summary || summary.total_avaliacoes === 0) {
    return <Text style={styles.muted}>Sem avaliações ainda</Text>;
  }

  if (variant === "mini") {
    return <Text style={styles.mini}>{starsText(summary.nota_media, summary.total_avaliacoes)}</Text>;
  }

  const total = summary.total_avaliacoes;
  return (
    <View style={styles.fullWrap}>
      <Text style={[styles.bigScore, { color: accentColor }]}>
        {summary.nota_media?.toFixed(1) ?? "—"}
      </Text>
      <Text style={styles.mini}>{starsText(summary.nota_media, total)}</Text>
      {([5, 4, 3, 2, 1] as const).map((star) => {
        const count = summary.distribuicao[star];
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <View key={star} style={styles.barRow}>
            <Text style={styles.barLabel}>{star}★</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: accentColor }]} />
            </View>
            <Text style={styles.barPct}>{pct}%</Text>
          </View>
        );
      })}
      {summary.topicos_mais_citados.length ? (
        <View style={styles.chips}>
          {summary.topicos_mais_citados.map((t) => (
            <Text key={t.tag} style={styles.chip}>
              {topicLabel(t.tag)} · {t.count}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  muted: { fontSize: 12, color: colors.soft },
  mini: { fontSize: 13, fontWeight: "700", color: colors.mid },
  fullWrap: { gap: 8 },
  bigScore: { fontSize: 40, fontWeight: "800" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 28, fontSize: 11, color: colors.soft, fontWeight: "700" },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.line,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
  barPct: { width: 36, fontSize: 11, color: colors.soft, textAlign: "right" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  chip: {
    fontSize: 11,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: colors.mid,
  },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
  summaryStars: { fontSize: 12, fontWeight: "700", color: colors.mid },
  summaryChip: { fontSize: 10, color: colors.soft },
});
