import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useLayoutEffect } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EnergyIconRow } from "@/components/EnergyIcon";
import { useCard } from "@/features/cards";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useAppTheme, useStyles } from "@/theme";
import type { ReactNode } from "react";

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: card, isLoading, error } = useCard(id);
  const addCard = useCollectionStore((s) => s.addCard);
  const removeCard = useCollectionStore((s) => s.removeCard);
  const isInCollection = useCollectionStore((s) =>
    s.cards.some((c) => c.id === id),
  );
  const { colors } = useAppTheme();
  const styles = useStyles(stylesFactory);

  // Update the stack header with the card name
  useLayoutEffect(() => {
    if (card?.name) {
      navigation.setOptions({
        headerTitle: card.name,
      });
    }
  }, [navigation, card?.name]);

  const handleToggleCollection = () => {
    if (!card) return;
    if (isInCollection) {
      removeCard(id);
    } else {
      addCard({
        id,
        name: card.name,
        imageUrl: card.image ? `${card.image}/high.webp` : null,
        setId: card.set?.id ?? id.split("-")[0],
      });
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <Text style={{ color: colors.text.secondary }}>
          Carregando carta...
        </Text>
      </View>
    );
  }

  if (error || !card) {
    return (
      <View
        style={[
          styles.centerContainer,
          {
            backgroundColor: colors.background.primary,
            paddingTop: insets.top + 32,
          },
        ]}
      >
        <Text
          style={{ color: colors.error, fontSize: 16, textAlign: "center" }}
        >
          Carta não encontrada
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: colors.primary[400] }}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const imageUrl = card.image ? `${card.image}/high.png` : null;
  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth < 400;
  const cardWidth = isSmallScreen ? 220 : 280;
  const cardHeight = cardWidth * (392 / 280); // Mantém aspect ratio

  return (
    <View style={styles.pageContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 12, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Image */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.imageContainer}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={[
                styles.cardImage,
                { width: cardWidth, height: cardHeight },
              ]}
              contentFit="contain"
              transition={400}
            />
          ) : (
            <View
              style={[
                styles.cardImage,
                styles.noImage,
                { width: cardWidth, height: cardHeight },
              ]}
            >
              <Text style={{ color: colors.text.muted }}>
                Sem imagem disponível
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Card Info */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <View
            style={[
              styles.infoContainer,
              { paddingHorizontal: isSmallScreen ? 16 : 20 },
            ]}
          >
            {/* Name and ID */}
            <View style={{ gap: 4 }}>
              <Text
                style={[styles.cardName, { fontSize: isSmallScreen ? 20 : 26 }]}
              >
                {card.name}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.cardId}>#{card.localId}</Text>
                {card.rarity && (
                  <>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.rarity}>{card.rarity}</Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.separator} />

            {/* Details */}
            <View style={{ gap: 12 }}>
              {card.hp && <DetailRow label="HP" value={String(card.hp)} />}
              {card.types && card.types.length > 0 && (
                <DetailRow label="Tipo">
                  <EnergyIconRow types={card.types} size={24} />
                </DetailRow>
              )}
              {card.illustrator && (
                <DetailRow label="Ilustrador" value={card.illustrator} />
              )}
              {card.rarity && (
                <DetailRow label="Raridade" value={card.rarity} />
              )}
              {card.category && (
                <DetailRow label="Categoria" value={card.category} />
              )}
              {card.stage && <DetailRow label="Estágio" value={card.stage} />}
            </View>

            {/* Attacks */}
            {card.attacks && card.attacks.length > 0 && (
              <>
                <View style={styles.separator} />
                <View style={{ gap: 12 }}>
                  <Text style={styles.sectionTitle}>Ataques</Text>
                  {card.attacks.map((attack: any, index: number) => (
                    <View key={index} style={styles.attackCard}>
                      <View style={styles.attackHeader}>
                        <Text style={styles.attackName}>{attack.name}</Text>
                        {attack.damage && (
                          <Text style={styles.attackDamage}>
                            {attack.damage}
                          </Text>
                        )}
                      </View>
                      {attack.effect && (
                        <Text style={styles.attackEffect}>{attack.effect}</Text>
                      )}
                      {attack.cost && attack.cost.length > 0 && (
                        <View style={styles.attackCostRow}>
                          <Text style={styles.attackCostLabel}>Custo</Text>
                          <EnergyIconRow types={attack.cost} size={20} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Weaknesses and Resistances */}
            {(card.weaknesses || card.resistances) && (
              <>
                <View style={styles.separator} />
                <View style={{ flexDirection: "row", gap: 16 }}>
                  {card.weaknesses && card.weaknesses.length > 0 && (
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.weakLabel}>Fraqueza</Text>
                      {card.weaknesses.map((w: any, i: number) => (
                        <View key={i} style={styles.typeEffectRow}>
                          <EnergyIconRow types={[w.type]} size={20} />
                          <Text style={styles.weakValue}>{w.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {card.resistances && card.resistances.length > 0 && (
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.weakLabel}>Resistência</Text>
                      {card.resistances.map((r: any, i: number) => (
                        <View key={i} style={styles.typeEffectRow}>
                          <EnergyIconRow types={[r.type]} size={20} />
                          <Text style={styles.resistValue}>{r.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            <View style={styles.separator} />

            {/* Action Buttons */}
            <View style={{ gap: 12, marginTop: 8 }}>
              <Pressable
                onPress={handleToggleCollection}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isInCollection
                      ? colors.background.card
                      : colors.primary[700],
                    borderColor: isInCollection
                      ? colors.error
                      : colors.primary[600],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    {
                      color: isInCollection
                        ? colors.error
                        : colors.text.primary,
                    },
                  ]}
                >
                  {isInCollection
                    ? "✕ Remover da Coleção"
                    : "+ Adicionar à Coleção"}
                </Text>
              </Pressable>

              {isInCollection && (
                <Pressable
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: "transparent",
                      borderColor: colors.accent[500],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: colors.accent[500] },
                    ]}
                  >
                    🔄 Quero Trocar
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  const styles = useStyles(stylesFactory);
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {children ?? (
        <Text style={styles.detailValue}>{value}</Text>
      )}
    </View>
  );
}

const stylesFactory = (colors: any) =>
  StyleSheet.create({
    pageContainer: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },

    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollView: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollContent: {
      paddingTop: 16,
      paddingBottom: 40,
    },
    imageContainer: {
      alignItems: "center",
      paddingBottom: 8,
    },
    cardImage: {
      borderRadius: 12,
    },
    noImage: {
      backgroundColor: colors.background.card,
      alignItems: "center",
      justifyContent: "center",
    },
    backButton: {
      marginTop: 16,
      padding: 12,
    },
    infoContainer: {
      paddingVertical: 20,
      gap: 16,
    },
    cardName: {
      color: colors.text.primary,
      fontWeight: "800",
    },
    metaRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    cardId: {
      color: colors.text.muted,
      fontSize: 13,
    },
    metaDot: {
      color: colors.text.muted,
    },
    rarity: {
      color: colors.accent[400],
      fontSize: 13,
      fontWeight: "500",
    },
    separator: {
      height: 1,
      backgroundColor: colors.background.elevated,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    detailLabel: {
      color: colors.text.muted,
      fontSize: 13,
    },
    detailValue: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: "500",
    },
    sectionTitle: {
      color: colors.text.primary,
      fontSize: 18,
      fontWeight: "700",
    },
    attackCard: {
      backgroundColor: colors.background.card,
      borderRadius: 10,
      padding: 14,
      gap: 6,
      borderWidth: 1,
      borderColor: colors.background.elevated,
    },
    attackHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    attackName: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: "600",
    },
    attackDamage: {
      color: colors.accent[500],
      fontSize: 16,
      fontWeight: "800",
    },
    attackEffect: {
      color: colors.text.secondary,
      fontSize: 12,
      lineHeight: 18,
    },
    attackCostRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
    },
    attackCostLabel: {
      color: colors.text.muted,
      fontSize: 11,
    },
    typeEffectRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    weakLabel: {
      color: colors.text.muted,
      fontSize: 12,
    },
    weakValue: {
      color: colors.error,
      fontSize: 14,
      fontWeight: "600",
    },
    resistValue: {
      color: colors.success,
      fontSize: 14,
      fontWeight: "600",
    },
    actionButton: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      alignItems: "center",
    },
    actionButtonText: {
      fontSize: 15,
      fontWeight: "700",
      textAlign: "center",
    },
  });
