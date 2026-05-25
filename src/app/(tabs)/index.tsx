import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CardGrid, useSetCards } from "@/features/cards";
import { SUPPORTED_SETS } from "@/lib/tcgdex";
import { colors } from "@/theme";

export default function CatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;

  // Responsive font sizes
  const isSmallScreen = screenWidth < 400;
  const headerFontSize = isSmallScreen ? 14 : 16;
  const countFontSize = isSmallScreen ? 11 : 12;

  const {
    data: setData,
    isLoading,
    isRefetching,
    refetch,
  } = useSetCards(SUPPORTED_SETS.FOGO_FANTASMAGORICO);

  const handleCardPress = useCallback(
    (cardId: string) => {
      router.push(`/card/${cardId}` as any);
    },
    [router],
  );

  const cards = setData?.cards ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Set Info Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerText, { fontSize: headerFontSize }]}>
            Megaevolução — Fogo Fantasmagórico
          </Text>
          <Text style={[styles.cardCount, { fontSize: countFontSize }]}>
            {cards.length} cartas
          </Text>
        </View>
      </View>

      {/* Cards Grid */}
      <CardGrid
        cards={cards}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onRefresh={refetch}
        onCardPress={handleCardPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.elevated,
  },
  headerContent: {
    gap: 4,
  },
  headerText: {
    color: colors.text.primary,
    fontWeight: "600",
  },
  cardCount: {
    color: colors.accent[400],
    fontWeight: "500",
  },
});
