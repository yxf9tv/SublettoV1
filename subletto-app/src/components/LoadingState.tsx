import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export default function LoadingState({
  message = 'Loading...',
  size = 'large',
}: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.accentBlue} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
});



