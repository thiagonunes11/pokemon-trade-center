import { useAppTheme, useStyles } from "@/theme";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCollectionStore } from "@/store/useCollectionStore";
import { CardItem } from "./CardItem";

export interface CardBrief {
  id: string;
  localId: string;
  name: string;
  image?: string | null;
  rarity?: string;
}

interface CardGridProps {
  cards: CardBrief[];
  isLoading: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
  onCardPress: (cardId: string) => void;
}

export function CardGrid({
  cards,
  isLoading,
  isRefetching,
  onRefresh,
  onCardPress,
}: CardGridProps) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const { colors } = useAppTheme();
  const styles = useStyles(stylesFactory);

  // Responsive number of columns based on screen width
  const numColumns = screenWidth > 600 ? 3 : 2;

  // Subscribe to collection changes to re-render when cards are added/removed
  const collectionCards = useCollectionStore((s) => s.cards);
  const hasCard = useCollectionStore((s) => s.hasCard);

  const renderItem = useCallback(
    ({ item }: { item: CardBrief }) => (
      <View style={styles.itemWrapper}>
        <CardItem
          id={item.id}
          name={item.name}
          localId={item.localId}
          image={item.image ?? null}
          rarity={item.rarity}
          isInCollection={hasCard(item.id)}
          onPress={onCardPress}
        />
      </View>
    ),
    [onCardPress, styles.itemWrapper, hasCard, collectionCards],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Carregando cartas...</Text>
      </View>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhuma carta encontrada</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={cards}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      extraData={collectionCards}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={5}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={80}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={[
        styles.gridContainer,
        { paddingBottom: 100 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
      scrollIndicatorInsets={{ right: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={colors.primary[600]}
          colors={[colors.primary[600]]}
          progressBackgroundColor={colors.background.secondary}
        />
      }
    />
  );
}

const stylesFactory = (colors: any) => StyleSheet.create({
  gridContainer: {
    padding: 10,
  },
  itemWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 16,
    textAlign: "center",
  },
});
