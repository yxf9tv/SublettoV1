import React, { useRef, useState } from 'react';
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
import { ListingFormData } from './types';

// Support both naming conventions for Google API key
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface Props {
  formData: ListingFormData;
  updateFormData: (updates: Partial<ListingFormData>) => void;
}

export default function Step1Basics({ formData, updateFormData }: Props) {
  const placesRef = useRef<any>(null);
  const [useManualEntry, setUseManualEntry] = useState(!GOOGLE_PLACES_API_KEY);

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
      {/* Room Details - Always visible since Room is the only listing type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Room Details</Text>
          
          {/* Number of Spots */}
          <View style={styles.roomFieldRow}>
            <Text style={styles.roomFieldLabel}>Number of spots</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => updateFormData({ totalSlots: Math.max(2, formData.totalSlots - 1) })}
              >
                <Ionicons name="remove" size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{formData.totalSlots}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => updateFormData({ totalSlots: Math.min(10, formData.totalSlots + 1) })}
              >
                <Ionicons name="add" size={20} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.roomFieldHint}>
            This is the total number of people who can commit to this unit
          </Text>

          {/* Price Per Spot */}
          <View style={styles.roomInputRow}>
            <Text style={styles.roomFieldLabel}>Price per spot</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={formData.pricePerSpot}
                onChangeText={(text) => updateFormData({ pricePerSpot: text.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
              />
              <Text style={styles.priceSuffix}>/mo</Text>
            </View>
          </View>

          {/* Lease Term */}
          <View style={styles.roomInputRow}>
            <Text style={styles.roomFieldLabel}>Lease term</Text>
            <View style={styles.leaseTermContainer}>
              <TextInput
                style={styles.leaseTermInput}
                placeholder="12"
                placeholderTextColor="#9CA3AF"
                value={formData.leaseTermMonths}
                onChangeText={(text) => updateFormData({ leaseTermMonths: text.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.leaseTermSuffix}>months</Text>
            </View>
          </View>

          {/* Requirements */}
          <View style={styles.roomInputRow}>
            <Text style={styles.roomFieldLabel}>Requirements (optional)</Text>
            <TextInput
              style={[styles.input, styles.requirementsInput]}
              placeholder="e.g., Credit 650+, Income 3x rent, No evictions"
              placeholderTextColor="#9CA3AF"
              value={formData.requirementsText}
              onChangeText={(text) => updateFormData({ requirementsText: text })}
              multiline
              numberOfLines={3}
            />
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

      {/* Location with Google Places Autocomplete or Manual Entry */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Where is your place?</Text>
        
        {/* Toggle between autocomplete and manual entry */}
        {GOOGLE_PLACES_API_KEY && (
          <View style={styles.entryModeToggle}>
            <TouchableOpacity
              style={[styles.entryModeButton, !useManualEntry && styles.entryModeButtonActive]}
              onPress={() => setUseManualEntry(false)}
            >
              <Ionicons name="search" size={16} color={!useManualEntry ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.entryModeText, !useManualEntry && styles.entryModeTextActive]}>
                Search
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.entryModeButton, useManualEntry && styles.entryModeButtonActive]}
              onPress={() => setUseManualEntry(true)}
            >
              <Ionicons name="create-outline" size={16} color={useManualEntry ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.entryModeText, useManualEntry && styles.entryModeTextActive]}>
                Manual
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Display selected address if we have one */}
        {formData.addressLine1 && !useManualEntry ? (
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
        ) : useManualEntry ? (
          // Manual entry mode
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
            <Text style={styles.manualEntryHint}>
              Note: Manual addresses won't appear on the map until geocoded
            </Text>
          </>
        ) : GOOGLE_PLACES_API_KEY ? (
          // Google Places Autocomplete
          <>
            <GooglePlacesAutocomplete
              ref={placesRef}
              placeholder="Start typing an address..."
              onPress={handlePlaceSelect}
              query={{
                key: GOOGLE_PLACES_API_KEY,
                language: 'en',
                types: 'address',
                components: 'country:us',
              }}
              fetchDetails={true}
              enablePoweredByContainer={false}
              debounce={200}
              minLength={3}
              nearbyPlacesAPI="GooglePlacesSearch"
              GooglePlacesSearchQuery={{
                rankby: 'distance',
              }}
              filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
              styles={{
                container: {
                  flex: 0,
                  zIndex: 10,
                },
                textInputContainer: {
                  backgroundColor: 'transparent',
                  width: '100%',
                },
                textInput: {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: '#111827',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  height: 52,
                },
                listView: {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  position: 'absolute',
                  top: 56,
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  elevation: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                },
                row: {
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: '#FFFFFF',
                },
                description: {
                  fontSize: 14,
                  color: '#111827',
                },
                separator: {
                  height: 1,
                  backgroundColor: '#F3F4F6',
                },
                poweredContainer: {
                  display: 'none',
                },
              }}
              textInputProps={{
                placeholderTextColor: '#9CA3AF',
                returnKeyType: 'search',
                autoCorrect: false,
                autoCapitalize: 'none',
              }}
              keyboardShouldPersistTaps="handled"
              listViewDisplayed="auto"
              renderRow={(data) => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 14, color: '#111827', flex: 1 }} numberOfLines={2}>
                    {data.description}
                  </Text>
                </View>
              )}
            />
            <View style={{ height: 60 }} />
            <Text style={styles.autocompleteHint}>
              Can't find your address? Tap "Manual" above to enter it yourself
            </Text>
          </>
        ) : (
          // No API key - show manual entry
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
        )}

        {/* Unit/Apt Number - Always visible when address is entered */}
        {(formData.addressLine1 || useManualEntry) && (
          <View style={styles.unitNumberContainer}>
            <Text style={styles.unitLabel}>Unit / Apt # (optional)</Text>
            <TextInput
              style={styles.unitInput}
              placeholder="e.g., Apt 4B, Unit 201, Suite 100"
              placeholderTextColor="#9CA3AF"
              value={formData.unitNumber}
              onChangeText={(text) => updateFormData({ unitNumber: text })}
              autoCapitalize="characters"
            />
          </View>
        )}
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
  entryModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  entryModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  entryModeButtonActive: {
    backgroundColor: '#2C67FF',
  },
  entryModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  entryModeTextActive: {
    color: '#FFFFFF',
  },
  manualEntryHint: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: -4,
    marginBottom: 8,
  },
  autocompleteHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  // Room-specific styles
  roomFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomFieldLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  roomFieldHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 4,
  },
  counterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
    textAlign: 'center',
  },
  roomInputRow: {
    marginBottom: 16,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  priceSuffix: {
    fontSize: 14,
    color: '#6B7280',
  },
  leaseTermContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  leaseTermInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 14,
    minWidth: 50,
  },
  leaseTermSuffix: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  requirementsInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // Unit number styles
  unitNumberContainer: {
    marginTop: 16,
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  unitInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
