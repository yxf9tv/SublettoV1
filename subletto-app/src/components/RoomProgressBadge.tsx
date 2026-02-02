import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { formatProgress, formatSpotsLeft, BADGE_STYLES } from '../constants/room';

interface RoomProgressBadgeProps {
  filled: number;
  total: number;
  size?: 'small' | 'medium' | 'large';
  showSpotsLeft?: boolean;
  style?: ViewStyle;
}

export default function RoomProgressBadge({
  filled,
  total,
  size = 'medium',
  showSpotsLeft = false,
  style,
}: RoomProgressBadgeProps) {
  // Don't show badge if there's only 1 slot (entire place listing)
  if (total <= 1) {
    return null;
  }

  const isFull = filled >= total;
  const spotsLeft = total - filled;

  // Color based on urgency
  const badgeStyle = isFull
    ? BADGE_STYLES.full
    : spotsLeft <= 2
    ? BADGE_STYLES.partial  // Blue for urgency
    : BADGE_STYLES.empty;   // Gray for plenty of spots

  const sizeStyles = SIZE_STYLES[size];

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.badge,
          sizeStyles.badge,
          { backgroundColor: badgeStyle.background },
        ]}
      >
        <Text style={[styles.text, sizeStyles.text, { color: badgeStyle.text }]}>
          {isFull ? 'Full' : formatProgress(filled, total)}
        </Text>
      </View>
      {showSpotsLeft && !isFull && (
        <Text style={[styles.spotsLeft, sizeStyles.spotsLeft]}>
          {formatSpotsLeft(filled, total)}
        </Text>
      )}
    </View>
  );
}

// Square badge for listing cards - shows spots LEFT
export function RoomProgressSquare({
  filled,
  total,
  style,
}: {
  filled: number;
  total: number;
  style?: ViewStyle;
}) {
  if (total <= 1) {
    return null;
  }

  const spotsLeft = total - filled;
  const isFull = spotsLeft === 0;
  
  // More urgent colors as spots fill up
  let backgroundColor = '#2C67FF'; // Default blue
  if (isFull) {
    backgroundColor = '#10B981'; // Green for full
  } else if (spotsLeft <= 2) {
    backgroundColor = '#F59E0B'; // Orange for urgent
  }

  return (
    <View style={[styles.squareBadge, { backgroundColor }, style]}>
      <Text style={styles.squareNumber}>{spotsLeft}</Text>
      <Text style={styles.squareTotal}>/{total}</Text>
      <Text style={styles.squareLabel}>{isFull ? 'full' : 'left'}</Text>
    </View>
  );
}

// Compact version for map markers
export function RoomProgressBadgeCompact({
  filled,
  total,
}: {
  filled: number;
  total: number;
}) {
  if (total <= 1) {
    return null;
  }

  const left = total - filled;
  const isFull = left === 0;

  return (
    <View style={styles.compactBadge}>
      <Text style={styles.compactText}>
        {isFull ? 'Full' : `${left} left`}
      </Text>
    </View>
  );
}

const SIZE_STYLES = {
  small: StyleSheet.create({
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    text: {
      fontSize: 10,
      fontWeight: '600',
    },
    spotsLeft: {
      fontSize: 9,
      marginTop: 2,
    },
  }),
  medium: StyleSheet.create({
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
    },
    spotsLeft: {
      fontSize: 11,
      marginTop: 3,
    },
  }),
  large: StyleSheet.create({
    badge: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
    },
    text: {
      fontSize: 14,
      fontWeight: '700',
    },
    spotsLeft: {
      fontSize: 13,
      marginTop: 4,
    },
  }),
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  badge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.3,
  },
  spotsLeft: {
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  compactBadge: {
    backgroundColor: '#2C67FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  // Square badge styles
  squareBadge: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  squareNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  squareTotal: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: -2,
  },
  squareLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
});

