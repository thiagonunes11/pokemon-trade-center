import { useRouter, useNavigation } from "expo-router";
import { useCallback, useLayoutEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CollectionPickerCard, useCollections } from "@/features/sets";
import { useOwnedCountsBySet } from "@/hooks/useOwnedSetCount";
import {
  COLLECTIONS,
  getCollectionAvailability,
  isCollectionOpenable,
} from "@/lib/collections";
import { useAppTheme, useStyles } from "@/theme";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function CollectionsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const setQueries = useCollections();
  const ownedCountsBySet = useOwnedCountsBySet();
  const { colors } = useAppTheme();
  const styles = useStyles(stylesFactory);

  const isLoading = setQueries.some((q) => q.isLoading);
  const hasError = setQueries.some((q) => q.isError);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <ThemeToggle />,
    });
  }, [navigation]);

  const handleSelectCollection = useCallback(
    (setId: string, canOpen: boolean) => {
      if (!canOpen) return;
      router.push({ pathname: "/catalog/[setId]", params: { setId } });
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
          const apiCardCount = query.data?.cards?.length;
          const totalCards =
            query.data?.cardCount?.total ?? apiCardCount ?? undefined;
          const ownedCount = ownedCountsBySet[collection.id] ?? 0;
          const availability = getCollectionAvailability(
            apiCardCount,
            query.isLoading,
          );
          const canOpen = isCollectionOpenable(availability);

          return (
            <CollectionPickerCard
              key={collection.id}
              collection={collection}
              ownedCount={ownedCount}
              totalCards={totalCards}
              availability={availability}
              onPress={() => handleSelectCollection(collection.id, canOpen)}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

const stylesFactory = (colors: any) => StyleSheet.create({
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
