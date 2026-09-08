/**
 * VOYA Design System — Light Theme Color Palette
 * Source of truth: Stitch "VOYA Travel Companion App UI" project
 * All screens and components must use these tokens exclusively.
 */
export const Colors = {
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  // Brand
  primary: '#007AFF',
  primaryDark: '#0056B3',
  primaryLight: '#EBF5FF',

  // Accents
  accent: '#F97316',
  accentDark: '#C2410C',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Tab / Icon
  tabActive: '#007AFF',
  tabInactive: '#9CA3AF',

  // Category badges (light tinted backgrounds)
  attraction: '#007AFF',
  restaurant: '#EF4444',
  hotel: '#10B981',
  landmark: '#F97316',

  // Category badge backgrounds (tinted)
  attractionBg: '#EBF5FF',
  restaurantBg: '#FEF2F2',
  hotelBg: '#ECFDF5',
  landmarkBg: '#FFF7ED',

  // Transparent
  overlay: 'rgba(255, 255, 255, 0.95)',
  cardOverlay: 'rgba(255, 255, 255, 0.80)',
} as const;

export type ColorKey = keyof typeof Colors;
