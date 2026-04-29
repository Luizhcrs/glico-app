// src/ui/theme.ts
export const colors = {
  bg: '#f5f3ed',          // bege quente base
  surface: '#fff',
  cardBg: '#e8e4d8',
  text: '#2d3a2d',
  textMuted: '#6b7a6b',
  accent: '#5a7a5a',      // sálvia primário
  accentMuted: '#8aa68a',
  ok: '#5a7a5a',
  warn: '#b08a3a',
  danger: '#b22',         // hipo
  pillOk: '#d4e4d4',
  pillOkText: '#2d5a2d',
  pillLow: '#f5d8d8',
  pillLowText: '#8c1c1c',
  pillHigh: '#f7ead2',
  pillHighText: '#7a5a10',
  border: '#d8d4c8',
};

export const radii = { sm: 8, md: 12, lg: 16, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const fontSizes = { xs: 11, sm: 13, md: 15, lg: 18, xl: 24, hero: 56 };
export const fontWeights = { regular: '400' as const, medium: '500' as const, bold: '700' as const };

export type Theme = {
  colors: typeof colors;
  radii: typeof radii;
  spacing: typeof spacing;
  fontSizes: typeof fontSizes;
  fontWeights: typeof fontWeights;
};

export const theme: Theme = { colors, radii, spacing, fontSizes, fontWeights };
