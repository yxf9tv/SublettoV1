import { TextStyle } from 'react-native';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { colors } from './colors';

/**
 * Poppins font family configuration
 * Weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
 */
export const fontFamily = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

/**
 * Font weights mapping
 */
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

/**
 * Font sizes
 */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
} as const;

/**
 * Line heights
 */
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

/**
 * Typography styles for consistent text rendering
 */
export const typography = {
  // Display styles
  display: {
    fontSize: fontSize['4xl'],
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    color: colors.textPrimary,
  } as TextStyle,

  // Heading styles
  h1: {
    fontSize: fontSize['3xl'],
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    color: colors.textPrimary,
  } as TextStyle,

  h2: {
    fontSize: fontSize['2xl'],
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
    color: colors.textPrimary,
  } as TextStyle,

  h3: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
    lineHeight: fontSize.xl * lineHeight.normal,
    color: colors.textPrimary,
  } as TextStyle,

  h4: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.lg * lineHeight.normal,
    color: colors.textPrimary,
  } as TextStyle,

  // Body styles
  body: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.base * lineHeight.normal,
    color: colors.textPrimary,
  } as TextStyle,

  bodyMedium: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * lineHeight.normal,
    color: colors.textPrimary,
  } as TextStyle,

  bodySmall: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.normal,
    color: colors.textPrimary,
  } as TextStyle,

  // Caption styles
  caption: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.xs * lineHeight.normal,
    color: colors.textPrimaryOpacity[70],
  } as TextStyle,

  // Button styles
  button: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
    lineHeight: fontSize.base * lineHeight.normal,
    color: colors.card,
  } as TextStyle,

  buttonSmall: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
    color: colors.card,
  } as TextStyle,

  // Link styles
  link: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * lineHeight.normal,
    color: colors.accentBlue,
  } as TextStyle,
} as const;

/**
 * Export Poppins fonts for use with useFonts hook
 */
export const poppinsFonts = {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
};

export type Typography = typeof typography;



