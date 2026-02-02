/**
 * Room Color Palette
 * Black and white theme for buttons, with appropriate accent colors for UI elements
 */

export const colors = {
  // Primary colors - Black & White theme for buttons/actions
  textPrimary: '#111827',
  accent: '#111827',  // Black for buttons and primary actions
  accentBlue: '#111827',  // Kept for backwards compatibility
  
  // Background colors
  background: '#FFFFFF',
  card: '#FFFFFF',
  
  // Semantic colors - used for tags, badges, and indicators
  success: '#10B981',  // Green for recommended, verified, etc.
  error: '#EF4444',    // Red for errors
  warning: '#F59E0B',  // Amber/gold for stars, warnings
  info: '#6B7280',     // Gray for info
  
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



