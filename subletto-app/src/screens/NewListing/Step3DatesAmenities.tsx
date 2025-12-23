import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ListingFormData, AmenityKey, AMENITY_OPTIONS } from './types';

interface Props {
  formData: ListingFormData;
  updateFormData: (updates: Partial<ListingFormData>) => void;
}

export default function Step3DatesAmenities({ formData, updateFormData }: Props) {
  const toggleAmenity = (amenity: AmenityKey) => {
    const currentAmenities = formData.amenities;
    if (currentAmenities.includes(amenity)) {
      updateFormData({
        amenities: currentAmenities.filter((a) => a !== amenity),
      });
    } else {
      updateFormData({
        amenities: [...currentAmenities, amenity],
      });
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Simple date selection - in a real app, use a date picker library
  const selectStartDate = () => {
    // For now, set to today
    updateFormData({ startDate: new Date() });
  };

  const selectEndDate = () => {
    // For now, set to 3 months from now
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    updateFormData({ endDate });
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
    >
      {/* Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Availability Dates</Text>
        <View style={styles.datesRow}>
          <TouchableOpacity style={styles.dateButton} onPress={selectStartDate}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <View style={styles.dateValueRow}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text
                style={[
                  styles.dateValue,
                  !formData.startDate && styles.dateValuePlaceholder,
                ]}
              >
                {formatDate(formData.startDate)}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={selectEndDate}>
            <Text style={styles.dateLabel}>End Date</Text>
            <View style={styles.dateValueRow}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text
                style={[
                  styles.dateValue,
                  !formData.endDate && styles.dateValuePlaceholder,
                ]}
              >
                {formatDate(formData.endDate)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          Tap to select dates (demo sets default values)
        </Text>
      </View>

      {/* Amenities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <Text style={styles.sectionSubtitle}>
          Select all that apply to your listing
        </Text>
        <View style={styles.amenitiesGrid}>
          {AMENITY_OPTIONS.map((amenity) => {
            const isSelected = formData.amenities.includes(amenity.key);
            return (
              <TouchableOpacity
                key={amenity.key}
                style={[
                  styles.amenityItem,
                  isSelected && styles.amenityItemActive,
                ]}
                onPress={() => toggleAmenity(amenity.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={amenity.icon as any}
                  size={24}
                  color={isSelected ? '#2C67FF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.amenityLabel,
                    isSelected && styles.amenityLabelActive,
                  ]}
                >
                  {amenity.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {/* Bottom padding for keyboard */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  datesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  dateValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  dateValuePlaceholder: {
    color: '#9CA3AF',
  },
  hint: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    position: 'relative',
  },
  amenityItemActive: {
    borderColor: '#2C67FF',
    backgroundColor: '#F0F5FF',
  },
  amenityLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  amenityLabelActive: {
    color: '#2C67FF',
    fontWeight: '500',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2C67FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


