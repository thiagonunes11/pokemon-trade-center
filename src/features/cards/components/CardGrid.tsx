import { colors } from "@/theme";
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CardItem } from "./CardItem";

interface CardBrief {
  id: string;
  localId: string;
  name: string;
  image?: string | null;
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

  // Responsive number of columns based on screen width
  const numColumns = screenWidth > 600 ? 3 : 2;

  const renderItem = useCallback(
    ({ item, index }: { item: CardBrief; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 50, 500)).springify()}
        style={styles.itemWrapper}
      >
        <CardItem
          id={item.id}
          name={item.name}
          localId={item.localId}
          image={item.image ?? null}
          onPress={onCardPress}
        />
      </Animated.View>
    ),
    [onCardPress],
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

const styles = StyleSheet.create({
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
