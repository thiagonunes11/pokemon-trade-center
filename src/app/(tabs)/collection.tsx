import { CardItem } from "@/features/cards/components/CardItem";
import { getCollectionById } from "@/lib/collections";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useStyles } from "@/theme";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GRID_COLUMNS = 4;
const GRID_GAP = 4;
const H_PADDING = 6;
const CARD_ASPECT = 0.715;

type DisplayMode = "all" | "bySet";

type CollectionCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
  ownerId?: string | null;
  addedAt: Date;
};

const displayOptions: Array<{ key: DisplayMode; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "bySet", label: "Por coleção" },
];

export default function CollectionScreen() {
  const router = useRouter();
  const authUserId = useAuthStore((s) => s.userId);
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useStyles(stylesFactory);

  const allCards = useCollectionStore((state) => state.cards);
  const cards = useMemo(
    () =>
      allCards.filter(
        (c) => (c.ownerId ?? null) === (authUserId ?? null),
      ),
    [allCards, authUserId],
  );

  const [displayMode, setDisplayMode] = useState<DisplayMode>("all");
  const cardCount = cards.length;

  const { cellWidth, cellHeight } = useMemo(() => {
    const availableWidth = screenWidth - H_PADDING * 2;
    const width =
      (availableWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
    return {
      cellWidth: width,
      cellHeight: width / CARD_ASPECT,
    };
  }, [screenWidth]);

  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => a.name.localeCompare(b.name)),
    [cards],
  );

  const cardsBySet = useMemo(() => {
    const groups = cards.reduce<Record<string, CollectionCard[]>>(
      (acc, card) => {
        const groupKey = card.setId ?? "unknown";
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(card);
        return acc;
      },
      {},
    );

    return Object.entries(groups)
      .map(([setId, groupCards]) => ({
        setId,
        name: getCollectionById(setId)?.name ?? setId,
        cards: [...groupCards].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cards]);

  const openCard = useCallback(
    (id: string) => {
      router.push({ pathname: "/card/[id]", params: { id } });
    },
    [router],
  );

  const renderGridCard = useCallback(
    (item: CollectionCard) => (
      <View
        style={[
          styles.gridCell,
          { width: cellWidth, height: cellHeight },
        ]}
      >
        <CardItem
          id={item.id}
          name={item.name}
          localId={item.id.split("-")[1] ?? item.id}
          image={item.imageUrl ?? null}
          compact
          onPress={openCard}
        />
      </View>
    ),
    [cellWidth, cellHeight, openCard, styles.gridCell],
  );

  const renderFlatListItem: ListRenderItem<CollectionCard> = useCallback(
    ({ item }) => renderGridCard(item),
    [renderGridCard],
  );

  const listBottomPadding = insets.bottom + 88;

  return (
    <View style={styles.container}>
      {cardCount > 0 && (
        <View style={[styles.modeContainer, { paddingHorizontal: H_PADDING }]}>
          <View style={styles.modeRow}>
            {displayOptions.map((option) => {
              const active = displayMode === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.modeButton, active && styles.modeButtonActive]}
                  onPress={() => setDisplayMode(option.key)}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      active && styles.modeButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {cardCount === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.coming}>
            Nenhuma carta adicionada — vá ao Catálogo para adicionar.
          </Text>
        </View>
      ) : displayMode === "bySet" ? (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: listBottomPadding, paddingHorizontal: H_PADDING },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {cardsBySet.map((group) => (
            <View key={group.setId} style={styles.groupSection}>
              <Text style={styles.groupTitle}>
                {group.name} ({group.cards.length})
              </Text>
              <View style={styles.groupGrid}>
                {group.cards.map((item) => (
                  <View key={item.id}>{renderGridCard(item)}</View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          style={styles.listContainer}
          data={sortedCards}
          keyExtractor={(item) => item.id}
          renderItem={renderFlatListItem}
          numColumns={GRID_COLUMNS}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: H_PADDING,
              paddingBottom: listBottomPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={16}
          maxToRenderPerBatch={16}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      {cardCount > 0 && (
        <View style={[styles.floatingBadge, { bottom: insets.bottom + 16 }]}>
          <Text style={styles.count}>{cardCount}</Text>
          <Text style={styles.countLabel}>
            {cardCount === 1 ? "carta" : "cartas"}
          </Text>
        </View>
      )}
    </View>
  );
}

const stylesFactory = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    modeContainer: {
      paddingTop: 8,
      paddingBottom: 8,
    },
    modeRow: {
      flexDirection: "row",
      gap: 8,
    },
    modeButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.background.elevated,
      backgroundColor: colors.background.card,
      alignItems: "center",
    },
    modeButtonActive: {
      backgroundColor: colors.primary[600],
      borderColor: colors.primary[600],
    },
    modeButtonText: {
      color: colors.text.primary,
      fontSize: 12,
      fontWeight: "700",
    },
    modeButtonTextActive: {
      color: colors.text.onPrimary ?? colors.text.primary,
    },
    listContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    columnWrapper: {
      gap: GRID_GAP,
      marginBottom: GRID_GAP,
    },
    gridCell: {
      overflow: "hidden",
    },
    groupSection: {
      marginBottom: 20,
    },
    groupTitle: {
      color: colors.text.primary,
      fontWeight: "700",
      fontSize: 14,
      marginBottom: 8,
    },
    groupGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: GRID_GAP,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    coming: {
      color: colors.text.muted,
      fontSize: 14,
      textAlign: "center",
    },
    floatingBadge: {
      position: "absolute",
      right: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.primary[600],
      borderWidth: 1,
      borderColor: colors.background.elevated,
      alignItems: "center",
      shadowColor: colors.shadow ?? "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 8,
    },
    count: {
      color: colors.text.onPrimary ?? "#fff",
      fontWeight: "800",
      fontSize: 22,
      textAlign: "center",
    },
    countLabel: {
      color: colors.text.muted,
      fontSize: 11,
      textAlign: "center",
    },
  });
