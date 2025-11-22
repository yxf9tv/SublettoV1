import React from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import { colors, typography } from '../theme';
import Typography from './Typography';

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
        <Typography variant="body" style={styles.searchIcon}>
          🔍
        </Typography>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textPrimaryOpacity[50]}
          value={value}
          onChangeText={onChangeText}
          editable={!!onChangeText}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Typography variant="body" style={styles.filterIcon}>
            ☰
          </Typography>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  input: {
    ...typography.body,
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  filterButton: {
    padding: 4,
  },
  filterIcon: {
    fontSize: 24,
  },
});

