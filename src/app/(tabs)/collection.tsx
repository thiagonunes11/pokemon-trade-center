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
import Animated, {
  type EntryExitAnimationFunction,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GRID_COLUMNS = 4;
const FAB_SIZE = 52;
const FAB_MENU_GAP = 6;
const FILTER_EMERGE_OFFSET = 8;

const filterMenuEntering: EntryExitAnimationFunction = () => {
  "worklet";
  return {
    initialValues: {
      opacity: 0,
      transform: [{ translateY: FILTER_EMERGE_OFFSET }],
    },
    animations: {
      opacity: withTiming(1, { duration: 150 }),
      transform: [{ translateY: withTiming(0, { duration: 150 }) }],
    },
  };
};

const filterMenuExiting: EntryExitAnimationFunction = () => {
  "worklet";
  return {
    initialValues: {
      opacity: 1,
      transform: [{ translateY: 0 }],
    },
    animations: {
      opacity: withTiming(0, { duration: 120 }),
      transform: [
        { translateY: withTiming(FILTER_EMERGE_OFFSET, { duration: 120 }) },
      ],
    },
  };
};

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

function getDisplayModeLabel(mode: DisplayMode): string {
  return displayOptions.find((o) => o.key === mode)?.label ?? "Todas";
}

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
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
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

  const selectDisplayMode = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
    setFilterMenuOpen(false);
  }, []);

  const toggleFilterMenu = useCallback(() => {
    setFilterMenuOpen((open) => !open);
  }, []);

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

  const fabBottom = insets.bottom + 16;
  const listBottomPadding = fabBottom + FAB_SIZE + 12;

  return (
    <View style={styles.container}>
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
            {
              paddingTop: 8,
              paddingBottom: listBottomPadding,
              paddingHorizontal: H_PADDING,
            },
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
              paddingTop: 8,
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
        <View style={[styles.fabAnchor, { bottom: fabBottom }]}>
          {filterMenuOpen && (
            <Animated.View
              entering={filterMenuEntering}
              exiting={filterMenuExiting}
              style={[
                styles.filterMenu,
                { bottom: FAB_SIZE + FAB_MENU_GAP },
              ]}
            >
              {displayOptions.map((option) => {
                const active = displayMode === option.key;
                return (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.filterMenuOption,
                      active && styles.filterMenuOptionActive,
                    ]}
                    onPress={() => selectDisplayMode(option.key)}
                  >
                    <Text
                      style={[
                        styles.filterMenuOptionText,
                        active && styles.filterMenuOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.floatingBadge,
              pressed && styles.floatingBadgePressed,
            ]}
            onPress={toggleFilterMenu}
            accessibilityRole="button"
            accessibilityLabel={`${cardCount} cartas. Filtro: ${getDisplayModeLabel(displayMode)}.`}
            accessibilityState={{ expanded: filterMenuOpen }}
          >
            <Text style={styles.count}>{cardCount}</Text>
          </Pressable>
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
    fabAnchor: {
      position: "absolute",
      right: 12,
      width: FAB_SIZE,
      height: FAB_SIZE,
      zIndex: 20,
    },
    filterMenu: {
      position: "absolute",
      right: 0,
      minWidth: 132,
      padding: 4,
      borderRadius: 12,
      backgroundColor: colors.background.card,
      borderWidth: 1,
      borderColor: colors.background.elevated,
      gap: 2,
      elevation: 4,
      zIndex: 1,
    },
    filterMenuOption: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    filterMenuOptionActive: {
      backgroundColor: colors.primary[600],
    },
    filterMenuOptionText: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    filterMenuOptionTextActive: {
      color: colors.text.onPrimary ?? "#fff",
    },
    floatingBadge: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      backgroundColor: colors.primary[600],
      borderWidth: 1,
      borderColor: colors.background.elevated,
      alignItems: "center",
      justifyContent: "center",
      elevation: 8,
      zIndex: 2,
    },
    floatingBadgePressed: {
      opacity: 0.9,
    },
    count: {
      color: colors.text.onPrimary ?? "#fff",
      fontWeight: "800",
      fontSize: 18,
    },
  });
