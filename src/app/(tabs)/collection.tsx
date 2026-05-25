import { useCollectionStore } from "@/store/useCollectionStore";
import { useAppTheme, useStyles } from "@/theme";
import { getCollectionById } from "@/lib/collections";
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CardItem } from "@/features/cards/components/CardItem";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { useMemo, useState } from "react";

type DisplayMode = "all" | "bySet" | "recent";

const displayOptions: Array<{ key: DisplayMode; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "bySet", label: "Por coleção" },
  { key: "recent", label: "Recentes" },
];

export default function CollectionScreen() {
  const router = useRouter();
  const authUserId = useAuthStore((s) => s.userId);

  const allCards = useCollectionStore((state) => state.cards);
  const cards = allCards.filter((c) => (c.ownerId ?? null) === (authUserId ?? null));
  const [displayMode, setDisplayMode] = useState<DisplayMode>("all");

  const cardCount = cards.length;
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const styles = useStyles(stylesFactory);

  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => a.name.localeCompare(b.name)),
    [cards],
  );

  const recentCards = useMemo(
    () =>
      [...cards].sort(
        (a, b) =>
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
      ),
    [cards],
  );

  const cardsBySet = useMemo(() => {
    const groups = cards.reduce<Record<string, typeof cards>>((acc, card) => {
      const groupKey = card.setId ?? "unknown";
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(card);
      return acc;
    }, {});

    return Object.entries(groups)
      .map(([setId, groupCards]) => ({
        setId,
        name: getCollectionById(setId)?.name ?? setId,
        cards: groupCards,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cards]);

  const displayedCards =
    displayMode === "recent" ? recentCards : sortedCards;

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
      <View style={styles.headerContainer}>
        <Text style={{ fontSize: emojiFontSize }}>📦</Text>
        <Text style={[styles.title, { fontSize: titleFontSize }]}>Minha Coleção</Text>
        <Text style={[styles.subtitle, { fontSize: subtitleFontSize }]}>Aqui você poderá gerenciar todas as cartas que possui.</Text>
        <View style={styles.card}>
          <Text style={[styles.count, { fontSize: countFontSize }]}>{cardCount}</Text>
          <Text style={[styles.countLabel, { fontSize: countLabelFontSize }]}>cartas na coleção</Text>
        </View>
      </View>

      {cardCount > 0 && (
        <View style={styles.modeContainer}>
          <Text style={styles.modeLabel}>Modo de exibição</Text>
          <View style={styles.modeRow}>
            {displayOptions.map((option) => {
              const active = displayMode === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.modeButton,
                    active && styles.modeButtonActive,
                  ]}
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
        <Text style={[styles.coming, { fontSize: countLabelFontSize }]}>🚧 Nenhuma carta adicionada — vá ao Catálogo para adicionar.</Text>
      ) : displayMode === "bySet" ? (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {cardsBySet.map((group) => (
            <View key={group.setId} style={styles.groupSection}>
              <Text style={styles.groupTitle}>
                {group.name} ({group.cards.length})
              </Text>
              <View style={styles.groupGrid}>
                {group.cards.map((item) => (
                  <View key={item.id} style={styles.listItem}>
                    <CardItem
                      id={item.id}
                      name={item.name}
                      localId={(item.id.split("-")[1]) ?? item.id}
                      image={item.imageUrl ?? null}
                      isInCollection={true}
                      onPress={(id) =>
                        router.push({ pathname: "/card/[id]", params: { id } })
                      }
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            style={{ flex: 1, width: "100%" }}
            data={displayedCards}
            keyExtractor={(item) => item.id}
            numColumns={screenWidth > 600 ? 3 : 2}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <CardItem
                  id={item.id}
                  name={item.name}
                  localId={(item.id.split("-")[1]) ?? item.id}
                  image={item.imageUrl ?? null}
                  isInCollection={true}
                  onPress={(id) =>
                    router.push({ pathname: "/card/[id]", params: { id } })
                  }
                />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            columnWrapperStyle={styles.columnWrapper}
          />
        </View>
      )}
    </View>
  );
}

const stylesFactory = (colors: any) => StyleSheet.create({
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
  listItem: {
    flex: 1,
    minWidth: 150,
    margin: 6,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  modeContainer: {
    width: "100%",
    gap: 8,
    marginBottom: 12,
  },
  modeLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  modeRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
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
    color: colors.text.primary,
  },
  groupSection: {
    width: "100%",
    marginBottom: 24,
  },
  groupTitle: {
    color: colors.text.primary,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 12,
  },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  headerContainer: {
    alignItems: "center",
    width: "100%",
    paddingTop: 8,
    paddingBottom: 12,
  },
  listContainer: {
    flex: 1,
    width: "100%",
  },
});
