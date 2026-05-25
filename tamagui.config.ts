import { createTamagui } from 'tamagui';
import { defaultConfig } from '@tamagui/config/v5';

const phantasmalTheme = {
  // Ghost/phantom purple tones
  purple1: '#0F0D15',
  purple2: '#1A1625',
  purple3: '#2D2640',
  purple4: '#3D3555',
  purple5: '#4E4570',
  purple6: '#5E5585',
  purple7: '#6B21A8',
  purple8: '#7C3AED',
  purple9: '#8B5CF6',
  purple10: '#A78BFA',
  purple11: '#C4B5FD',
  purple12: '#F5F3FF',

  // Fire/flame orange tones
  orange1: '#431407',
  orange2: '#7C2D12',
  orange3: '#9A3412',
  orange4: '#C2410C',
  orange5: '#EA580C',
  orange6: '#F97316',
  orange7: '#FB923C',
  orange8: '#FDBA74',
  orange9: '#FED7AA',
  orange10: '#FFEDD5',
  orange11: '#FFF7ED',
  orange12: '#FFFFFF',
};

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    dark_phantom: {
      background: phantasmalTheme.purple1,
      backgroundHover: phantasmalTheme.purple2,
      backgroundPress: phantasmalTheme.purple3,
      backgroundFocus: phantasmalTheme.purple2,
      backgroundStrong: '#000000',
      backgroundTransparent: 'rgba(15, 13, 21, 0)',
      color: phantasmalTheme.purple12,
      colorHover: phantasmalTheme.purple11,
      colorPress: phantasmalTheme.purple10,
      colorFocus: phantasmalTheme.purple11,
      colorTransparent: 'rgba(245, 243, 255, 0)',
      borderColor: phantasmalTheme.purple4,
      borderColorHover: phantasmalTheme.purple5,
      borderColorFocus: phantasmalTheme.purple6,
      borderColorPress: phantasmalTheme.purple5,
      placeholderColor: phantasmalTheme.purple6,
      outlineColor: phantasmalTheme.purple8,
      shadowColor: 'rgba(124, 58, 237, 0.25)',
      shadowColorHover: 'rgba(124, 58, 237, 0.35)',
      shadowColorPress: 'rgba(124, 58, 237, 0.15)',
      shadowColorFocus: 'rgba(124, 58, 237, 0.35)',
      // Custom semantic colors
      blue1: phantasmalTheme.purple7,   // primary
      blue2: phantasmalTheme.purple8,   // primary hover
      blue3: phantasmalTheme.purple9,   // primary active
      blue4: phantasmalTheme.purple10,  // primary text
      red1: phantasmalTheme.orange6,    // accent
      red2: phantasmalTheme.orange7,    // accent hover
      red3: phantasmalTheme.orange8,    // accent light
      red4: phantasmalTheme.orange5,    // accent dark
      green1: phantasmalTheme.purple3,  // card background
      green2: phantasmalTheme.purple4,  // card border
      green3: phantasmalTheme.purple5,  // subtle
      green4: phantasmalTheme.purple6,  // muted text
    },
  },
});

export default tamaguiConfig;

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
