import { useStyles } from "@/theme";
import { Image } from "expo-image";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

interface CardItemProps {
  id: string;
  name: string;
  localId: string;
  image: string | null;
  rarity?: string;
  isInCollection?: boolean;
  onPress: (id: string) => void;
}

function CardItemComponent({
  id,
  name,
  localId,
  image,
  rarity,
  isInCollection = false,
  onPress,
}: CardItemProps) {
  const screenWidth = Dimensions.get("window").width;
  const styles = useStyles(stylesFactory);

  const isSmallScreen = screenWidth < 400;
  const isMediumScreen = screenWidth < 600;

  const nameFontSize = isSmallScreen ? 11 : isMediumScreen ? 12 : 13;
  const localIdFontSize = isSmallScreen ? 9 : isMediumScreen ? 10 : 11;

  // Accept either a base image URL (e.g. '.../image') or a full URL
  // that already includes the size suffix (e.g. '.../image/high.webp' or '.../image/high.png').
  let imageUrl: string | null = null;
  if (image) {
    const lower = image.toLowerCase();
    if (lower.endsWith("/high.webp") || lower.endsWith("/high.png")) {
      imageUrl = image;
    } else {
      imageUrl = `${image}/high.webp`;
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => onPress(id)}
      android_ripple={{ color: "rgba(255,255,255,0.12)" }}
    >
      <View style={[styles.card, isInCollection && styles.cardInCollection]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            contentFit="contain"
            transition={300}
          />
        ) : (
          <View style={[styles.cardImage, styles.noImage]}>
            <Text style={styles.noImageText}>Sem imagem</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text
            style={[styles.name, { fontSize: nameFontSize }]}
            numberOfLines={2}
          >
            {name}
          </Text>
          <View style={styles.meta}>
            <Text style={[styles.localId, { fontSize: localIdFontSize }]}>
              #{localId}
            </Text>
            {rarity && (
              <Text style={[styles.rarity, { fontSize: localIdFontSize }]}>
                {rarity}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const CardItem = CardItemComponent;

const stylesFactory = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    margin: 5,
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.background.elevated,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardInCollection: {
    borderColor: colors.primary[400],
    borderWidth: 2,
    backgroundColor: colors.primary[950],
    shadowColor: colors.primary[400],
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 0.715,
  },
  noImage: {
    backgroundColor: colors.background.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: {
    color: colors.text.muted,
    fontSize: 11,
  },
  info: {
    padding: 8,
    gap: 4,
  },
  name: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  localId: {
    color: colors.text.muted,
    fontSize: 10,
  },
  rarity: {
    color: colors.accent[400],
    fontSize: 9,
    fontWeight: "500",
  },
});
