import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
  warning: 'warning',
};

const TOAST_COLORS: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: '#ECFDF5', text: '#065F46', icon: '#10B981' },
  error: { bg: '#FEF2F2', text: '#991B1B', icon: '#EF4444' },
  info: { bg: '#EFF6FF', text: '#1E40AF', icon: '#3B82F6' },
  warning: { bg: '#FFFBEB', text: '#92400E', icon: '#F59E0B' },
};

export default function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, opacity, translateY, onHide]);

  if (!visible) return null;

  const colorScheme = TOAST_COLORS[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colorScheme.bg, opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons
        name={TOAST_ICONS[type] as any}
        size={20}
        color={colorScheme.icon}
        style={styles.icon}
      />
      <Text style={[styles.message, { color: colorScheme.text }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 9999,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});



