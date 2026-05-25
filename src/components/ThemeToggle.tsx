import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '@/theme';

export function ThemeToggle() {
  const { theme, toggleTheme, colors } = useAppTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.background.elevated,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
    >
      <Text style={styles.text}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginRight: 8,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  text: {
    fontSize: 18,
  },
});
