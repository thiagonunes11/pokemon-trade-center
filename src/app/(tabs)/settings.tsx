import { UserAvatar } from "@/components/UserAvatar";
import { getAuthErrorMessage } from "@/features/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppTheme, useStyles, type ThemeMode } from "@/theme";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode, colors } = useAppTheme();
  const styles = useStyles(stylesFactory);
  const router = useRouter();

  const userId = useAuthStore((s) => s.userId);
  const username = useAuthStore((s) => s.username);
  const email = useAuthStore((s) => s.email);
  const isLoading = useAuthStore((s) => s.isLoading);
  const logout = useAuthStore((s) => s.logout);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(username ?? "");
  const [nameError, setNameError] = useState<string | null>(null);

  const handleThemeSelect = useCallback(
    (mode: ThemeMode) => {
      setThemeMode(mode);
    },
    [setThemeMode],
  );

  const handleStartEditName = useCallback(() => {
    setNameDraft(username ?? "");
    setNameError(null);
    setIsEditingName(true);
  }, [username]);

  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false);
    setNameError(null);
  }, []);

  const handleSaveName = useCallback(async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError("Informe um nome.");
      return;
    }
    setNameError(null);
    try {
      await updateDisplayName(trimmed);
      setIsEditingName(false);
    } catch (err) {
      setNameError(getAuthErrorMessage(err));
    }
  }, [nameDraft, updateDisplayName]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair? Sua coleção neste aparelho permanece salva localmente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/login");
            } catch (err) {
              Alert.alert("Erro", getAuthErrorMessage(err));
            }
          },
        },
      ],
    );
  }, [logout, router]);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionLabel}>CONTA</Text>
      <View style={styles.section}>
        <View style={styles.accountRow}>
          {userId ? (
            <UserAvatar
              userId={userId}
              displayName={username}
              email={email}
              size={48}
            />
          ) : null}
          <View style={styles.accountInfo}>
            <Text style={styles.rowTitle}>Nome no app</Text>
            {isEditingName ? (
              <>
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Seu nome"
                  autoCapitalize="words"
                  style={[
                    styles.nameInput,
                    { borderColor: colors.background.elevated },
                  ]}
                  editable={!isLoading}
                />
                {nameError ? (
                  <Text style={styles.nameError}>{nameError}</Text>
                ) : null}
                <View style={styles.nameActions}>
                  <Pressable
                    onPress={handleCancelEditName}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      styles.nameActionButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.nameActionCancel}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveName}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      styles.nameActionButton,
                      styles.nameActionSave,
                      { backgroundColor: colors.primary[600] },
                      pressed && styles.pressed,
                    ]}
                  >
                    {isLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.text.inverse}
                      />
                    ) : (
                      <Text style={styles.nameActionSaveText}>Salvar</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.rowSub}>{username ?? "—"}</Text>
                <Pressable
                  onPress={handleStartEditName}
                  disabled={!userId || isLoading}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text style={[styles.editLink, { color: colors.accent[500] }]}>
                    Alterar nome
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        <View style={[styles.row, styles.rowBorderTop]}>
          <View style={styles.rowLeft}>
            <View>
              <Text style={styles.rowTitle}>E-mail de login</Text>
              <Text style={styles.rowSub}>{email ?? "—"}</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleLogout}
          disabled={isLoading || !userId}
          style={({ pressed }) => [
            styles.row,
            styles.rowBorderTop,
            styles.logoutRow,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Sair da conta
          </Text>
        </Pressable>
      </View>

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
    sectionLabel: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      marginBottom: 4,
      marginTop: 16,
      marginLeft: 4,
    },
    section: {
      backgroundColor: colors.background.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.background.elevated,
      overflow: "hidden",
    },
    accountRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    accountInfo: {
      flex: 1,
      gap: 4,
    },
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
    editLink: {
      fontSize: 14,
      fontWeight: "500",
      marginTop: 4,
    },
    nameInput: {
      marginTop: 6,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.text.primary,
      fontSize: 15,
    },
    nameError: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
    nameActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 10,
    },
    nameActionButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    nameActionCancel: {
      color: colors.text.secondary,
      fontWeight: "600",
    },
    nameActionSave: {
      minWidth: 72,
      alignItems: "center",
    },
    nameActionSaveText: {
      color: colors.text.inverse,
      fontWeight: "600",
    },
    logoutRow: {
      justifyContent: "center",
    },
    logoutText: {
      fontSize: 15,
      fontWeight: "600",
      textAlign: "center",
      width: "100%",
    },
    pressed: {
      opacity: 0.7,
    },
    themeSectionTitle: {
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: "500",
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
    },
    themeOptions: {},
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
