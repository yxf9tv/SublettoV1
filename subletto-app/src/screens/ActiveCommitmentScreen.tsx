import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import {
  getActiveCommitment,
  cancelCommitment,
  CommitmentWithDetails,
  getSlotCounts,
} from '../lib/roomApi';
import { fetchListingById, ListingWithImages } from '../lib/listingsApi';
import {
  formatTimeRemaining,
  formatProgress,
  LOCK_DURATION_HOURS,
} from '../constants/room';

type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: { listingId: string };
  Chat: { chatId: string };
  ActiveCommitment: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ActiveCommitmentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  
  const [commitment, setCommitment] = useState<CommitmentWithDetails | null>(null);
  const [listing, setListing] = useState<ListingWithImages | null>(null);
  const [slotCounts, setSlotCounts] = useState({ total: 0, filled: 0 });
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  const loadCommitment = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const active = await getActiveCommitment(user.id);
      setCommitment(active);

      if (active) {
        // Load full listing details
        const listingData = await fetchListingById(active.listing_id);
        setListing(listingData);

        // Load slot counts
        const counts = await getSlotCounts(active.listing_id);
        setSlotCounts({
          total: counts.total,
          filled: counts.locked + counts.filled,
        });
      }
    } catch (err) {
      console.error('Error loading commitment:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadCommitment();
    }, [loadCommitment])
  );

  // Update countdown timer every minute
  useEffect(() => {
    if (!commitment?.expires_at) return;

    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(commitment.expires_at));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [commitment?.expires_at]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Commitment',
      'Are you sure you want to release this spot? Someone else may take it immediately.',
      [
        { text: 'Keep Spot', style: 'cancel' },
        {
          text: 'Release Spot',
          style: 'destructive',
          onPress: async () => {
            if (!commitment) return;
            setCancelling(true);
            try {
              await cancelCommitment(commitment.id);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel commitment');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleViewListing = () => {
    if (commitment) {
      navigation.navigate('ListingDetail', { listingId: commitment.listing_id });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2C67FF" />
          <Text style={styles.loadingText}>Loading your commitment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!commitment || !listing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Commitment</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
          <Text style={styles.emptyTitle}>No Active Commitment</Text>
          <Text style={styles.emptyText}>
            You don't have any active spot locked. Browse listings to find your next home!
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.browseButtonText}>Browse Listings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const firstImage = listing.images[0]?.url || 'https://via.placeholder.com/800x600?text=No+Image';
  const isFull = slotCounts.filled >= slotCounts.total;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Commitment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconContainer}>
            <Ionicons name="lock-closed" size={32} color="#2C67FF" />
          </View>
          <Text style={styles.statusTitle}>Spot Locked</Text>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={20} color="#D97706" />
            <Text style={styles.timerText}>{timeRemaining}</Text>
          </View>
        </View>

        {/* Listing Preview */}
        <TouchableOpacity style={styles.listingCard} onPress={handleViewListing}>
          <Image source={{ uri: firstImage }} style={styles.listingImage} />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={2}>
              {listing.title}
            </Text>
            <View style={styles.listingLocation}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.listingLocationText}>
                {listing.city}, {listing.state}
              </Text>
            </View>
            <Text style={styles.listingPrice}>
              ${((listing as any).price_per_spot || listing.price_monthly).toLocaleString()}/mo
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Unit Progress</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(slotCounts.filled / slotCounts.total) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {formatProgress(slotCounts.filled, slotCounts.total)}
            {isFull ? ' — Fully committed!' : ` — ${slotCounts.total - slotCounts.filled} spots remaining`}
          </Text>
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsSection}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, isFull && styles.stepNumberComplete]}>
              {isFull ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : (
                <Text style={styles.stepNumberText}>1</Text>
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Wait for unit to fill</Text>
              <Text style={styles.stepDescription}>
                {isFull
                  ? 'All spots are committed!'
                  : `${slotCounts.total - slotCounts.filled} more people need to commit`}
              </Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Connect with landlord</Text>
              <Text style={styles.stepDescription}>
                {isFull
                  ? 'You can now message the landlord to finalize details'
                  : 'Available once the unit is fully committed'}
              </Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Sign lease & move in</Text>
              <Text style={styles.stepDescription}>
                Complete the paperwork and get your keys
              </Text>
            </View>
          </View>
        </View>

        {/* Important Notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle" size={20} color="#0369A1" />
          <Text style={styles.noticeText}>
            Your lock expires in {LOCK_DURATION_HOURS} hours from when you committed.
            If you don't renew or the unit doesn't fill, your spot will be released.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text style={styles.cancelButtonText}>Release Spot</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton} onPress={handleViewListing}>
          <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
          <Text style={styles.messageButtonText}>View Listing</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#2C67FF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  listingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  listingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  listingLocationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C67FF',
  },
  progressSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  nextStepsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberComplete: {
    backgroundColor: '#10B981',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 100,
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#0369A1',
    lineHeight: 20,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  messageButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2C67FF',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

