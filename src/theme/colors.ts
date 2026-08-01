/**
 * Theme colors for Pokemon Trade Center
 * Marketplace TCG — dark storefront / Pokémon yellow
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
  primary: {
    50:  '#F4F5F7',
    100: '#E8EAEF',
    200: '#C5CAD6',
    300: '#A8B0C0',
    400: '#6D7689',
    500: '#4A5160',
    600: '#2A3142',
    700: '#1E2330',
    800: '#151822',
    900: '#11141C',
    950: '#0B0D12',
  },

  accent: {
    50:  '#FFF9E0',
    100: '#FFF0B3',
    200: '#FFE566',
    300: '#FFD633',
    400: '#FFCB05',
    500: '#F5B800',
    600: '#D9A000',
    700: '#B38600',
    800: '#8C6900',
    900: '#664D00',
    950: '#3D2E00',
  },

  background: {
    primary:   '#0B0D12',
    secondary: '#11141C',
    card:      '#151822',
    elevated:  '#1E2330',
    overlay:   'rgba(11, 13, 18, 0.85)',
  },

  text: {
    primary:   '#F4F5F7',
    secondary: '#A8B0C0',
    muted:     '#6D7689',
    inverse:   '#0B0D12',
  },

  success: '#22C55E',
  warning: '#FFCB05',
  error:   '#EF4444',
  info:    '#FFCB05',

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
  primary: {
    50:  '#0B0D12',
    100: '#11141C',
    200: '#151822',
    300: '#1E2330',
    400: '#2A3142',
    500: '#4A5160',
    600: '#6D7689',
    700: '#A8B0C0',
    800: '#C5CAD6',
    900: '#E8EAEF',
    950: '#F5F6FA',
  },

  accent: {
    50:  '#3D2E00',
    100: '#664D00',
    200: '#8C6900',
    300: '#B38600',
    400: '#D9A000',
    500: '#F5B800',
    600: '#FFCB05',
    700: '#FFD633',
    800: '#FFE566',
    900: '#FFF0B3',
    950: '#FFF9E0',
  },

  background: {
    primary:   '#F5F6FA',
    secondary: '#E8EAEF',
    card:      '#FFFFFF',
    elevated:  '#EEF0F5',
    overlay:   'rgba(245, 246, 250, 0.9)',
  },

  text: {
    primary:   '#0B0D12',
    secondary: '#4A5160',
    muted:     '#8B92A3',
    inverse:   '#FFFFFF',
  },

  success: '#16A34A',
  warning: '#D97706',
  error:   '#DC2626',
  info:    '#F5B800',

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

export const colors = darkColors;

export type ColorToken = ColorPalette;
