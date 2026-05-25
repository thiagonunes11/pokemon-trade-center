import { colors } from "@/theme";
import { Tabs } from "expo-router";
import { Dimensions, Text } from "react-native";

export default function TabLayout() {
  const screenWidth = Dimensions.get("window").width;

  // Responsive tab bar height
  const isSmallScreen = screenWidth < 400;
  const tabBarHeight = isSmallScreen ? 60 : 65;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.background.elevated,
        },
        headerTitleStyle: {
          color: colors.text.primary,
          fontWeight: "700",
          fontSize: isSmallScreen ? 16 : 18,
        },
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.background.elevated,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: isSmallScreen ? 6 : 8,
          paddingTop: isSmallScreen ? 6 : 8,
        },
        tabBarActiveTintColor: colors.accent[500],
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontSize: isSmallScreen ? 10 : 11,
          fontWeight: "600",
          marginTop: isSmallScreen ? 2 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="catalog"
        options={{
          title: "Catálogo",
          headerShown: false,
          tabBarIcon: ({ size }) => (
            <Text style={{ fontSize: size - 4 }}>🃏</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: "Coleção",
          headerTitle: "📦 Minha Coleção",
          tabBarIcon: ({ size }) => (
            <Text style={{ fontSize: size - 4 }}>📦</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="trades"
        options={{
          title: "Trocas",
          headerTitle: "🔄 Trocas",
          tabBarIcon: ({ size }) => (
            <Text style={{ fontSize: size - 4 }}>🔄</Text>
          ),
        }}
      />
    </Tabs>
  );
}
