import { useAppTheme, useStyles } from "@/theme";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TradesScreen() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const styles = useStyles(stylesFactory);

  // Responsive sizes
  const isSmallScreen = screenWidth < 400;
  const emojiFontSize = isSmallScreen ? 40 : 48;
  const titleFontSize = isSmallScreen ? 18 : 22;
  const subtitleFontSize = isSmallScreen ? 12 : 14;
  const cardTitleFontSize = isSmallScreen ? 12 : 14;
  const featuresFontSize = isSmallScreen ? 11 : 12;
  const paddingHorizontal = isSmallScreen ? 20 : 32;

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal, paddingBottom: insets.bottom },
      ]}
    >
      <Text style={{ fontSize: emojiFontSize }}>🔄</Text>
      <Text style={[styles.title, { fontSize: titleFontSize }]}>Trocas</Text>
      <Text style={[styles.subtitle, { fontSize: subtitleFontSize }]}>
        Encontre outros jogadores e troque cartas Pokémon TCG. Negocie
        diretamente e construa o deck dos seus sonhos!
      </Text>
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { fontSize: cardTitleFontSize }]}>
          🔜 Funcionalidades planejadas
        </Text>
        <Text style={[styles.features, { fontSize: featuresFontSize }]}>
          • Publicar cartas para troca{"\n"}• Buscar cartas disponíveis{"\n"}•
          Chat com outros jogadores{"\n"}• Sistema de avaliação
        </Text>
      </View>
      <Text style={[styles.coming, { fontSize: featuresFontSize }]}>
        🚧 Em desenvolvimento — Em breve!
      </Text>
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
    gap: 8,
    alignItems: "center",
  },
  cardTitle: {
    color: colors.text.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  features: {
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  coming: {
    color: colors.text.muted,
    textAlign: "center",
    marginTop: 16,
  },
});
