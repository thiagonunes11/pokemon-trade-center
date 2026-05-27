import { useAuthStore } from "@/store/useAuthStore";
import { useAppTheme, useStyles, type ThemeMode } from "@/theme";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Theme option data ──────────────────────────────────────────────
const THEME_OPTIONS: { mode: ThemeMode; label: string; description: string }[] =
  [
    { mode: "light", label: "☀️  Claro", description: "Sempre tema claro" },
    { mode: "dark", label: "🌙  Escuro", description: "Sempre tema escuro" },
    {
      mode: "system",
      label: "⚙️  Sistema",
      description: "Segue a preferência do dispositivo",
    },
  ];

// ─── Component ──────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode, colors } = useAppTheme();
  const styles = useStyles(stylesFactory);
  const username = useAuthStore((s) => s.username);
  const router = useRouter();

  const handleThemeSelect = useCallback(
    (mode: ThemeMode) => {
      setThemeMode(mode);
    },
    [setThemeMode]
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Conta ─────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>CONTA</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowIcon}>👤</Text>
            <View>
              <Text style={styles.rowTitle}>Usuário</Text>
              <Text style={styles.rowSub}>{username ?? "—"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Aparência ─────────────────────────────────── */}
      <Text style={styles.sectionLabel}>APARÊNCIA</Text>
      <View style={styles.section}>
        <Text style={styles.themeSectionTitle}>Tema do aplicativo</Text>
        <View style={styles.themeOptions}>
          {THEME_OPTIONS.map(({ mode, label, description }, index) => {
            const selected = themeMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => handleThemeSelect(mode)}
                style={({ pressed }) => [
                  styles.themeOption,
                  selected && styles.themeOptionSelected,
                  pressed && styles.themeOptionPressed,
                  index < THEME_OPTIONS.length - 1 && styles.themeOptionBorder,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={label}
              >
                <View style={styles.themeOptionContent}>
                  <Text style={styles.themeOptionLabel}>{label}</Text>
                  <Text style={styles.themeOptionDesc}>{description}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    selected && { borderColor: colors.accent[500] },
                  ]}
                >
                  {selected && (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: colors.accent[500] },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Sobre ─────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>SOBRE</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowIcon}>🃏</Text>
            <View>
              <Text style={styles.rowTitle}>Pokémon Trade Center</Text>
              <Text style={styles.rowSub}>Versão 0.1.0 — MVP</Text>
            </View>
          </View>
        </View>
        <View style={[styles.row, styles.rowBorderTop]}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowIcon}>🌐</Text>
            <View>
              <Text style={styles.rowTitle}>Dados das cartas</Text>
              <Text style={styles.rowSub}>TCGdex API (tcgdex.net) — PT-BR</Text>
            </View>
          </View>
        </View>
        <View style={[styles.row, styles.rowBorderTop]}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowIcon}>📦</Text>
            <View>
              <Text style={styles.rowTitle}>Série disponível</Text>
              <Text style={styles.rowSub}>Megaevolução (me01 – me04)</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const stylesFactory = (colors: any) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.background.secondary,
    },
    scrollContent: {
      paddingTop: 24,
      paddingHorizontal: 16,
      gap: 6,
    },

    // Section label (e.g. "CONTA")
    sectionLabel: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      marginBottom: 4,
      marginTop: 16,
      marginLeft: 4,
    },

    // Card container
    section: {
      backgroundColor: colors.background.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.background.elevated,
      overflow: "hidden",
    },

    // Generic row
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowBorderTop: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.background.elevated,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    rowIcon: {
      fontSize: 22,
      width: 28,
      textAlign: "center",
    },
    rowTitle: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: "500",
    },
    rowSub: {
      color: colors.text.muted,
      fontSize: 12,
      marginTop: 1,
    },

    // Theme selector
    themeSectionTitle: {
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: "500",
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
    },
    themeOptions: {
      // children handle their own borders
    },
    themeOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    themeOptionBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.background.elevated,
    },
    themeOptionSelected: {
      backgroundColor: colors.background.elevated,
    },
    themeOptionPressed: {
      opacity: 0.7,
    },
    themeOptionContent: {
      gap: 2,
    },
    themeOptionLabel: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: "500",
    },
    themeOptionDesc: {
      color: colors.text.muted,
      fontSize: 12,
    },

    // Radio button
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.background.elevated,
      alignItems: "center",
      justifyContent: "center",
    },
    radioDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
    },
  });
