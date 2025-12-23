import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ListingFormData, PhotoItem } from './types';

interface Props {
  formData: ListingFormData;
  updateFormData: (updates: Partial<ListingFormData>) => void;
}

export default function Step4PhotosDescription({ formData, updateFormData }: Props) {
  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload photos.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto: PhotoItem = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `photo_${formData.photos.length + 1}.jpg`,
        };
        updateFormData({ photos: [...formData.photos, newPhoto] });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos.'
        );
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto: PhotoItem = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `photo_${formData.photos.length + 1}.jpg`,
        };
        updateFormData({ photos: [...formData.photos, newPhoto] });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const addPhoto = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
      ]
    );
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...formData.photos];
    newPhotos.splice(index, 1);
    updateFormData({ photos: newPhotos });
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <Text style={styles.sectionSubtitle}>
          Add at least 1 photo of your place (up to 10)
        </Text>
        
        <View style={styles.photosGrid}>
          {formData.photos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              {index === 0 && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>Cover</Text>
                </View>
              )}
            </View>
          ))}
          
          {formData.photos.length < 10 && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={addPhoto}>
              <Ionicons name="camera-outline" size={32} color="#6B7280" />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.photoCount}>
          {formData.photos.length}/10 photos
        </Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.sectionSubtitle}>
          Tell potential renters about your place
        </Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Describe your place, the neighborhood, nearby amenities, house rules, and anything else that would help renters..."
          placeholderTextColor="#9CA3AF"
          value={formData.description}
          onChangeText={(text) => updateFormData({ description: text })}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={2000}
        />
        <Text style={styles.charCount}>{formData.description.length}/2000</Text>
      </View>

      {/* Preview hint */}
      <View style={styles.previewHint}>
        <Ionicons name="information-circle" size={20} color="#2C67FF" />
        <Text style={styles.previewHintText}>
          Tap "Preview & Publish" to see how your listing will appear to renters
        </Text>
      </View>
      
      {/* Bottom spacing for keyboard */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  coverBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addPhotoButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  photoCount: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 150,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  previewHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  previewHintText: {
    flex: 1,
    fontSize: 14,
    color: '#2C67FF',
  },
});
