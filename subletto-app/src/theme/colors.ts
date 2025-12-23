/**
 * Subletto Color Palette
 * Based on design tokens from ARCHITECTURE.md
 */

export const colors = {
  // Primary colors
  textPrimary: '#113D43',
  accentBlue: '#2C67FF',
  
  // Background colors
  background: '#F5F5F7',
  card: '#FFFFFF',
  
  // Semantic colors (for future use)
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#2C67FF',
  
  // Neutral colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Opacity variants
  textPrimaryOpacity: {
    10: 'rgba(17, 61, 67, 0.1)',
    20: 'rgba(17, 61, 67, 0.2)',
    30: 'rgba(17, 61, 67, 0.3)',
    50: 'rgba(17, 61, 67, 0.5)',
    70: 'rgba(17, 61, 67, 0.7)',
    90: 'rgba(17, 61, 67, 0.9)',
  },
  
  accentBlueOpacity: {
    10: 'rgba(44, 103, 255, 0.1)',
    20: 'rgba(44, 103, 255, 0.2)',
    30: 'rgba(44, 103, 255, 0.3)',
    50: 'rgba(44, 103, 255, 0.5)',
    70: 'rgba(44, 103, 255, 0.7)',
    90: 'rgba(44, 103, 255, 0.9)',
  },
} as const;

export type Colors = typeof colors;



