import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ListingFormData } from './types';

interface Props {
  formData: ListingFormData;
  updateFormData: (updates: Partial<ListingFormData>) => void;
}

export default function Step2Details({ formData, updateFormData }: Props) {
  const incrementBedrooms = () => {
    if (formData.bedrooms < 10) {
      updateFormData({ bedrooms: formData.bedrooms + 1 });
    }
  };

  const decrementBedrooms = () => {
    if (formData.bedrooms > 0) {
      updateFormData({ bedrooms: formData.bedrooms - 1 });
    }
  };

  const incrementBathrooms = () => {
    if (formData.bathrooms < 10) {
      updateFormData({ bathrooms: formData.bathrooms + 0.5 });
    }
  };

  const decrementBathrooms = () => {
    if (formData.bathrooms > 0.5) {
      updateFormData({ bathrooms: formData.bathrooms - 0.5 });
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
    >
      {/* Price */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Rent</Text>
        <View style={styles.priceInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            value={formData.priceMonthly}
            onChangeText={(text) =>
              updateFormData({ priceMonthly: text.replace(/[^0-9]/g, '') })
            }
            keyboardType="numeric"
          />
          <Text style={styles.perMonth}>/month</Text>
        </View>
      </View>

      {/* Utilities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estimated Utilities</Text>
        <View style={styles.priceInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            value={formData.utilitiesMonthly}
            onChangeText={(text) =>
              updateFormData({ utilitiesMonthly: text.replace(/[^0-9]/g, '') })
            }
            keyboardType="numeric"
          />
          <Text style={styles.perMonth}>/month</Text>
        </View>
        <Text style={styles.hint}>Leave empty if included in rent</Text>
      </View>

      {/* Deposit */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Deposit</Text>
        <View style={styles.priceInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            value={formData.deposit}
            onChangeText={(text) =>
              updateFormData({ deposit: text.replace(/[^0-9]/g, '') })
            }
            keyboardType="numeric"
          />
        </View>
        <Text style={styles.hint}>Optional</Text>
      </View>

      {/* Bedrooms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bedrooms</Text>
        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={[
              styles.counterButton,
              formData.bedrooms === 0 && styles.counterButtonDisabled,
            ]}
            onPress={decrementBedrooms}
            disabled={formData.bedrooms === 0}
          >
            <Ionicons
              name="remove"
              size={24}
              color={formData.bedrooms === 0 ? '#D1D5DB' : '#111827'}
            />
          </TouchableOpacity>
          <Text style={styles.counterValue}>
            {formData.bedrooms === 0 ? 'Studio' : formData.bedrooms}
          </Text>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={incrementBedrooms}
          >
            <Ionicons name="add" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bathrooms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bathrooms</Text>
        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={[
              styles.counterButton,
              formData.bathrooms <= 0.5 && styles.counterButtonDisabled,
            ]}
            onPress={decrementBathrooms}
            disabled={formData.bathrooms <= 0.5}
          >
            <Ionicons
              name="remove"
              size={24}
              color={formData.bathrooms <= 0.5 ? '#D1D5DB' : '#111827'}
            />
          </TouchableOpacity>
          <Text style={styles.counterValue}>
            {formData.bathrooms % 1 === 0
              ? formData.bathrooms
              : formData.bathrooms.toFixed(1)}
          </Text>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={incrementBathrooms}
          >
            <Ionicons name="add" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Furnished */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.sectionTitle}>Furnished</Text>
            <Text style={styles.hint}>Is the place furnished?</Text>
          </View>
          <Switch
            value={formData.furnished}
            onValueChange={(value) => updateFormData({ furnished: value })}
            trackColor={{ false: '#D1D5DB', true: '#2C67FF' }}
            thumbColor="#FFFFFF"
          />
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
    marginBottom: 12,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  perMonth: {
    fontSize: 16,
    color: '#6B7280',
  },
  hint: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  counterValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    minWidth: 80,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
