import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";
import { ONBOARDING_STEPS } from "../constants/empregado";

type Props = {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  secondaryAction?: { label: string; onPress: () => void };
};

export function OnboardingShell({
  step,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continuar",
  nextDisabled,
  secondaryAction,
}: Props) {
  const pct = Math.round((step / ONBOARDING_STEPS) * 100);
  return (
    <View style={styles.wrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.step}>
        Passo {step} de {ONBOARDING_STEPS}
      </Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
      <View style={styles.footer}>
        {secondaryAction ? (
          <Pressable onPress={secondaryAction.onPress} style={styles.secondary}>
            <Text style={styles.secondaryText}>{secondaryAction.label}</Text>
          </Pressable>
        ) : null}
        <View style={styles.row}>
          {onBack ? (
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>Voltar</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <Pressable
            onPress={onNext}
            disabled={nextDisabled}
            style={[styles.nextBtn, nextDisabled && styles.nextDisabled]}
          >
            <Text style={styles.nextText}>{nextLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, paddingBottom: 12 },
  progressTrack: {
    height: 6,
    backgroundColor: colors.line,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: { height: "100%", backgroundColor: colors.green },
  step: { fontSize: 11, fontWeight: "700", color: colors.soft, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark },
  sub: { color: colors.soft, marginTop: 6, marginBottom: 12, lineHeight: 20 },
  body: { flex: 1, marginTop: 8 },
  footer: { gap: 10, paddingTop: 8 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  backBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  backText: { fontWeight: "700", color: colors.mid },
  nextBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: colors.green,
  },
  nextDisabled: { opacity: 0.45 },
  nextText: { fontWeight: "800", color: "#fff" },
  secondary: { alignItems: "center", paddingVertical: 8 },
  secondaryText: { color: colors.primary, fontWeight: "700" },
});
