import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";

type Item = { id: string; label: string; emoji?: string };

type Props = {
  items: readonly Item[];
  selected: string[];
  onChange: (ids: string[]) => void;
  max?: number;
  accentColor?: string;
};

export function ChipSelect({ items, selected, onChange, max, accentColor = colors.green }: Props) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
      return;
    }
    if (max && selected.length >= max) return;
    onChange([...selected, id]);
  }

  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const on = selected.includes(item.id);
        return (
          <Pressable
            key={item.id}
            onPress={() => toggle(item.id)}
            style={[
              styles.chip,
              on && { borderColor: accentColor, backgroundColor: `${accentColor}18` },
            ]}
          >
            <Text style={[styles.chipText, on && { color: accentColor, fontWeight: "800" }]}>
              {item.emoji ? `${item.emoji} ` : ""}
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipOn: { borderColor: colors.green, backgroundColor: "#E1F5EE" },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.mid },
  chipTextOn: { color: colors.green, fontWeight: "800" },
});
