/**
 * Theme colors for Pokemon Trade Center
 * Inspired by the Phantasmal Flames (Fogo Fantasmagórico) set
 * Ghost purple + Fire orange palette
 */

export const colors = {
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
} as const;

export type ColorToken = typeof colors;
