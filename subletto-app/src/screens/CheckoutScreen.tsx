import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getCheckoutSessionById,
  cancelCheckout,
  completeCheckout,
  getTimeRemaining,
  CheckoutSessionWithListing,
} from '../lib/checkoutApi';
import { CHECKOUT_WARNING_THRESHOLD_SECONDS } from '../constants/room';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

type RootStackParamList = {
  MainTabs: undefined;
  Checkout: { sessionId: string };
  BookingConfirmation: { bookingId: string };
};

type CheckoutRouteProp = RouteProp<RootStackParamList, 'Checkout'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Step = 'details' | 'verification' | 'agreement' | 'confirm';

const STEPS: { key: Step; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'details', title: 'Details', icon: 'document-text' },
  { key: 'verification', title: 'Verify', icon: 'shield-checkmark' },
  { key: 'agreement', title: 'Agreement', icon: 'checkmark-circle' },
  { key: 'confirm', title: 'Confirm', icon: 'card' },
];

export default function CheckoutScreen() {
  const route = useRoute<CheckoutRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { sessionId } = route.params;

  const [session, setSession] = useState<CheckoutSessionWithListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [timeRemaining, setTimeRemaining] = useState({ minutes: 15, seconds: 0, isExpired: false });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [verificationChecks, setVerificationChecks] = useState({
    income: false,
    credit: false,
    references: false,
  });

  // Load session data
  useFocusEffect(
    useCallback(() => {
      loadSession();
    }, [sessionId])
  );

  // Timer effect
  useEffect(() => {
    if (!session?.expires_at) return;

    const timer = setInterval(() => {
      const remaining = getTimeRemaining(session.expires_at);
      setTimeRemaining(remaining);

      if (remaining.isExpired) {
        clearInterval(timer);
        handleSessionExpired();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.expires_at]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await getCheckoutSessionById(sessionId);
      
      if (!data) {
        Alert.alert('Session Not Found', 'This checkout session no longer exists.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }

      if (data.state !== 'ACTIVE') {
        Alert.alert('Session Ended', 'This checkout session has ended.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }

      const remaining = getTimeRemaining(data.expires_at);
      if (remaining.isExpired) {
        handleSessionExpired();
        return;
      }

      setSession(data);
      setTimeRemaining(remaining);
    } catch (error) {
      console.error('Failed to load session:', error);
      Alert.alert('Error', 'Failed to load checkout session.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionExpired = () => {
    Alert.alert(
      'Session Expired',
      'Your checkout session has expired. The room is now available for others to book.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Checkout?',
      'Are you sure you want to cancel? The room will become available for others.',
      [
        { text: 'No, Continue', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            try {
              await cancelCheckout(sessionId, user.id);
              navigation.goBack();
            } catch (error) {
              console.error('Failed to cancel:', error);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleNextStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].key);
    }
  };

  const handlePrevStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].key);
    }
  };

  const handleComplete = async () => {
    if (!user?.id || !session) return;

    setSubmitting(true);
    try {
      const startDate = session.move_in_date 
        ? new Date(session.move_in_date)
        : new Date();
      
      let endDate: Date | undefined;
      if (session.lease_months) {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + session.lease_months);
      }

      const bookingId = await completeCheckout(sessionId, user.id, startDate, endDate);
      
      // Navigate to confirmation
      navigation.reset({
        index: 0,
        routes: [
          { name: 'MainTabs' },
          { name: 'BookingConfirmation', params: { bookingId } },
        ],
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete booking');
    } finally {
      setSubmitting(false);
    }
  };

  const isWarningTime = timeRemaining.totalSeconds <= CHECKOUT_WARNING_THRESHOLD_SECONDS;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) return null;

  const listing = session.listing;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Timer */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={[styles.timerContainer, isWarningTime && styles.timerWarning]}>
          <Ionicons 
            name="time-outline" 
            size={18} 
            color={isWarningTime ? '#DC2626' : colors.textSecondary} 
          />
          <Text style={[styles.timerText, isWarningTime && styles.timerTextWarning]}>
            {String(timeRemaining.minutes).padStart(2, '0')}:
            {String(timeRemaining.seconds).padStart(2, '0')}
          </Text>
        </View>
        
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        {STEPS.map((step, index) => {
          const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
          const isActive = step.key === currentStep;
          const isCompleted = index < currentIndex;

          return (
            <View key={step.key} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isActive && styles.stepNumberActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                ]}
              >
                {step.title}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Listing Summary Card */}
        <View style={styles.listingCard}>
          <Text style={styles.listingTitle}>{listing?.title || 'Room'}</Text>
          <Text style={styles.listingAddress}>
            {listing?.address_line1}, {listing?.city}, {listing?.state}
          </Text>
          <View style={styles.listingDetails}>
            {listing?.bedrooms && (
              <Text style={styles.listingDetail}>
                {listing.bedrooms} bed{listing.bedrooms > 1 ? 's' : ''}
              </Text>
            )}
            {listing?.bathrooms && (
              <Text style={styles.listingDetail}>
                {listing.bathrooms} bath{listing.bathrooms > 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <Text style={styles.listingPrice}>
            ${session.price_snapshot.toLocaleString()}/mo
          </Text>
        </View>

        {/* Step Content */}
        {currentStep === 'details' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirm Booking Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Monthly Rent</Text>
              <Text style={styles.detailValue}>
                ${session.price_snapshot.toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Move-in Date</Text>
              <Text style={styles.detailValue}>
                {session.move_in_date 
                  ? new Date(session.move_in_date).toLocaleDateString()
                  : 'Flexible'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lease Length</Text>
              <Text style={styles.detailValue}>
                {session.lease_months 
                  ? `${session.lease_months} months`
                  : 'Flexible'}
              </Text>
            </View>
          </View>
        )}

        {currentStep === 'verification' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Quick Verification</Text>
            <Text style={styles.stepDescription}>
              Confirm the following to proceed with your booking.
            </Text>

            <TouchableOpacity
              style={styles.checkItem}
              onPress={() => setVerificationChecks(v => ({ ...v, income: !v.income }))}
            >
              <Ionicons
                name={verificationChecks.income ? 'checkbox' : 'square-outline'}
                size={24}
                color={verificationChecks.income ? colors.success : colors.textSecondary}
              />
              <Text style={styles.checkLabel}>
                I can provide proof of income (pay stubs, offer letter, etc.)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkItem}
              onPress={() => setVerificationChecks(v => ({ ...v, credit: !v.credit }))}
            >
              <Ionicons
                name={verificationChecks.credit ? 'checkbox' : 'square-outline'}
                size={24}
                color={verificationChecks.credit ? colors.success : colors.textSecondary}
              />
              <Text style={styles.checkLabel}>
                I consent to a credit/background check if required
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkItem}
              onPress={() => setVerificationChecks(v => ({ ...v, references: !v.references }))}
            >
              <Ionicons
                name={verificationChecks.references ? 'checkbox' : 'square-outline'}
                size={24}
                color={verificationChecks.references ? colors.success : colors.textSecondary}
              />
              <Text style={styles.checkLabel}>
                I can provide references from previous landlords or employers
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 'agreement' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Booking Agreement</Text>
            
            <View style={styles.agreementBox}>
              <Text style={styles.agreementText}>
                By proceeding, I understand and agree that:{'\n\n'}
                • My booking request will be sent to the host for confirmation{'\n\n'}
                • The host has 24 hours to confirm or decline my request{'\n\n'}
                • Once confirmed, I will coordinate directly with the host for move-in details{'\n\n'}
                • I am responsible for reviewing and signing the actual lease agreement with the host
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkItem}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <Ionicons
                name={agreedToTerms ? 'checkbox' : 'square-outline'}
                size={24}
                color={agreedToTerms ? colors.success : colors.textSecondary}
              />
              <Text style={styles.checkLabel}>
                I agree to Room's Terms of Service and Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 'confirm' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirm Your Booking</Text>
            
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Room</Text>
                <Text style={styles.summaryValue}>{listing?.title}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Location</Text>
                <Text style={styles.summaryValue}>
                  {listing?.city}, {listing?.state}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Monthly Rent</Text>
                <Text style={styles.summaryValue}>
                  ${session.price_snapshot.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Move-in</Text>
                <Text style={styles.summaryValue}>
                  {session.move_in_date 
                    ? new Date(session.move_in_date).toLocaleDateString()
                    : 'Flexible'}
                </Text>
              </View>
            </View>

            <View style={styles.noteBox}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.noteText}>
                You won't be charged anything now. The host will review your request and confirm within 24 hours.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        {currentStep !== 'details' && (
          <TouchableOpacity style={styles.backButton} onPress={handlePrevStep}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flex: 1 }} />
        
        {currentStep !== 'confirm' ? (
          <TouchableOpacity
            style={[
              styles.nextButton,
              currentStep === 'verification' && 
                !Object.values(verificationChecks).every(Boolean) &&
                styles.nextButtonDisabled,
              currentStep === 'agreement' && !agreedToTerms && styles.nextButtonDisabled,
            ]}
            onPress={handleNextStep}
            disabled={
              (currentStep === 'verification' && !Object.values(verificationChecks).every(Boolean)) ||
              (currentStep === 'agreement' && !agreedToTerms)
            }
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
            onPress={handleComplete}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Request Booking</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerWarning: {
    backgroundColor: '#FEE2E2',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timerTextWarning: {
    color: '#DC2626',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: colors.success,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 20,
  },
  listingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  listingAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  listingDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  listingDetail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  listingPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  stepContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  agreementBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  agreementText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
