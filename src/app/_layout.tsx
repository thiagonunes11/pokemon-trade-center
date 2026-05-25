import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider } from "tamagui";

// Initialize storage polyfill for React Native
import "@/lib/storagePolyfill";

import { queryClient } from "@/lib/queryClient";
import { colors } from "@/theme";
import { tamaguiConfig } from "../../tamagui.config";

export default function RootLayout() {
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
              headerShown: true,
              headerTitle: "",
              headerShadowVisible: false,
              headerStyle: {
                backgroundColor: colors.background.primary,
                elevation: 0,
                shadowOpacity: 0,
              },
              headerTintColor: colors.text.primary,
              headerBackButtonMenuEnabled: false,
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
