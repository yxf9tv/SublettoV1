import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../theme';
import Typography, { BodySmall, Caption } from './Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 8) / 2; // Screen width - padding - gap between cards

interface PropertyGridCardProps {
  imageUrl?: string;
  title: string;
  location: string;
  price: string;
  rating?: number;
  onPress?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function PropertyGridCard({
  imageUrl,
  title,
  location,
  price,
  rating = 4.5,
  onPress,
  onSave,
  isSaved = false,
}: PropertyGridCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage} />
        )}
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          start={{ x: 0, y: 0.6 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        />

        {/* Checkmark Icon (Verified) */}
        <View style={styles.checkmarkButton}>
          <Typography variant="body" style={styles.checkmark}>
            ✓
          </Typography>
        </View>

        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <BodySmall style={styles.priceText}>{price}</BodySmall>
        </View>

        {/* Bottom Content */}
        <View style={styles.bottomContent}>
          {/* Rating Badge */}
          <View style={styles.ratingBadge}>
            <Typography variant="caption" style={styles.star}>
              ⭐
            </Typography>
            <View style={{ width: 3 }} />
            <Caption style={styles.ratingText}>{rating}</Caption>
          </View>

          {/* Property Info */}
          <View style={styles.propertyInfo}>
            <BodySmall numberOfLines={1} style={styles.title}>
              {title}
            </BodySmall>
            <View style={styles.locationRow}>
              <Typography variant="caption" style={styles.pinIcon}>
                📍
              </Typography>
              <View style={{ width: 2 }} />
              <Caption numberOfLines={1} style={styles.location}>
                {location}
              </Caption>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 13,
  },
  imageContainer: {
    width: '100%',
    height: 187,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: 'rgba(30, 30, 30, 0.15)',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[300],
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  checkmarkButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentBlue,
    borderRadius: 12,
  },
  checkmark: {
    fontSize: 16,
    color: colors.card,
    fontWeight: 'bold',
  },
  priceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 22,
  },
  priceText: {
    color: colors.card,
    fontSize: 10,
    fontWeight: '500',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 20,
    marginBottom: 2,
  },
  star: {
    fontSize: 9,
  },
  ratingText: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: '500',
  },
  propertyInfo: {
    marginTop: 2,
  },
  title: {
    color: colors.card,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    fontSize: 12,
  },
  location: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '500',
  },
});

