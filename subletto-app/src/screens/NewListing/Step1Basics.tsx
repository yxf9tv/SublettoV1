import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { ListingFormData, LISTING_TYPE_OPTIONS } from './types';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

interface Props {
  formData: ListingFormData;
  updateFormData: (updates: Partial<ListingFormData>) => void;
}

export default function Step1Basics({ formData, updateFormData }: Props) {
  const placesRef = useRef<any>(null);

  const handlePlaceSelect = (data: any, details: any) => {
    if (!details) return;

    // Extract address components
    const addressComponents = details.address_components || [];
    let streetNumber = '';
    let route = '';
    let city = '';
    let state = '';
    let postalCode = '';

    for (const component of addressComponents) {
      const types = component.types;
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }
    }

    const addressLine1 = streetNumber ? `${streetNumber} ${route}` : route;
    const latitude = details.geometry?.location?.lat || null;
    const longitude = details.geometry?.location?.lng || null;

    updateFormData({
      addressLine1,
      city,
      state,
      postalCode,
      latitude,
      longitude,
    });
  };

  // Format current address for display
  const getDisplayAddress = () => {
    if (formData.addressLine1) {
      const parts = [formData.addressLine1];
      if (formData.city) parts.push(formData.city);
      if (formData.state) parts.push(formData.state);
      if (formData.postalCode) parts.push(formData.postalCode);
      return parts.join(', ');
    }
    return '';
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
      nestedScrollEnabled={true}
    >
      {/* Listing Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What type of listing is this?</Text>
        <View style={styles.typeOptions}>
          {LISTING_TYPE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.typeOption,
                formData.type === option.key && styles.typeOptionActive,
              ]}
              onPress={() => updateFormData({ type: option.key })}
              activeOpacity={0.7}
            >
              <View style={styles.typeOptionHeader}>
                <Text
                  style={[
                    styles.typeOptionLabel,
                    formData.type === option.key && styles.typeOptionLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
                {formData.type === option.key && (
                  <Ionicons name="checkmark-circle" size={20} color="#2C67FF" />
                )}
              </View>
              <Text style={styles.typeOptionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Give your listing a title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Sunny 2BR Apartment Near Campus"
          placeholderTextColor="#9CA3AF"
          value={formData.title}
          onChangeText={(text) => updateFormData({ title: text })}
          maxLength={100}
        />
        <Text style={styles.charCount}>{formData.title.length}/100</Text>
      </View>

      {/* Location with Google Places Autocomplete */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Where is your place?</Text>
        
        {GOOGLE_PLACES_API_KEY ? (
          <View style={styles.autocompleteContainer}>
            <GooglePlacesAutocomplete
              ref={placesRef}
              placeholder="Search for an address..."
              onPress={handlePlaceSelect}
              query={{
                key: GOOGLE_PLACES_API_KEY,
                language: 'en',
                types: 'address',
                components: 'country:us',
              }}
              fetchDetails={true}
              enablePoweredByContainer={false}
              debounce={300}
              minLength={3}
              styles={{
                textInputContainer: styles.autocompleteInputContainer,
                textInput: styles.autocompleteInput,
                listView: styles.autocompleteList,
                row: styles.autocompleteRow,
                description: styles.autocompleteDescription,
                separator: styles.autocompleteSeparator,
              }}
              textInputProps={{
                placeholderTextColor: '#9CA3AF',
              }}
            />
          </View>
        ) : (
          <Text style={styles.apiKeyWarning}>
            Google Places API key not configured. Using manual entry.
          </Text>
        )}

        {/* Display selected address or manual entry */}
        {formData.addressLine1 ? (
          <View style={styles.selectedAddressContainer}>
            <View style={styles.selectedAddressHeader}>
              <Ionicons name="location" size={20} color="#2C67FF" />
              <Text style={styles.selectedAddressLabel}>Selected Address</Text>
              <TouchableOpacity
                onPress={() => {
                  updateFormData({
                    addressLine1: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    latitude: null,
                    longitude: null,
                  });
                  placesRef.current?.setAddressText('');
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.selectedAddressText}>{getDisplayAddress()}</Text>
            {formData.latitude && formData.longitude && (
              <Text style={styles.coordinatesText}>
                📍 Coordinates captured for map display
              </Text>
            )}
          </View>
        ) : !GOOGLE_PLACES_API_KEY ? (
          // Manual entry fallback
          <>
            <TextInput
              style={styles.input}
              placeholder="Street Address"
              placeholderTextColor="#9CA3AF"
              value={formData.addressLine1}
              onChangeText={(text) => updateFormData({ addressLine1: text })}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="City"
                placeholderTextColor="#9CA3AF"
                value={formData.city}
                onChangeText={(text) => updateFormData({ city: text })}
              />
              <TextInput
                style={[styles.input, styles.inputQuarter]}
                placeholder="State"
                placeholderTextColor="#9CA3AF"
                value={formData.state}
                onChangeText={(text) => updateFormData({ state: text.toUpperCase() })}
                maxLength={2}
                autoCapitalize="characters"
              />
              <TextInput
                style={[styles.input, styles.inputQuarter]}
                placeholder="ZIP"
                placeholderTextColor="#9CA3AF"
                value={formData.postalCode}
                onChangeText={(text) => updateFormData({ postalCode: text })}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </>
        ) : null}
      </View>

      {/* Bottom padding for keyboard */}
      <View style={{ height: 200 }} />
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
    marginBottom: 12,
  },
  typeOptions: {
    gap: 12,
  },
  typeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeOptionActive: {
    borderColor: '#2C67FF',
    backgroundColor: '#F0F5FF',
  },
  typeOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  typeOptionLabelActive: {
    color: '#2C67FF',
  },
  typeOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: -8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 2,
  },
  inputQuarter: {
    flex: 1,
  },
  autocompleteContainer: {
    zIndex: 1000,
    marginBottom: 12,
  },
  autocompleteInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  autocompleteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 52,
  },
  autocompleteList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  autocompleteRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  autocompleteDescription: {
    fontSize: 14,
    color: '#111827',
  },
  autocompleteSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  selectedAddressContainer: {
    backgroundColor: '#F0F5FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C67FF',
    marginTop: 8,
  },
  selectedAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedAddressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C67FF',
    marginLeft: 8,
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
  selectedAddressText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 8,
  },
  apiKeyWarning: {
    fontSize: 14,
    color: '#F59E0B',
    marginBottom: 12,
    fontStyle: 'italic',
  },
});
