import { useCollectionStore } from "@/store/useCollectionStore";
import { colors } from "@/theme";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CollectionScreen() {
  const cardCount = useCollectionStore((state) => state.cards.length);
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;

  // Responsive sizes
  const isSmallScreen = screenWidth < 400;
  const emojiFontSize = isSmallScreen ? 40 : 48;
  const titleFontSize = isSmallScreen ? 18 : 22;
  const subtitleFontSize = isSmallScreen ? 12 : 14;
  const countFontSize = isSmallScreen ? 28 : 32;
  const countLabelFontSize = isSmallScreen ? 11 : 12;
  const paddingHorizontal = isSmallScreen ? 20 : 32;

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal, paddingBottom: insets.bottom },
      ]}
    >
      <Text style={{ fontSize: emojiFontSize }}>📦</Text>
      <Text style={[styles.title, { fontSize: titleFontSize }]}>
        Minha Coleção
      </Text>
      <Text style={[styles.subtitle, { fontSize: subtitleFontSize }]}>
        Aqui você poderá gerenciar todas as cartas que possui.
      </Text>
      <View style={styles.card}>
        <Text style={[styles.count, { fontSize: countFontSize }]}>
          {cardCount}
        </Text>
        <Text style={[styles.countLabel, { fontSize: countLabelFontSize }]}>
          cartas na coleção
        </Text>
      </View>
      <Text style={[styles.coming, { fontSize: countLabelFontSize }]}>
        🚧 Em desenvolvimento — Em breve!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 16,
  },
  title: {
    color: colors.text.primary,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.background.elevated,
    alignItems: "center",
  },
  count: {
    color: colors.accent[400],
    fontWeight: "800",
    textAlign: "center",
  },
  countLabel: {
    color: colors.text.muted,
    textAlign: "center",
  },
  coming: {
    color: colors.text.muted,
    textAlign: "center",
    marginTop: 16,
  },
});
