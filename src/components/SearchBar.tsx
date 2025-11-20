import React from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import { colors, typography } from '../theme';

interface SearchBarProps {
  placeholder?: string;
  onPress?: () => void;
  value?: string;
  onChangeText?: (text: string) => void;
}

export default function SearchBar({
  placeholder = 'Search listings',
  onPress,
  value,
  onChangeText,
}: SearchBarProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.container}
      disabled={!onPress}
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textPrimaryOpacity[50]}
          value={value}
          onChangeText={onChangeText}
          editable={!!onChangeText}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    ...typography.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
});

