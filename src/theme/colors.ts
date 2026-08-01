/**
 * Theme colors for Pokemon Trade Center
 * Editorial vitrine — ink / paper / amber progress
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
  // Primary — Slate (blue-grey neutral)
  primary: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Accent — Amber progress
  accent: {
    50:  '#FDF4EF',
    100: '#F8E4D8',
    200: '#F0C4A8',
    300: '#E8A078',
    400: '#E07A45',
    500: '#C45C26',
    600: '#A34A1E',
    700: '#853C18',
    800: '#662E12',
    900: '#4A210D',
    950: '#2E1408',
  },

  // Background — Deep ink
  background: {
    primary:   '#121212',
    secondary: '#1C1C1C',
    card:      '#1C1C1C',
    elevated:  '#2A2A2A',
    overlay:   'rgba(18, 18, 18, 0.82)',
  },

  // Text
  text: {
    primary:   '#F5F2EC',
    secondary: '#A8A59E',
    muted:     '#6E6B66',
    inverse:   '#121212',
  },

  // Semantic
  success: '#22C55E',
  warning: '#EAB308',
  error:   '#EF4444',
  info:    '#E07A45',

  // Card type colors (Pokémon types — unchanged)
  types: {
    fire:      '#F97316',
    water:     '#3B82F6',
    grass:     '#22C55E',
    electric:  '#EAB308',
    psychic:   '#EC4899',
    fighting:  '#DC2626',
    darkness:  '#475569',
    metal:     '#9CA3AF',
    fairy:     '#F472B6',
    dragon:    '#6366F1',
    colorless: '#9CA3AF',
  },
};

export const lightColors: ColorPalette = {
  // Primary — Slate (inverted contrast for light mode)
  primary: {
    50:  '#020617',
    100: '#0F172A',
    200: '#1E293B',
    300: '#334155',
    400: '#475569',
    500: '#64748B',
    600: '#94A3B8',
    700: '#CBD5E1',
    800: '#E2E8F0',
    900: '#F1F5F9',
    950: '#F8FAFC',
  },

  // Accent — Amber progress
  accent: {
    50:  '#2E1408',
    100: '#4A210D',
    200: '#662E12',
    300: '#853C18',
    400: '#A34A1E',
    500: '#C45C26',
    600: '#E07A45',
    700: '#E8A078',
    800: '#F0C4A8',
    900: '#F8E4D8',
    950: '#FDF4EF',
  },

  // Background — Warm paper
  background: {
    primary:   '#F7F4EF',
    secondary: '#EFEBE4',
    card:      '#FFFCFA',
    elevated:  '#E8E2D9',
    overlay:   'rgba(247, 244, 239, 0.88)',
  },

  // Text — Ink
  text: {
    primary:   '#1A1A1A',
    secondary: '#5C5A56',
    muted:     '#8A8680',
    inverse:   '#FFFCFA',
  },

  // Semantic
  success: '#16A34A',
  warning: '#D97706',
  error:   '#DC2626',
  info:    '#C45C26',

  // Card type colors (Pokémon types — unchanged)
  types: {
    fire:      '#F97316',
    water:     '#3B82F6',
    grass:     '#22C55E',
    electric:  '#EAB308',
    psychic:   '#EC4899',
    fighting:  '#DC2626',
    darkness:  '#475569',
    metal:     '#9CA3AF',
    fairy:     '#F472B6',
    dragon:    '#6366F1',
    colorless: '#9CA3AF',
  },
};

// Keep export of colors as default darkColors for backward compatibility
export const colors = darkColors;

export type ColorToken = ColorPalette;
