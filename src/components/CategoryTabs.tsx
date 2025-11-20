import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { colors, typography } from '../theme';
import Typography from './Typography';

export type ListingType = 'ALL' | 'SUBLET' | 'TAKEOVER' | 'ROOM';

interface CategoryTabsProps {
  selectedCategory: ListingType;
  onCategoryChange: (category: ListingType) => void;
}

const categories: { key: ListingType; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'SUBLET', label: 'Sublets' },
  { key: 'TAKEOVER', label: 'Lease Takeovers' },
  { key: 'ROOM', label: 'Rooms' },
];

export default function CategoryTabs({
  selectedCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const isSelected = selectedCategory === category.key;
        return (
          <TouchableOpacity
            key={category.key}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onCategoryChange(category.key)}
            activeOpacity={0.7}
          >
            <Typography
              variant={isSelected ? 'bodyMedium' : 'body'}
              style={[
                styles.pillText,
                isSelected && styles.pillTextSelected,
              ]}
            >
              {category.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  pillSelected: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },
  pillText: {
    color: colors.textPrimary,
  },
  pillTextSelected: {
    color: colors.card,
  },
});

