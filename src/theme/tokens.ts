import { Platform } from 'react-native';

const primitives = {
  white: '#FFFFFF', cream: '#F7F1E7', ink: '#1C3027', muted: '#536257',
  green700: '#186A4D', green800: '#12543D', border200: '#D9DFD7', green100: '#E8EFE8',
  successSurface: '#EAF3EC', amber700: '#785716', amber100: '#F5E7BF',
  red700: '#A32929', red100: '#F7EAE7', red200: '#D5A5A0', blue700: '#246A98',
  blue100: '#E4EEF4', brown700: '#885839', brown100: '#F5E9DF', purple700: '#72558E',
  purple100: '#F0E9F5', food100: '#E5EFE8', black53: '#00000088', transparent: 'transparent',
} as const;

const semanticColors = {
  background: primitives.cream,
  surface: primitives.white,
  primary: primitives.green700,
  primaryPressed: primitives.green800,
  onPrimary: primitives.white,
  textPrimary: primitives.ink,
  textSecondary: primitives.muted,
  border: primitives.border200,
  borderStrong: primitives.muted,
  selectedSurface: primitives.green100,
  success: primitives.green700,
  successSurface: primitives.successSurface,
  warning: primitives.amber700,
  warningSurface: primitives.amber100,
  danger: primitives.red700,
  dangerSurface: primitives.red100,
  dangerBorder: primitives.red200,
  overlay: primitives.black53,
  transparent: primitives.transparent,
} as const;

export const categoryColors = {
  pee: { fg: primitives.blue700, bg: primitives.blue100 },
  poop: { fg: primitives.brown700, bg: primitives.brown100 },
  food: { fg: primitives.green700, bg: primitives.food100 },
  sleep: { fg: primitives.purple700, bg: primitives.purple100 },
  awake: { fg: primitives.purple700, bg: primitives.purple100 },
  walk: { fg: primitives.amber700, bg: primitives.amber100 },
  accident: { fg: primitives.red700, bg: primitives.red100 },
  water: { fg: primitives.blue700, bg: primitives.blue100 },
  training: { fg: primitives.green700, bg: primitives.food100 },
  vaccination: { fg: primitives.red700, bg: primitives.red100 },
  deworming: { fg: primitives.purple700, bg: primitives.purple100 },
  veterinary: { fg: primitives.blue700, bg: primitives.blue100 },
} as const;

const typography = {
  title: { fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }), fontSize: 24, lineHeight: 32, fontWeight: '800' as const },
  heading: { fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }), fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
  body: { fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }), fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  caption: { fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }), fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  label: { fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }), fontSize: 16, lineHeight: 24, fontWeight: '700' as const },
};

export const tokens = {
  primitives,
  colors: { ...semanticColors, category: categoryColors },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  layout: { headingGap: 8, listGap: 12, cardPadding: 16, pageInset: 24, sectionGap: 24 },
  radius: { sm: 8, md: 14, lg: 20, full: 999 },
  size: { quickLogHeight: 104, quickLogCompactHeight: 76, touchMin: 44, buttonHeight: 56, navHeight: 56, iconSm: 20, iconMd: 24, chipMd: 32, chipLg: 44, stroke: 1, progress: 4, heroHeight: 200 },
  motion: { press: 120, enter: 240, release: 180, progress: 220, toastEnter: 240, toastExit: 180, check: 180, distance: 8, pressedScale: 0.98 },
  typography: { ...typography, display: typography.title },
} as const;

// Preserve the exact legacy API and values until existing screens migrate separately.
export const theme = {
  colors: {
    background: '#F7F1E7', surface: '#FFFFFF', text: '#1C3027',
    mutedText: '#536257', accent: '#186A4D', onAccent: '#FFFFFF',
    border: '#D9DFD7', error: '#A32929',
  },
  spacing: { small: 8, medium: 16, large: 24 },
  radius: { card: 20, button: 14 },
  type: { body: 16, heading: 28, label: 14 },
} as const;
