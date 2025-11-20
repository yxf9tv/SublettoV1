import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, typography } from '../theme';
import Typography, { H3, BodySmall } from './Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

interface FeaturedCardProps {
  imageUrl?: string;
  title: string;
  location: string;
  price: string;
  onPress?: () => void;
}

export default function FeaturedCard({
  imageUrl,
  title,
  location,
  price,
  onPress,
}: FeaturedCardProps) {
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
          <View style={styles.placeholderImage}>
            <Typography variant="body" style={styles.placeholderText}>
              No Image
            </Typography>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <H3 numberOfLines={1} style={styles.title}>
          {title}
        </H3>
        <BodySmall style={styles.location}>{location}</BodySmall>
        <View style={styles.footer}>
          <Typography variant="bodyMedium" style={styles.price}>
            {price}
          </Typography>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray[200],
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textPrimaryOpacity[50],
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 4,
  },
  location: {
    color: colors.textPrimaryOpacity[70],
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: colors.accentBlue,
    fontSize: 18,
  },
});

