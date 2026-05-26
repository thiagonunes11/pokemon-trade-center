import { useAuthStore } from "@/store/useAuthStore";
import { useAppTheme, useStyles } from "@/theme";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [name, setName] = React.useState("");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useStyles(stylesFactory);
  const login = useAuthStore((s) => s.login);

  const handleLogin = () => {
    if (!name.trim()) return;
    login(name.trim());
    router.replace("/");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Bem-vindo ao Pokemon Trade Center</Text>
      <Text style={styles.subtitle}>
        Informe um nome para criar sua conta local
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Seu nome"
        style={[styles.input, { borderColor: colors.background.elevated }]}
      />
      <Pressable
        style={[styles.button, { backgroundColor: colors.primary[600] }]}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Criar conta local</Text>
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
      alignItems: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text.primary,
      marginTop: 24,
    },
    subtitle: {
      color: colors.text.secondary,
      marginTop: 8,
      marginBottom: 16,
      textAlign: "center",
    },
    input: {
      width: "100%",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 12,
      color: colors.text.primary,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginTop: 8,
    },
    buttonText: {
      color: colors.text.onPrimary ?? "#fff",
      fontWeight: "700",
    },
  });
