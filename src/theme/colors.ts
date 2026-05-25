/**
 * Theme colors for Pokemon Trade Center
 * Inspired by the Phantasmal Flames (Fogo Fantasmagórico) set
 * Ghost purple + Fire orange palette
 */

export interface ColorPalette {
  readonly primary: {
    readonly 50: string;
    readonly 100: string;
    readonly 200: string;
    readonly 300: string;
    readonly 400: string;
    readonly 500: string;
    readonly 600: string;
    readonly 700: string;
    readonly 800: string;
    readonly 900: string;
    readonly 950: string;
  };
  readonly accent: {
    readonly 50: string;
    readonly 100: string;
    readonly 200: string;
    readonly 300: string;
    readonly 400: string;
    readonly 500: string;
    readonly 600: string;
    readonly 700: string;
    readonly 800: string;
    readonly 900: string;
    readonly 950: string;
  };
  readonly background: {
    readonly primary: string;
    readonly secondary: string;
    readonly card: string;
    readonly elevated: string;
    readonly overlay: string;
  };
  readonly text: {
    readonly primary: string;
    readonly secondary: string;
    readonly muted: string;
    readonly inverse: string;
  };
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly info: string;
  readonly types: {
    readonly fire: string;
    readonly water: string;
    readonly grass: string;
    readonly electric: string;
    readonly psychic: string;
    readonly fighting: string;
    readonly darkness: string;
    readonly metal: string;
    readonly fairy: string;
    readonly dragon: string;
    readonly colorless: string;
  };
}

export const darkColors: ColorPalette = {
  // Primary — Ghost Purple
  primary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6B21A8',
    800: '#5B21B6',
    900: '#4C1D95',
    950: '#2E1065',
  },

  // Accent — Fire Orange
  accent: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
    950: '#431407',
  },

  // Background — Deep Purple Dark
  background: {
    primary: '#0F0D15',
    secondary: '#1A1625',
    card: '#2D2640',
    elevated: '#3D3555',
    overlay: 'rgba(15, 13, 21, 0.8)',
  },

  // Text
  text: {
    primary: '#F5F3FF',
    secondary: '#C4B5FD',
    muted: '#8B7FC7',
    inverse: '#0F0D15',
  },

  // Semantic
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  info: '#3B82F6',

  // Card type colors (Pokémon types)
  types: {
    fire: '#F97316',
    water: '#3B82F6',
    grass: '#22C55E',
    electric: '#EAB308',
    psychic: '#EC4899',
    fighting: '#DC2626',
    darkness: '#6B21A8',
    metal: '#9CA3AF',
    fairy: '#F472B6',
    dragon: '#7C3AED',
    colorless: '#9CA3AF',
  },
};

export const lightColors: ColorPalette = {
  // Primary — Ghost Purple (inverted contrast)
  primary: {
    50: '#2E1065',
    100: '#4C1D95',
    200: '#5B21B6',
    300: '#6B21A8',
    400: '#7C3AED',
    500: '#8B5CF6',
    600: '#A78BFA',
    700: '#C4B5FD',
    800: '#DDD6FE',
    900: '#EDE9FE',
    950: '#F5F3FF',
  },

  // Accent — Fire Orange (maintained for brand consistency)
  accent: {
    50: '#431407',
    100: '#7C2D12',
    200: '#9A3412',
    300: '#C2410C',
    400: '#EA580C',
    500: '#F97316',
    600: '#FB923C',
    700: '#FDBA74',
    800: '#FED7AA',
    900: '#FFEDD5',
    950: '#FFF7ED',
  },

  // Background — Soft Lavender Tint & Whites
  background: {
    primary: '#F5F3FF',
    secondary: '#EDE9FE',
    card: '#FFFFFF',
    elevated: '#DDD6FE',
    overlay: 'rgba(245, 243, 255, 0.8)',
  },

  // Text — Deep purples and contrast
  text: {
    primary: '#1A1625',
    secondary: '#4C1D95',
    muted: '#7C3AED',
    inverse: '#F5F3FF',
  },

  // Semantic
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  // Card type colors (Pokémon types)
  types: {
    fire: '#F97316',
    water: '#3B82F6',
    grass: '#22C55E',
    electric: '#EAB308',
    psychic: '#EC4899',
    fighting: '#DC2626',
    darkness: '#6B21A8',
    metal: '#9CA3AF',
    fairy: '#F472B6',
    dragon: '#7C3AED',
    colorless: '#9CA3AF',
  },
};

// Keep export of colors as default darkColors for backward compatibility
export const colors = darkColors;

export type ColorToken = ColorPalette;
