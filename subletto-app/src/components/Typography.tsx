import React from 'react';
import { Text, TextProps, TextStyle, StyleSheet } from 'react-native';
import { typography, Typography } from '../theme';

type TypographyVariant = keyof Typography;

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  children: React.ReactNode;
  color?: string;
  style?: TextStyle;
}

/**
 * Typography component for consistent text styling
 * Uses Poppins font family and predefined text styles
 */
export default function TypographyComponent({
  variant = 'body',
  children,
  color,
  style,
  ...props
}: TypographyProps) {
  const baseStyle = typography[variant];
  const textColor = color || baseStyle.color;

  return (
    <Text
      style={[
        baseStyle,
        { color: textColor },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

// Export convenience components for common variants
export const H1 = (props: Omit<TypographyProps, 'variant'>) => (
  <TypographyComponent variant="h1" {...props} />
);

export const H2 = (props: Omit<TypographyProps, 'variant'>) => (
  <TypographyComponent variant="h2" {...props} />
);

export const H3 = (props: Omit<TypographyProps, 'variant'>) => (
  <TypographyComponent variant="h3" {...props} />
);

export const H4 = (props: Omit<TypographyProps, 'variant'>) => (
  <TypographyComponent variant="h4" {...props} />
);

export const Body = (props: Omit<TypographyProps, 'variant'>) => (
  <TypographyComponent variant="body" {...props} />
);

export const BodySmall = (props: Omit<TypographyProps, 'variant'>) => (
  <TypographyComponent variant="bodySmall" {...props} />
);

export const Caption = (props: Omit<TypographyProps, 'variant'>) => (
  <TypographyComponent variant="caption" {...props} />
);



