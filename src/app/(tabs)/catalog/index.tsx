import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CollectionPickerCard, useCollections } from "@/features/sets";
import {
  COLLECTIONS,
  getCollectionAvailability,
  isCollectionOpenable,
} from "@/lib/collections";
import { colors } from "@/theme";

export default function CollectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setQueries = useCollections();

  const isLoading = setQueries.some((q) => q.isLoading);
  const hasError = setQueries.some((q) => q.isError);

  const handleSelectCollection = useCallback(
    (setId: string, canOpen: boolean) => {
      if (!canOpen) return;
      router.push(`/catalog/${setId}`);
    },
    [router],
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        Escolha uma expansão para ver o catálogo de cartas e adicionar à sua
        coleção.
      </Text>

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary[400]} />
          <Text style={styles.loadingText}>Atualizando coleções...</Text>
        </View>
      )}

      {hasError && !isLoading && (
        <Text style={styles.warningText}>
          Não foi possível carregar a contagem de cartas. Você ainda pode abrir
          as coleções abaixo.
        </Text>
      )}

      <View style={styles.list}>
        {COLLECTIONS.map((collection, index) => {
          const query = setQueries[index];
          const cardCount = query.data?.cards?.length;
          const availability = getCollectionAvailability(
            cardCount,
            query.isLoading,
          );
          const canOpen = isCollectionOpenable(availability);

          return (
            <CollectionPickerCard
              key={collection.id}
              collection={collection}
              cardCount={cardCount}
              availability={availability}
              onPress={() => handleSelectCollection(collection.id, canOpen)}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  intro: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: colors.text.muted,
    fontSize: 13,
  },
  warningText: {
    color: colors.warning,
    fontSize: 13,
    lineHeight: 18,
  },
  list: {
    gap: 14,
  },
});
