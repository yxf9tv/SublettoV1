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
  { key: 'ALL', label: 'Rental House' },
  { key: 'SUBLET', label: 'Apartment' },
  { key: 'TAKEOVER', label: 'Houses' },
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
            style={[
              styles.pill,
              isSelected && styles.pillSelected,
              category.key !== categories[categories.length - 1].key &&
                styles.pillMargin,
            ]}
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
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#F2F2F2',
    borderWidth: 0,
  },
  pillMargin: {
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: '#1E1E1E',
    borderColor: '#1E1E1E',
  },
  pillText: {
    color: colors.textPrimary,
  },
  pillTextSelected: {
    color: colors.card,
  },
});

