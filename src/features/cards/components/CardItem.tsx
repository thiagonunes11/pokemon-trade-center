import { colors } from "@/theme";
import { Image } from "expo-image";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface CardItemProps {
  id: string;
  name: string;
  localId: string;
  image: string | null;
  rarity?: string;
  onPress: (id: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CardItem({
  id,
  name,
  localId,
  image,
  rarity,
  onPress,
}: CardItemProps) {
  const scale = useSharedValue(1);
  const screenWidth = Dimensions.get("window").width;

  // Responsive font sizes
  const isSmallScreen = screenWidth < 400;
  const isMediumScreen = screenWidth < 600;

  const nameFontSize = isSmallScreen ? 11 : isMediumScreen ? 12 : 13;
  const localIdFontSize = isSmallScreen ? 9 : isMediumScreen ? 10 : 11;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const imageUrl = image ? `${image}/high.webp` : null;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPress={() => onPress(id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.card}>
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
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 5,
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
