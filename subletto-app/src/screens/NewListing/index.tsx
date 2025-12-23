import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ListingFormData, initialFormData, AmenityKey } from './types';
import Step1Basics from './Step1Basics';
import Step2Details from './Step2Details';
import Step3DatesAmenities from './Step3DatesAmenities';
import Step4PhotosDescription from './Step4PhotosDescription';
import {
  createListingWithImages,
  CreateListingPayload,
} from '../../lib/listingsApi';
import { useAuthStore } from '../../store/authStore';

type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: { listingId: string };
  NewListing: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STEPS = [
  { key: 1, title: 'Basics', subtitle: 'Type, title & location' },
  { key: 2, title: 'Details', subtitle: 'Price & specifications' },
  { key: 3, title: 'Dates & Amenities', subtitle: 'Availability & features' },
  { key: 4, title: 'Photos & Description', subtitle: 'Showcase your place' },
];

// Simple geocoding for common cities (fallback coordinates)
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'charlottesville': { lat: 38.0293, lng: -78.4767 },
  'richmond': { lat: 37.5407, lng: -77.4360 },
  'washington': { lat: 38.9072, lng: -77.0369 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'houston': { lat: 29.7604, lng: -95.3698 },
  'phoenix': { lat: 33.4484, lng: -112.0740 },
  'philadelphia': { lat: 39.9526, lng: -75.1652 },
  'san antonio': { lat: 29.4241, lng: -98.4936 },
  'san diego': { lat: 32.7157, lng: -117.1611 },
  'dallas': { lat: 32.7767, lng: -96.7970 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'austin': { lat: 30.2672, lng: -97.7431 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'boston': { lat: 42.3601, lng: -71.0589 },
  'denver': { lat: 39.7392, lng: -104.9903 },
  'atlanta': { lat: 33.7490, lng: -84.3880 },
  'miami': { lat: 25.7617, lng: -80.1918 },
  'nashville': { lat: 36.1627, lng: -86.7816 },
};

function getCityCoordinates(city: string): { lat: number; lng: number } | null {
  const normalizedCity = city.toLowerCase().trim();
  return CITY_COORDINATES[normalizedCity] || null;
}

export default function NewListingWizard() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (updates: Partial<ListingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          Alert.alert('Missing Info', 'Please enter a title for your listing');
          return false;
        }
        if (!formData.city.trim() || !formData.state.trim()) {
          Alert.alert('Missing Info', 'Please enter the city and state');
          return false;
        }
        return true;
      case 2:
        if (!formData.priceMonthly || parseInt(formData.priceMonthly) <= 0) {
          Alert.alert('Missing Info', 'Please enter a monthly rent price');
          return false;
        }
        return true;
      case 3:
        // Dates are optional for now
        return true;
      case 4:
        if (formData.photos.length < 1) {
          Alert.alert('Missing Info', 'Please add at least one photo');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Discard Listing?',
      'Are you sure you want to discard this listing?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setFormData(initialFormData);
            setCurrentStep(1);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    // Convert amenities array to object
    const amenitiesObj: Record<string, boolean> = {};
    formData.amenities.forEach((key: AmenityKey) => {
      amenitiesObj[key] = true;
    });

    // Try to get coordinates for the city
    const cityCoords = formData.city ? getCityCoordinates(formData.city) : null;

    // Build payload
    const payload: CreateListingPayload = {
      title: formData.title,
      description: formData.description || undefined,
      type: formData.type,
      price_monthly: parseInt(formData.priceMonthly) || 0,
      utilities_monthly: formData.utilitiesMonthly
        ? parseInt(formData.utilitiesMonthly)
        : 0,
      deposit: formData.deposit ? parseInt(formData.deposit) : 0,
      address_line1: formData.addressLine1 || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      postal_code: formData.postalCode || undefined,
      latitude: formData.latitude || cityCoords?.lat,
      longitude: formData.longitude || cityCoords?.lng,
      start_date: formData.startDate
        ? formData.startDate.toISOString().split('T')[0]
        : undefined,
      end_date: formData.endDate
        ? formData.endDate.toISOString().split('T')[0]
        : undefined,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      furnished: formData.furnished,
      amenities: amenitiesObj,
    };

    // Check if user is authenticated
    if (!user?.id) {
      Alert.alert(
        'Preview Mode',
        `Your listing "${formData.title}" looks great!\n\n` +
          `Type: ${formData.type}\n` +
          `Price: $${formData.priceMonthly}/mo\n` +
          `Bedrooms: ${formData.bedrooms === 0 ? 'Studio' : formData.bedrooms}\n` +
          `Bathrooms: ${formData.bathrooms}\n` +
          `Photos: ${formData.photos.length}\n\n` +
          'Sign in to publish your listing.',
        [
          { text: 'Edit', style: 'cancel' },
          {
            text: 'Done',
            onPress: () => {
              setFormData(initialFormData);
              setCurrentStep(1);
              navigation.goBack();
            },
          },
        ]
      );
      return;
    }

    // Submit to Supabase
    setIsSubmitting(true);
    try {
      const imageUris = formData.photos.map((p) => p.uri);
      const listing = await createListingWithImages(payload, user.id, imageUris);

      Alert.alert('Success!', 'Your listing has been published.', [
        {
          text: 'View Listing',
          onPress: () => {
            setFormData(initialFormData);
            setCurrentStep(1);
            navigation.navigate('ListingDetail', { listingId: listing.id });
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create listing'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Basics formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step2Details formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step3DatesAmenities formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Step4PhotosDescription formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  const currentStepInfo = STEPS[currentStep - 1];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={goBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{currentStepInfo.title}</Text>
              <Text style={styles.headerSubtitle}>{currentStepInfo.subtitle}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            {STEPS.map((step) => (
              <View
                key={step.key}
                style={[
                  styles.progressStep,
                  step.key <= currentStep && styles.progressStepActive,
                ]}
              />
            ))}
          </View>

          {/* Step Content */}
          <View style={styles.content}>{renderStep()}</View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={goBack}
                disabled={isSubmitting}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                currentStep === 1 && styles.primaryButtonFull,
                isSubmitting && styles.primaryButtonDisabled,
              ]}
              onPress={goNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {currentStep === 4 ? 'Preview & Publish' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  progressStepActive: {
    backgroundColor: '#2C67FF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
});
