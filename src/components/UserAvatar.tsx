import { useAppTheme } from "@/theme";
import { useMemo } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

const AVATAR_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#0891B2",
  "#059669",
  "#D97706",
  "#DC2626",
  "#DB2777",
  "#4F46E5",
] as const;

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitial(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const name = displayName?.trim();
  if (name) {
    return name.charAt(0).toUpperCase();
  }
  const mail = email?.trim();
  if (mail) {
    return mail.charAt(0).toUpperCase();
  }
  return "?";
}

export interface UserAvatarProps {
  userId: string;
  displayName?: string | null;
  email?: string | null;
  size?: number;
  style?: ViewStyle;
}

export function UserAvatar({
  userId,
  displayName,
  email,
  size = 44,
  style,
}: UserAvatarProps) {
  const { colors } = useAppTheme();

  const backgroundColor = useMemo(
    () => AVATAR_COLORS[hashUserId(userId) % AVATAR_COLORS.length],
    [userId],
  );

  const initial = getInitial(displayName, email);
  const fontSize = Math.round(size * 0.42);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={
        displayName ? `Avatar de ${displayName}` : "Avatar do usuário"
      }
    >
      <Text
        style={[
          styles.initial,
          { fontSize, color: colors.text.inverse },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontWeight: "700",
  },
});
