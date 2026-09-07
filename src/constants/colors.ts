/**
 * VOYA Design System — Color Palette
 * All screens and components must use these tokens.
 */
export const Colors = {
  // Backgrounds
  background: '#0F0F1E',
  surface: '#1A1A2E',
  card: '#22223B',
  cardElevated: '#2A2A45',

  // Brand
  primary: '#4F6EF7',
  primaryDark: '#3A55D4',
  primaryLight: '#7B93F9',

  // Accents
  accent: '#FFB347',
  accentDark: '#E09000',
  success: '#44CC88',
  error: '#FF5C5C',
  warning: '#FFC107',

  // Text
  textPrimary: '#F0F0FF',
  textSecondary: '#9999BB',
  textMuted: '#55556A',
  textInverse: '#0F0F1E',

  // Borders & Dividers
  border: '#2E2E4A',
  divider: '#1E1E35',

  // Tab / Icon
  tabActive: '#4F6EF7',
  tabInactive: '#55556A',

  // Category badges
  attraction: '#4F6EF7',
  restaurant: '#FF6B6B',
  hotel: '#44CC88',
  landmark: '#FFB347',

  // Transparent
  overlay: 'rgba(15, 15, 30, 0.85)',
  cardOverlay: 'rgba(34, 34, 59, 0.6)',
} as const;

export type ColorKey = keyof typeof Colors;
