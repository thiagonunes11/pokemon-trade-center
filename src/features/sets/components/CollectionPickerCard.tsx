import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  CollectionAvailability,
  CollectionConfig,
} from "@/lib/collections";
import { formatCollectionProgress } from "@/lib/formatCollectionProgress";
import { colors } from "@/theme";

type CollectionPickerCardProps = {
  collection: CollectionConfig;
  ownedCount: number;
  totalCards?: number;
  availability: CollectionAvailability;
  onPress: () => void;
};

function getStatusLabel(
  collection: CollectionConfig,
  availability: CollectionAvailability,
  ownedCount: number,
  totalCards?: number,
): string {
  if (availability === "loading") return "Carregando...";
  if (availability === "unavailable") {
    return collection.unavailableMessage ?? "Em breve";
  }
  if (totalCards != null && totalCards > 0) {
    return formatCollectionProgress(ownedCount, totalCards);
  }
  return "Toque para abrir";
}

export function CollectionPickerCard({
  collection,
  ownedCount,
  totalCards,
  availability,
  onPress,
}: CollectionPickerCardProps) {
  const disabled = availability !== "available";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={
        disabled
          ? `${collection.name}, indisponível no momento`
          : `Abrir coleção ${collection.name}`
      }
    >
      <View style={[styles.logoContainer, disabled && styles.logoDisabled]}>
        <Image
          source={{ uri: collection.logoUrl }}
          style={[styles.logo, disabled && styles.logoImageDisabled]}
          contentFit="contain"
          transition={200}
        />
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, disabled && styles.textDisabled]}>
          {collection.name}
        </Text>
        <Text style={[styles.subtitle, disabled && styles.textDisabled]}>
          {collection.subtitle}
        </Text>
        <Text
          style={[
            styles.count,
            disabled && styles.countUnavailable,
            availability === "available" && styles.countAvailable,
          ]}
        >
          {getStatusLabel(collection, availability, ownedCount, totalCards)}
        </Text>
      </View>

      {!disabled && <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.background.elevated,
    padding: 16,
  },
  cardPressed: {
    borderColor: colors.primary[600],
    backgroundColor: colors.background.secondary,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  logoDisabled: {
    backgroundColor: colors.background.card,
  },
  logoImageDisabled: {
    opacity: 0.6,
  },
  textDisabled: {
    color: colors.text.muted,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  count: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  countAvailable: {
    color: colors.accent[400],
  },
  countUnavailable: {
    color: colors.text.muted,
  },
  chevron: {
    color: colors.text.muted,
    fontSize: 28,
    fontWeight: "300",
  },
});
