import { getAuthErrorMessage } from "@/features/auth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppTheme, useStyles } from "@/theme";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AuthMode = "login" | "register";

export default function LoginScreen() {
  const [mode, setMode] = React.useState<AuthMode>("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useStyles(stylesFactory);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const userId = useAuthStore((s) => s.userId);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const firebaseReady = isFirebaseConfigured();

  React.useEffect(() => {
    if (isAuthReady && userId) {
      router.replace("/");
    }
  }, [isAuthReady, userId, router]);

  const handleSubmit = async () => {
    setError(null);

    if (!firebaseReady) {
      setError(
        "Firebase não configurado. Preencha o .env conforme .env.example.",
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Informe e-mail e senha.");
      return;
    }

    if (mode === "register" && !displayName.trim()) {
      setError("Informe um nome para exibir no app.");
      return;
    }

    try {
      if (mode === "register") {
        await register(trimmedEmail, password, displayName.trim());
      } else {
        await login(trimmedEmail, password);
      }
      router.replace("/");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Pokemon Trade Center</Text>
      <Text style={styles.subtitle}>
        {mode === "login"
          ? "Entre com seu e-mail e senha"
          : "Crie sua conta com e-mail e senha"}
      </Text>

      <View style={styles.modeRow}>
        <Pressable
          style={[
            styles.modeButton,
            mode === "login" && { backgroundColor: colors.primary[600] },
          ]}
          onPress={() => {
            setMode("login");
            setError(null);
          }}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === "login" && styles.modeButtonTextActive,
            ]}
          >
            Entrar
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.modeButton,
            mode === "register" && { backgroundColor: colors.primary[600] },
          ]}
          onPress={() => {
            setMode("register");
            setError(null);
          }}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === "register" && styles.modeButtonTextActive,
            ]}
          >
            Criar conta
          </Text>
        </Pressable>
      </View>

      {mode === "register" && (
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Seu nome"
          autoCapitalize="words"
          style={[styles.input, { borderColor: colors.background.elevated }]}
          editable={!isLoading}
        />
      )}

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, { borderColor: colors.background.elevated }]}
        editable={!isLoading}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Senha"
        secureTextEntry
        style={[styles.input, { borderColor: colors.background.elevated }]}
        editable={!isLoading}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.primary[600] },
          isLoading && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.text.inverse} />
        ) : (
          <Text style={styles.buttonText}>
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const stylesFactory = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 24,
      backgroundColor: colors.background.primary,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text.primary,
      marginTop: 24,
      textAlign: "center",
    },
    subtitle: {
      color: colors.text.secondary,
      marginTop: 8,
      marginBottom: 20,
      textAlign: "center",
    },
    modeRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    modeButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
      backgroundColor: colors.background.elevated,
    },
    modeButtonText: {
      color: colors.text.secondary,
      fontWeight: "600",
    },
    modeButtonTextActive: {
      color: colors.text.inverse,
    },
    input: {
      width: "100%",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 12,
      color: colors.text.primary,
    },
    error: {
      color: colors.accent?.[500] ?? "#DC2626",
      marginBottom: 8,
      textAlign: "center",
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginTop: 8,
      alignItems: "center",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: colors.text.inverse,
      fontWeight: "700",
    },
  });
