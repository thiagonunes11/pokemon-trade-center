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
import { colors } from "@/theme";
import { tamaguiConfig } from "../../tamagui.config";

export default function RootLayout() {
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
        defaultTheme="dark_phantom"
      >
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background.primary },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="card/[id]"
            options={{
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
        </Stack>

        {!isRestored && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.background.primary,
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                zIndex: 99999,
              },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary[400]} />
            <Text style={{ color: colors.text.secondary, fontSize: 14 }}>
              Carregando dados locais...
            </Text>
          </View>
        )}
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
