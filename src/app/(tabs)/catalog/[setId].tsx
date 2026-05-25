import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useLayoutEffect } from "react";
import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";

import { CardGrid, useSetCards } from "@/features/cards";
import { getCollectionById, isSupportedSetId } from "@/lib/collections";
import { formatCollectionProgress } from "@/lib/formatCollectionProgress";
import { useCollectionStore } from "@/store/useCollectionStore";
import { colors } from "@/theme";

const androidTextFix =
  Platform.OS === "android"
    ? ({ includeFontPadding: false, textAlignVertical: "center" } as const)
    : {};

function CatalogHeaderTitle({
  title,
  progress,
  compact,
}: {
  title: string;
  progress: string;
  compact: boolean;
}) {
  const titleSize = compact ? 16 : 17;
  const progressSize = compact ? 11 : 12;
  const lineHeight = compact ? 20 : 22;

  return (
    <View style={headerStyles.row}>
      <Text
        style={[
          headerStyles.title,
          androidTextFix,
          { fontSize: titleSize, lineHeight },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={headerStyles.progressBadge}>
        <Text
          style={[
            headerStyles.progress,
            androidTextFix,
            { fontSize: progressSize, lineHeight: progressSize + 4 },
          ]}
        >
          {progress}
        </Text>
      </View>
    </View>
  );
}

export default function SetCatalogScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const collection = getCollectionById(setId);

  const validSetId = setId && isSupportedSetId(setId) ? setId : null;

  const ownedCount = useCollectionStore((state) =>
    validSetId ? state.getSetCardCount(validSetId) : 0,
  );

  const {
    data: setData,
    isLoading,
    isRefetching,
    refetch,
  } = useSetCards(validSetId ?? "");

  const cards = setData?.cards ?? [];
  const totalCards = setData?.cardCount?.total ?? cards.length;
  const progressLabel = formatCollectionProgress(ownedCount, totalCards);
  const isSmallScreen = Dimensions.get("window").width < 400;

  useLayoutEffect(() => {
    const title = collection?.name ?? "Catálogo";
    navigation.setOptions({
      headerTitle: () => (
        <CatalogHeaderTitle
          title={title}
          progress={progressLabel}
          compact={isSmallScreen}
        />
      ),
    });
  }, [navigation, collection?.name, progressLabel, isSmallScreen]);

  const handleCardPress = useCallback(
    (cardId: string) => {
      router.push(`/card/${cardId}` as any);
    },
    [router],
  );

  if (!validSetId || !collection) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Coleção não encontrada</Text>
      </View>
    );
  }

  if (!isLoading && cards.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.unavailableTitle}>{collection.name}</Text>
        <Text style={styles.unavailableText}>
          O catálogo desta expansão ainda não está disponível. Em breve você
          poderá explorar todas as cartas por aqui.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.primary,
    padding: 24,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: "center",
  },
  unavailableTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  unavailableText: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    height: Platform.OS === "android" ? 48 : 44,
    maxWidth: Dimensions.get("window").width - 108,
    paddingRight: 4,
  },
  title: {
    color: colors.text.primary,
    fontWeight: "700",
    flexShrink: 1,
  },
  progressBadge: {
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  progress: {
    color: colors.accent[400],
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
