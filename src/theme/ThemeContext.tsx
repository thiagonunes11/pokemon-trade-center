import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useColorScheme, StyleSheet } from 'react-native';
import { darkColors, lightColors } from './colors';
import { safeStorage } from '@/lib/safeStorage';

export type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  colors: typeof darkColors;
  toggleTheme: () => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);
const THEME_PREFERENCE_KEY = 'pokemon-theme-preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar preferência salva ao iniciar
  useEffect(() => {
    async function loadThemePreference() {
      try {
        const savedTheme = await safeStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
        } else {
          // Se não houver preferência salva, usa a preferência do sistema
          setTheme(systemScheme === 'light' ? 'light' : 'dark');
        }
      } catch (error) {
        console.warn('[ThemeContext] Erro ao carregar preferência de tema:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadThemePreference();
  }, [systemScheme]);

  // Sincronizar com mudanças do sistema operacional se o usuário ainda não tiver preferência salva
  useEffect(() => {
    async function syncWithSystem() {
      const savedTheme = await safeStorage.getItem(THEME_PREFERENCE_KEY);
      if (!savedTheme) {
        setTheme(systemScheme === 'light' ? 'light' : 'dark');
      }
    }
    syncWithSystem();
  }, [systemScheme]);

  const value = useMemo(() => ({
    theme,
    colors: theme === 'dark' ? darkColors : lightColors,
    toggleTheme: async () => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      try {
        await safeStorage.setItem(THEME_PREFERENCE_KEY, newTheme);
      } catch (error) {
        console.warn('[ThemeContext] Erro ao salvar preferência de tema:', error);
      }
    },
    isLoaded,
  }), [theme, isLoaded]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}

export function useStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (themeColors: typeof darkColors) => T
): T {
  const { colors } = useAppTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
