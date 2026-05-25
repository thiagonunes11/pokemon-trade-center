import { Stack } from "expo-router";
import { Dimensions } from "react-native";
import { useAppTheme } from "@/theme";

export default function CatalogStackLayout() {
  const { colors } = useAppTheme();
  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth < 400;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          color: colors.text.primary,
          fontWeight: "700",
          fontSize: isSmallScreen ? 16 : 18,
        },
        headerShadowVisible: false,
        headerBackTitle: "Coleções",
        contentStyle: { backgroundColor: colors.background.primary },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Coleções",
        }}
      />
      <Stack.Screen
        name="[setId]"
        options={{
          title: "Catálogo",
          headerTitleAlign: "left",
        }}
      />
    </Stack>
  );
}
