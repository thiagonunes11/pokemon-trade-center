import { createTamagui } from 'tamagui';
import { defaultConfig } from '@tamagui/config/v5';

// Neutral professional palette — Slate + Cobalt Blue
const neutralTheme = {
  // Slate scale (blue-grey neutral)
  slate1:  '#09090F',
  slate2:  '#111118',
  slate3:  '#1C1C27',
  slate4:  '#26263A',
  slate5:  '#334155',
  slate6:  '#475569',
  slate7:  '#64748B',
  slate8:  '#94A3B8',
  slate9:  '#CBD5E1',
  slate10: '#E2E8F0',
  slate11: '#F1F5F9',
  slate12: '#F8FAFC',

  // Cobalt Blue accent
  blue1:  '#172554',
  blue2:  '#1E3A8A',
  blue3:  '#1E40AF',
  blue4:  '#1D4ED8',
  blue5:  '#2563EB',
  blue6:  '#3B82F6',
  blue7:  '#60A5FA',
  blue8:  '#93C5FD',
  blue9:  '#BFDBFE',
  blue10: '#DBEAFE',
  blue11: '#EFF6FF',
  blue12: '#FFFFFF',
};

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    dark_phantom: {
      background:           neutralTheme.slate1,
      backgroundHover:      neutralTheme.slate2,
      backgroundPress:      neutralTheme.slate3,
      backgroundFocus:      neutralTheme.slate2,
      backgroundStrong:     '#000000',
      backgroundTransparent: 'rgba(9, 9, 15, 0)',
      color:                neutralTheme.slate12,
      colorHover:           neutralTheme.slate11,
      colorPress:           neutralTheme.slate10,
      colorFocus:           neutralTheme.slate11,
      colorTransparent:     'rgba(248, 250, 252, 0)',
      borderColor:          neutralTheme.slate4,
      borderColorHover:     neutralTheme.slate5,
      borderColorFocus:     neutralTheme.blue5,
      borderColorPress:     neutralTheme.slate5,
      placeholderColor:     neutralTheme.slate7,
      outlineColor:         neutralTheme.blue5,
      shadowColor:          'rgba(0, 0, 0, 0.35)',
      shadowColorHover:     'rgba(0, 0, 0, 0.45)',
      shadowColorPress:     'rgba(0, 0, 0, 0.25)',
      shadowColorFocus:     'rgba(37, 99, 235, 0.30)',
      // Custom semantic colors
      blue1: neutralTheme.blue5,    // accent primary
      blue2: neutralTheme.blue6,    // accent hover
      blue3: neutralTheme.blue7,    // accent light
      blue4: neutralTheme.blue4,    // accent dark
      red1:  neutralTheme.slate5,   // secondary action
      red2:  neutralTheme.slate6,   // secondary hover
      red3:  neutralTheme.slate7,   // muted
      red4:  neutralTheme.slate4,   // subtle
      green1: neutralTheme.slate3,  // card background
      green2: neutralTheme.slate4,  // card border
      green3: neutralTheme.slate5,  // subtle separator
      green4: neutralTheme.slate7,  // muted text
    },
    light_phantom: {
      background:            '#FFFFFF',
      backgroundHover:       neutralTheme.slate12,
      backgroundPress:       neutralTheme.slate11,
      backgroundFocus:       neutralTheme.slate12,
      backgroundStrong:      '#FFFFFF',
      backgroundTransparent: 'rgba(255, 255, 255, 0)',
      color:                 neutralTheme.slate1,
      colorHover:            neutralTheme.slate2,
      colorPress:            neutralTheme.slate3,
      colorFocus:            neutralTheme.slate2,
      colorTransparent:      'rgba(9, 9, 15, 0)',
      borderColor:           neutralTheme.slate10,
      borderColorHover:      neutralTheme.slate9,
      borderColorFocus:      neutralTheme.blue5,
      borderColorPress:      neutralTheme.slate9,
      placeholderColor:      neutralTheme.slate8,
      outlineColor:          neutralTheme.blue5,
      shadowColor:           'rgba(0, 0, 0, 0.08)',
      shadowColorHover:      'rgba(0, 0, 0, 0.12)',
      shadowColorPress:      'rgba(0, 0, 0, 0.05)',
      shadowColorFocus:      'rgba(37, 99, 235, 0.18)',
      // Custom semantic colors
      blue1: neutralTheme.blue5,    // accent primary
      blue2: neutralTheme.blue6,    // accent hover
      blue3: neutralTheme.blue7,    // accent light
      blue4: neutralTheme.blue4,    // accent dark
      red1:  neutralTheme.slate7,   // secondary action
      red2:  neutralTheme.slate6,   // secondary hover
      red3:  neutralTheme.slate9,   // muted
      red4:  neutralTheme.slate5,   // subtle
      green1: '#FFFFFF',            // card background
      green2: neutralTheme.slate10, // card border
      green3: neutralTheme.slate11, // subtle separator
      green4: neutralTheme.slate7,  // muted text
    },
  },
});

export default tamaguiConfig;

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
