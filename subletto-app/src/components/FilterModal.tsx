import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterState {
  search: string;
  city: string;
  state: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: number | null;
  furnished: boolean | null;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onChange: (filters: FilterState) => void;
  initialFilters: FilterState;
}

export default function FilterModal({
  visible,
  onClose,
  onChange,
  initialFilters,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(initialFilters);
  const [priceError, setPriceError] = useState('');

  // Sync with parent filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(initialFilters);
      setPriceError('');
    }
  }, [visible, initialFilters]);

  // Validate price range
  useEffect(() => {
    const min = parseInt(localFilters.minPrice);
    const max = parseInt(localFilters.maxPrice);

    if (localFilters.minPrice && localFilters.maxPrice && min > max) {
      setPriceError('Min price must be less than max price');
    } else {
      setPriceError('');
    }
  }, [localFilters.minPrice, localFilters.maxPrice]);

  const updateFilter = (updates: Partial<FilterState>) => {
    const newFilters = { ...localFilters, ...updates };
    setLocalFilters(newFilters);
    // Real-time update to parent
    onChange(newFilters);
  };

  const handleClearAll = () => {
    const clearedFilters: FilterState = {
      search: localFilters.search, // Keep search as is
      city: '',
      state: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: null,
      furnished: null,
    };
    setLocalFilters(clearedFilters);
    onChange(clearedFilters);
  };

  const handleClose = () => {
    setPriceError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="San Francisco"
                placeholderTextColor="#9CA3AF"
                value={localFilters.city}
                onChangeText={(text) => updateFilter({ city: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="CA"
                placeholderTextColor="#9CA3AF"
                value={localFilters.state}
                onChangeText={(text) =>
                  updateFilter({ state: text.toUpperCase() })
                }
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>

          {/* Price Range Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>

            <View style={styles.priceRow}>
              <View style={styles.priceInputGroup}>
                <Text style={styles.inputLabel}>Min</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={localFilters.minPrice}
                    onChangeText={(text) =>
                      updateFilter({ minPrice: text.replace(/[^0-9]/g, '') })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.priceInputGroup}>
                <Text style={styles.inputLabel}>Max</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="5000"
                    placeholderTextColor="#9CA3AF"
                    value={localFilters.maxPrice}
                    onChangeText={(text) =>
                      updateFilter({ maxPrice: text.replace(/[^0-9]/g, '') })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {priceError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{priceError}</Text>
              </View>
            ) : null}
          </View>

          {/* Bedrooms Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bedrooms</Text>

            <View style={styles.counterRow}>
              {localFilters.bedrooms === null ? (
                <View style={styles.anyActive}>
                  <Text style={styles.anyActiveText}>Any</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.anyButton}
                  onPress={() => updateFilter({ bedrooms: null })}
                >
                  <Text style={styles.anyButtonText}>Any</Text>
                </TouchableOpacity>
              )}

              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={[
                    styles.counterButton,
                    (localFilters.bedrooms === null || localFilters.bedrooms <= 0) &&
                      styles.counterButtonDisabled,
                  ]}
                  onPress={() =>
                    updateFilter({
                      bedrooms: Math.max(
                        0,
                        (localFilters.bedrooms ?? 1) - 1
                      ),
                    })
                  }
                  disabled={
                    localFilters.bedrooms === null || localFilters.bedrooms <= 0
                  }
                >
                  <Ionicons name="remove" size={20} color="#111827" />
                </TouchableOpacity>

                <Text style={styles.counterValue}>
                  {localFilters.bedrooms === null
                    ? '-'
                    : localFilters.bedrooms === 0
                    ? 'Studio'
                    : localFilters.bedrooms}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.counterButton,
                    (localFilters.bedrooms !== null && localFilters.bedrooms >= 10) &&
                      styles.counterButtonDisabled,
                  ]}
                  onPress={() =>
                    updateFilter({
                      bedrooms: Math.min(
                        10,
                        (localFilters.bedrooms ?? 0) + 1
                      ),
                    })
                  }
                  disabled={
                    localFilters.bedrooms !== null && localFilters.bedrooms >= 10
                  }
                >
                  <Ionicons name="add" size={20} color="#111827" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Furnished Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Furnished</Text>

            <View style={styles.toggleButtons}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  localFilters.furnished === null && styles.toggleButtonActive,
                ]}
                onPress={() => updateFilter({ furnished: null })}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    localFilters.furnished === null &&
                      styles.toggleButtonTextActive,
                  ]}
                >
                  Any
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  localFilters.furnished === true && styles.toggleButtonActive,
                ]}
                onPress={() => updateFilter({ furnished: true })}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    localFilters.furnished === true &&
                      styles.toggleButtonTextActive,
                  ]}
                >
                  Furnished
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  localFilters.furnished === false &&
                    styles.toggleButtonActive,
                ]}
                onPress={() => updateFilter({ furnished: false })}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    localFilters.furnished === false &&
                      styles.toggleButtonTextActive,
                  ]}
                >
                  Unfurnished
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Clear All Button */}
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
          >
            <Text style={styles.clearAllButtonText}>Clear All</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Poppins-Medium',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInputGroup: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 4,
    fontFamily: 'Poppins-Medium',
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Poppins-Regular',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    marginLeft: 6,
    fontFamily: 'Poppins-Regular',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  anyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  anyButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Poppins-Medium',
  },
  anyActive: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  anyActiveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonDisabled: {
    opacity: 0.3,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 60,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Poppins-Medium',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  clearAllButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  clearAllButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Poppins-SemiBold',
  },
});
