import { getAuthErrorMessage } from "@/features/auth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppTheme, useStyles } from "@/theme";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AuthMode = "login" | "register" | "forgot";

export default function LoginScreen() {
  const [mode, setMode] = React.useState<AuthMode>("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useStyles(stylesFactory);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isLoading = useAuthStore((s) => s.isLoading);
  const userId = useAuthStore((s) => s.userId);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const firebaseReady = isFirebaseConfigured();

  React.useEffect(() => {
    if (isAuthReady && userId) {
      router.replace("/");
    }
  }, [isAuthReady, userId, router]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!firebaseReady) {
      setError(
        "Firebase não configurado. Preencha o .env conforme .env.example.",
      );
      return;
    }

    const trimmedEmail = email.trim();

    if (mode === "forgot") {
      if (!trimmedEmail) {
        setError("Informe o e-mail da sua conta.");
        return;
      }
      try {
        await resetPassword(trimmedEmail);
        setSuccess(
          "Enviamos um link de recuperação para o seu e-mail. Verifique a caixa de entrada e o spam.",
        );
      } catch (err) {
        setError(getAuthErrorMessage(err));
      }
      return;
    }

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

  const subtitle =
    mode === "login"
      ? "Entre com seu e-mail e senha"
      : mode === "register"
        ? "Crie sua conta com e-mail e senha"
        : "Informe o e-mail para receber o link de redefinição";

  const submitLabel =
    mode === "login"
      ? "Entrar"
      : mode === "register"
        ? "Criar conta"
        : "Enviar link";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Pokemon Trade Center</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {mode !== "forgot" && (
          <View style={styles.modeRow}>
            <Pressable
              style={[
                styles.modeButton,
                mode === "login" && { backgroundColor: colors.primary[600] },
              ]}
              onPress={() => switchMode("login")}
              disabled={isLoading}
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
                mode === "register" && {
                  backgroundColor: colors.primary[600],
                },
              ]}
              onPress={() => switchMode("register")}
              disabled={isLoading}
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
        )}

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

        {mode !== "forgot" && (
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Senha"
            secureTextEntry
            style={[styles.input, { borderColor: colors.background.elevated }]}
            editable={!isLoading}
          />
        )}

        {mode === "login" && (
          <Pressable
            onPress={() => switchMode("forgot")}
            disabled={isLoading}
            style={styles.forgotLink}
          >
            <Text style={[styles.forgotText, { color: colors.accent[500] }]}>
              Esqueci minha senha
            </Text>
          </Pressable>
        )}

        {error ? <Text style={[styles.feedback, styles.error]}>{error}</Text> : null}
        {success ? (
          <Text style={[styles.feedback, styles.success]}>{success}</Text>
        ) : null}

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
            <Text style={styles.buttonText}>{submitLabel}</Text>
          )}
        </Pressable>

        {mode === "forgot" && (
          <Pressable
            onPress={() => switchMode("login")}
            disabled={isLoading}
            style={styles.backLink}
          >
            <Text style={[styles.forgotText, { color: colors.text.secondary }]}>
              Voltar para entrar
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const stylesFactory = (colors: any) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    container: {
      flexGrow: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text.primary,
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
    forgotLink: {
      alignSelf: "flex-end",
      marginTop: -4,
      marginBottom: 12,
    },
    forgotText: {
      fontSize: 14,
      fontWeight: "500",
    },
    backLink: {
      alignItems: "center",
      marginTop: 16,
    },
    feedback: {
      marginBottom: 8,
      textAlign: "center",
      fontSize: 14,
      lineHeight: 20,
    },
    error: {
      color: colors.error,
    },
    success: {
      color: colors.success,
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
