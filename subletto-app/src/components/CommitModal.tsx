import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LOCK_DURATION_HOURS } from '../constants/room';

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

interface CommitModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (checklistAnswers: Record<string, boolean>) => Promise<void>;
  listingTitle: string;
  pricePerSpot: number;
  leaseTermMonths: number | null;
  startDate: string | null;
  utilitiesIncluded: boolean;
  requirementsText: string | null;
}

export default function CommitModal({
  visible,
  onClose,
  onConfirm,
  listingTitle,
  pricePerSpot,
  leaseTermMonths,
  startDate,
  utilitiesIncluded,
  requirementsText,
}: CommitModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate checklist items based on listing info
  const checklistItems: ChecklistItem[] = [
    {
      id: 'lease_term',
      label: `Lease term is ${leaseTermMonths ? `${leaseTermMonths} months` : 'as specified'}`,
      required: true,
    },
    {
      id: 'rent',
      label: `Rent is $${pricePerSpot.toLocaleString()} / month`,
      required: true,
    },
    {
      id: 'start_date',
      label: `Start date is ${startDate ? new Date(startDate).toLocaleDateString() : 'flexible'}`,
      required: true,
    },
    {
      id: 'utilities',
      label: `Utilities: ${utilitiesIncluded ? 'Included' : 'Not included'}`,
      required: true,
    },
    {
      id: 'lock_expiration',
      label: `I understand this commitment expires in ${LOCK_DURATION_HOURS} hours`,
      required: true,
    },
  ];

  // Add requirements item if present
  if (requirementsText) {
    checklistItems.push({
      id: 'requirements',
      label: `I meet the listed requirements`,
      required: true,
    });
  }

  const toggleItem = (id: string) => {
    setChecklist((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const allRequiredChecked = checklistItems
    .filter((item) => item.required)
    .every((item) => checklist[item.id]);

  const handleContinue = () => {
    if (allRequiredChecked) {
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      await onConfirm(checklist);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock spot');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setChecklist({});
    setError(null);
    onClose();
  };

  const renderStep1 = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Confirm Details</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.listingTitle}>{listingTitle}</Text>
        <Text style={styles.description}>
          Please confirm you understand and agree to the following:
        </Text>

        <View style={styles.checklistContainer}>
          {checklistItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.checklistItem}
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  checklist[item.id] && styles.checkboxChecked,
                ]}
              >
                {checklist[item.id] && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checklistLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {requirementsText && (
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>Listing Requirements</Text>
            <Text style={styles.requirementsText}>{requirementsText}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !allRequiredChecked && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!allRequiredChecked}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Lock</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.lockIconContainer}>
          <Ionicons name="lock-closed" size={48} color="#2C67FF" />
        </View>

        <Text style={styles.confirmTitle}>
          Lock this spot for {LOCK_DURATION_HOURS} hours?
        </Text>

        <View style={styles.warningBox}>
          <Ionicons name="information-circle" size={20} color="#D97706" />
          <Text style={styles.warningText}>
            You can only have one active commitment at a time.
          </Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Listing</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {listingTitle}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Rent</Text>
            <Text style={styles.summaryValue}>
              ${pricePerSpot.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Lock Duration</Text>
            <Text style={styles.summaryValue}>{LOCK_DURATION_HOURS} hours</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.lockButton, loading && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
              <Text style={styles.lockButtonText}>Lock this spot</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {step === 1 ? renderStep1() : renderStep2()}
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
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  listingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
  },
  checklistContainer: {
    marginBottom: 20,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2C67FF',
    borderColor: '#2C67FF',
  },
  checklistLabel: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontFamily: 'Poppins-Regular',
  },
  requirementsBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  requirementsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#2C67FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  lockIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Poppins-Bold',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    marginLeft: 12,
    fontFamily: 'Poppins-Regular',
  },
  summaryBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    maxWidth: '60%',
    fontFamily: 'Poppins-Medium',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#B91C1C',
    marginLeft: 8,
    fontFamily: 'Poppins-Regular',
  },
  lockButton: {
    backgroundColor: '#2C67FF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
});

