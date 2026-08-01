import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { darkColors, lightColors, type ColorPalette } from "./colors";
import { safeStorage } from "@/lib/safeStorage";

export type ThemeMode = "light" | "dark" | "system";
export type Theme = "light" | "dark";

const STORAGE_KEY = "ptc-theme-mode";

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  colors: ColorPalette;
  setThemeMode: (mode: ThemeMode) => void;
  /** @deprecated use setThemeMode */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyDomTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await safeStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeModeState(stored);
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const theme: Theme = themeMode === "system" ? systemTheme : themeMode;

  useEffect(() => {
    if (ready) applyDomTheme(theme);
  }, [theme, ready]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    void safeStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(theme === "dark" ? "light" : "dark");
  }, [setThemeMode, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeMode,
      colors: theme === "dark" ? darkColors : lightColors,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, setThemeMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }
  return ctx;
}

/** Mantido por compatibilidade — preferir classes Tailwind. */
export function useStyles<T>(factory: (colors: ColorPalette) => T): T {
  const { colors } = useAppTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
