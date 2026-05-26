import { getEnergyIconSource } from "@/lib/energyIcons";
import { useAppTheme } from "@/theme";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

type EnergyIconProps = {
  type: string;
  size?: number;
};

/** Ícone de tipo/energia a partir de assets/images/energy/ */
export function EnergyIcon({ type, size = 22 }: EnergyIconProps) {
  const { colors } = useAppTheme();
  const source = getEnergyIconSource(type);

  if (source) {
    return (
      <Image
        source={source}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel={type}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.background.elevated,
        },
      ]}
    >
      <Text
        style={[
          styles.fallbackText,
          {
            fontSize: Math.max(8, size * 0.38),
            color: colors.text.muted,
          },
        ]}
        numberOfLines={1}
      >
        {type.slice(0, 2)}
      </Text>
    </View>
  );
}

type EnergyIconRowProps = {
  types: string[];
  size?: number;
  gap?: number;
};

export function EnergyIconRow({ types, size = 22, gap = 4 }: EnergyIconRowProps) {
  if (!types.length) return null;

  return (
    <View style={[styles.row, { gap }]}>
      {types.map((type, index) => (
        <EnergyIcon key={`${type}-${index}`} type={type} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
