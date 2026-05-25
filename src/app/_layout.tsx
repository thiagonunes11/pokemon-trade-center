import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider } from "tamagui";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";

// Initialize storage polyfill for React Native
import "@/lib/storagePolyfill";

import { queryClient } from "@/lib/queryClient";
import { restoreQueryCache, setupQueryCachePersistence } from "@/lib/queryPersister";
import { ThemeProvider, useAppTheme } from "@/theme";
import { tamaguiConfig } from "../../tamagui.config";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme, colors: themeColors } = useAppTheme();
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let cleanupFn: (() => void) | null = null;

    async function initCache() {
      await restoreQueryCache(queryClient);
      if (isMounted) {
        setIsRestored(true);
        cleanupFn = setupQueryCachePersistence(queryClient);
      }
    }

    initCache();

    return () => {
      isMounted = false;
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider
        config={tamaguiConfig as any}
        defaultTheme={theme === "dark" ? "dark_phantom" : "light_phantom"}
      >
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: themeColors.background.primary },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="card/[id]"
            options={{
              headerShown: true,
              headerTitle: "",
              headerShadowVisible: false,
              headerStyle: {
                backgroundColor: themeColors.background.primary,
                elevation: 0,
                shadowOpacity: 0,
              } as any,
              headerTintColor: themeColors.text.primary,
              headerBackButtonMenuEnabled: false,
              animation: "slide_from_bottom",
            }}
          />
        </Stack>

        {!isRestored && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: themeColors.background.primary,
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                zIndex: 99999,
              },
            ]}
          >
            <ActivityIndicator size="large" color={themeColors.primary[400]} />
            <Text style={{ color: themeColors.text.secondary, fontSize: 14 }}>
              Carregando dados locais...
            </Text>
          </View>
        )}
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
