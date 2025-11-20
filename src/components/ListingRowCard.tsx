import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { colors, typography } from '../theme';
import Typography, { Body, BodySmall, Caption } from './Typography';

interface ListingRowCardProps {
  imageUrl?: string;
  title: string;
  location: string;
  price: string;
  tag: string;
  onPress?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function ListingRowCard({
  imageUrl,
  title,
  location,
  price,
  tag,
  onPress,
  onSave,
  isSaved = false,
}: ListingRowCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Typography variant="caption" style={styles.placeholderText}>
              No Image
            </Typography>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Body numberOfLines={2} style={styles.title}>
            {title}
          </Body>
          <TouchableOpacity
            onPress={onSave}
            style={styles.saveButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Typography variant="body" style={styles.heart}>
              {isSaved ? '❤️' : '🤍'}
            </Typography>
          </TouchableOpacity>
        </View>
        <BodySmall style={styles.location}>{location}</BodySmall>
        <View style={styles.footer}>
          <View style={styles.tagContainer}>
            <Caption style={styles.tag}>{tag}</Caption>
          </View>
          <Body style={styles.price}>{price}</Body>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray[200],
    marginRight: 12,
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
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    padding: 4,
  },
  heart: {
    fontSize: 20,
  },
  location: {
    color: colors.textPrimaryOpacity[70],
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagContainer: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tag: {
    color: colors.textPrimary,
    fontSize: 11,
  },
  price: {
    color: colors.accentBlue,
    fontWeight: '600',
  },
});

