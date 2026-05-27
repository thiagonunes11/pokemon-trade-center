/**
 * Theme colors for Pokemon Trade Center
 * Neutral & Professional palette — Slate / Cobalt Blue
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

  // Accent — Cobalt Blue (professional, controlled saturation)
  accent: {
    50:  '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },

  // Background — Near-black neutral
  background: {
    primary:   '#09090F',
    secondary: '#111118',
    card:      '#1C1C27',
    elevated:  '#26263A',
    overlay:   'rgba(9, 9, 15, 0.82)',
  },

  // Text
  text: {
    primary:   '#F1F5F9',
    secondary: '#94A3B8',
    muted:     '#64748B',
    inverse:   '#09090F',
  },

  // Semantic
  success: '#22C55E',
  warning: '#EAB308',
  error:   '#EF4444',
  info:    '#3B82F6',

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

  // Accent — Cobalt Blue (slightly deeper for light backgrounds)
  accent: {
    50:  '#172554',
    100: '#1E3A8A',
    200: '#1E40AF',
    300: '#1D4ED8',
    400: '#2563EB',
    500: '#3B82F6',
    600: '#60A5FA',
    700: '#93C5FD',
    800: '#BFDBFE',
    900: '#DBEAFE',
    950: '#EFF6FF',
  },

  // Background — Clean whites and light greys
  background: {
    primary:   '#FFFFFF',
    secondary: '#F8FAFC',
    card:      '#FFFFFF',
    elevated:  '#F1F5F9',
    overlay:   'rgba(255, 255, 255, 0.85)',
  },

  // Text — Deep slate for readability
  text: {
    primary:   '#0F172A',
    secondary: '#475569',
    muted:     '#94A3B8',
    inverse:   '#FFFFFF',
  },

  // Semantic
  success: '#16A34A',
  warning: '#D97706',
  error:   '#DC2626',
  info:    '#2563EB',

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
