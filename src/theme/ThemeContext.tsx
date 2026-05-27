import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useColorScheme, StyleSheet } from 'react-native';
import { darkColors, lightColors } from './colors';
import { safeStorage } from '@/lib/safeStorage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  themeMode: ThemeMode;
  colors: typeof darkColors;
  setThemeMode: (mode: ThemeMode) => void;
  /** @deprecated use setThemeMode instead */
  toggleTheme: () => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);
const THEME_PREFERENCE_KEY = 'pokemon-theme-preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar preferência salva ao iniciar
  useEffect(() => {
    async function loadThemePreference() {
      try {
        const saved = await safeStorage.getItem(THEME_PREFERENCE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        } else {
          setThemeModeState('system');
        }
      } catch (error) {
        console.warn('[ThemeContext] Erro ao carregar preferência de tema:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadThemePreference();
  }, []);

  const resolvedTheme: Theme = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return themeMode;
  }, [themeMode, systemScheme]);

  const setThemeMode = useMemo(() => async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await safeStorage.setItem(THEME_PREFERENCE_KEY, mode);
    } catch (error) {
      console.warn('[ThemeContext] Erro ao salvar preferência de tema:', error);
    }
  }, []);

  const value = useMemo(() => ({
    theme: resolvedTheme,
    themeMode,
    colors: resolvedTheme === 'dark' ? darkColors : lightColors,
    setThemeMode,
    toggleTheme: () => {
      const next = resolvedTheme === 'dark' ? 'light' : 'dark';
      setThemeMode(next);
    },
    isLoaded,
  }), [resolvedTheme, themeMode, setThemeMode, isLoaded]);

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
