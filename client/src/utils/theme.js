/**
 * theme.js - Kumpulan konstanta warna Digital Blue & Chart Palette
 * Sumber: Coolors OKLCH Digital Blue Palette
 */

export const DIGITAL_BLUE = {
  50: 'oklch(95.13% 0.023 256.10)',
  100: 'oklch(90.17% 0.048 259.10)',
  200: 'oklch(80.72% 0.097 258.14)',
  300: 'oklch(71.49% 0.149 258.39)',
  400: 'oklch(63.31% 0.198 258.73)',
  500: 'oklch(56.35% 0.241 260.82)',
  600: 'oklch(48.02% 0.201 260.48)', // Primary Brand Accent
  700: 'oklch(39.11% 0.161 260.13)',
  800: 'oklch(29.89% 0.116 259.04)',
  900: 'oklch(19.67% 0.068 256.39)',
  950: 'oklch(16.49% 0.052 253.90)',
};

/** Palet urutan warna untuk chart / grafik visualisasi data */
export const CHART_PALETTE = [
  DIGITAL_BLUE[600],
  DIGITAL_BLUE[400],
  DIGITAL_BLUE[800],
  DIGITAL_BLUE[300],
  DIGITAL_BLUE[500],
  DIGITAL_BLUE[700],
  DIGITAL_BLUE[200],
];

/** Warna semantik untuk indikator performa */
export const SEMANTIC_COLORS = {
  success: '#10B981', // Emerald 500
  warning: '#F59E0B', // Amber 500
  danger: '#EF4444',  // Rose 500
  info: DIGITAL_BLUE[600],
};

export default {
  DIGITAL_BLUE,
  CHART_PALETTE,
  SEMANTIC_COLORS,
};
