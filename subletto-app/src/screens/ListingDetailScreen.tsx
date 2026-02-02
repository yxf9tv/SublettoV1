import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchListingById, ListingWithImages } from '../lib/listingsApi';
import { getOrCreateChat } from '../lib/messagesApi';
import {
  getSlotCounts,
  expressInterest,
  removeInterest,
  checkUserInterest,
  createCommitment,
  cancelCommitment,
  getActiveCommitment,
} from '../lib/roomApi';
import { formatProgress, formatSpotsLeft, LOCK_DURATION_HOURS } from '../constants/room';
import RoomProgressBadge from '../components/RoomProgressBadge';
import RoomSlotsModule from '../components/RoomSlotsModule';
import CommitModal from '../components/CommitModal';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: { listingId: string };
  Chat: { chatId: string };
  EditListing: { listingId: string };
  ActiveCommitment: undefined;
};

type ListingDetailRouteProp = RouteProp<RootStackParamList, 'ListingDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const route = useRoute<ListingDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { listingId } = route.params;

  const [listing, setListing] = useState<ListingWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [messagingLoading, setMessagingLoading] = useState(false);
  
  // Room MVP state
  const [slotCounts, setSlotCounts] = useState({ total: 0, available: 0, locked: 0, filled: 0 });
  const [isInterested, setIsInterested] = useState(false);
  const [interestLoading, setInterestLoading] = useState(false);
  const [commitModalVisible, setCommitModalVisible] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [slotRefreshTrigger, setSlotRefreshTrigger] = useState(0);

  // Use useFocusEffect to refetch listing data when returning from edit screen
  useFocusEffect(
    useCallback(() => {
      const loadListing = async () => {
        try {
          setLoading(true);
          setError(null);
          setCurrentImageIndex(0); // Reset image index when refetching
          const data = await fetchListingById(listingId);
          if (!data) {
            setError('Listing not found');
            return;
          }
          setListing(data);
          
          // Load slot counts for Room listings
          if ((data as any).total_slots > 1) {
            try {
              const counts = await getSlotCounts(listingId);
              setSlotCounts(counts);
            } catch (err) {
              console.warn('Failed to load slot counts:', err);
            }
          }
          
          // Check if user is interested in this listing
          if (user?.id) {
            try {
              const interested = await checkUserInterest(user.id, listingId);
              setIsInterested(interested);
            } catch (err) {
              console.warn('Failed to check interest status:', err);
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load listing');
          console.error('Error fetching listing:', err);
        } finally {
          setLoading(false);
        }
      };

      loadListing();
    }, [listingId, user?.id])
  );

  const handleSave = () => {
    // TODO: Implement save functionality when auth is ready
    setSaved(!saved);
  };

  const handleMessage = async () => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to message the lister.');
      return;
    }

    if (!listing) return;

    // Can't message yourself
    if (listing.user_id === user.id) {
      Alert.alert('Info', "This is your own listing. You can't message yourself.");
      return;
    }

    setMessagingLoading(true);
    try {
      const chatId = await getOrCreateChat(listing.id, user.id, listing.user_id);
      navigation.navigate('Chat', { chatId });
    } catch (err) {
      console.error('Error creating chat:', err);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    } finally {
      setMessagingLoading(false);
    }
  };

  const handleEdit = () => {
    if (!listing) return;
    navigation.navigate('EditListing', { listingId: listing.id });
  };

  // Room MVP handlers
  const handleInterestToggle = async () => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to express interest.');
      return;
    }
    
    setInterestLoading(true);
    try {
      if (isInterested) {
        await removeInterest(user.id, listingId);
        setIsInterested(false);
      } else {
        await expressInterest(user.id, listingId);
        setIsInterested(true);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update interest');
    } finally {
      setInterestLoading(false);
    }
  };

  const handleCommitStart = async (slotId: string) => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to commit to a spot.');
      return;
    }
    
    // Check if user already has an active commitment
    try {
      const existing = await getActiveCommitment(user.id);
      if (existing) {
        Alert.alert(
          'Active Commitment',
          'You already have an active commitment. Would you like to view it?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'View', onPress: () => navigation.navigate('ActiveCommitment') },
          ]
        );
        return;
      }
    } catch (err) {
      // No existing commitment, proceed
    }
    
    setSelectedSlotId(slotId);
    setCommitModalVisible(true);
  };

  const handleCommitConfirm = async (checklistAnswers: Record<string, boolean>) => {
    if (!user?.id || !selectedSlotId || !listing) {
      throw new Error('Missing required data');
    }
    
    await createCommitment(user.id, listingId, selectedSlotId, checklistAnswers);
    
    // Refresh slot counts and slots module
    setSlotRefreshTrigger((prev) => prev + 1);
    const counts = await getSlotCounts(listingId);
    setSlotCounts(counts);
    
    // Navigate to active commitment screen
    navigation.navigate('ActiveCommitment');
  };

  const handleCancelCommitment = async (slotId: string) => {
    if (!user?.id) return;
    
    Alert.alert(
      'Cancel Commitment',
      'Are you sure you want to release this spot? Someone else may take it.',
      [
        { text: 'Keep Spot', style: 'cancel' },
        {
          text: 'Release',
          style: 'destructive',
          onPress: async () => {
            try {
              const active = await getActiveCommitment(user.id);
              if (active) {
                await cancelCommitment(active.id);
                setSlotRefreshTrigger((prev) => prev + 1);
                const counts = await getSlotCounts(listingId);
                setSlotCounts(counts);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel commitment');
            }
          },
        },
      ]
    );
  };

  // Check if current user is the owner of this listing
  const isOwner = user?.id && listing?.user_id === user.id;
  
  // Check if this is a multi-slot Room listing
  const isRoomListing = listing && (listing as any).total_slots > 1;
  const filledSlots = slotCounts.locked + slotCounts.filled;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2C67FF" />
          <Text style={styles.loadingText}>Loading listing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !listing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.errorContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error || 'Listing not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const images = listing.images.length > 0 ? listing.images : [
    { url: 'https://via.placeholder.com/800x600?text=No+Image' }
  ];
  const currentImage = images[currentImageIndex]?.url || images[0]?.url;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: currentImage }} style={styles.mainImage} />
          
          {/* Image Indicators */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <TouchableOpacity
                  style={[styles.arrowButton, styles.leftArrow]}
                  onPress={() =>
                    setCurrentImageIndex((prev) => Math.max(0, prev - 1))
                  }
                >
                  <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {currentImageIndex < images.length - 1 && (
                <TouchableOpacity
                  style={[styles.arrowButton, styles.rightArrow]}
                  onPress={() =>
                    setCurrentImageIndex((prev) =>
                      Math.min(images.length - 1, prev + 1)
                    )
                  }
                >
                  <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButtonOverlay}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Price */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{listing.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.location}>
                  {listing.city && listing.state
                    ? `${listing.city}, ${listing.state}`
                    : listing.address_line1 || 'Location not specified'}
                </Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                {formatPrice(listing.price_monthly)}
              </Text>
              <Text style={styles.priceLabel}>/month</Text>
            </View>
          </View>

          {/* Property Details */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={20} color="#6B7280" />
              <Text style={styles.detailText}>
                {listing.bedrooms === 0 ? 'Studio' : listing.bedrooms} bed
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={20} color="#6B7280" />
              <Text style={styles.detailText}>
                {listing.bathrooms % 1 === 0
                  ? listing.bathrooms
                  : listing.bathrooms.toFixed(1)}{' '}
                bath
              </Text>
            </View>
            {listing.furnished && (
              <View style={styles.detailItem}>
                <Ionicons name="cube-outline" size={20} color="#6B7280" />
                <Text style={styles.detailText}>Furnished</Text>
              </View>
            )}
          </View>

          {/* Room MVP: Momentum Strip */}
          {isRoomListing && (
            <View style={styles.momentumStrip}>
              <View style={styles.momentumLeft}>
                <RoomProgressBadge
                  filled={filledSlots}
                  total={slotCounts.total}
                  size="large"
                />
                <Text style={styles.momentumText}>
                  {formatSpotsLeft(filledSlots, slotCounts.total)}
                </Text>
              </View>
              <View style={styles.momentumRight}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.momentumHint}>
                  Locks last {LOCK_DURATION_HOURS}h
                </Text>
              </View>
            </View>
          )}

          {/* Room MVP: Interest Button */}
          {isRoomListing && !isOwner && (
            <TouchableOpacity
              style={[
                styles.interestButton,
                isInterested && styles.interestButtonActive,
              ]}
              onPress={handleInterestToggle}
              disabled={interestLoading}
            >
              {interestLoading ? (
                <ActivityIndicator size="small" color={isInterested ? '#FFFFFF' : '#2C67FF'} />
              ) : (
                <>
                  <Ionicons
                    name={isInterested ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isInterested ? '#FFFFFF' : '#2C67FF'}
                  />
                  <Text
                    style={[
                      styles.interestButtonText,
                      isInterested && styles.interestButtonTextActive,
                    ]}
                  >
                    {isInterested ? "I'm interested" : 'Express Interest'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Room MVP: Slots Module */}
          {isRoomListing && !isOwner && (
            <RoomSlotsModule
              listingId={listingId}
              currentUserId={user?.id || null}
              onCommit={handleCommitStart}
              onCancel={handleCancelCommitment}
              refreshTrigger={slotRefreshTrigger}
            />
          )}

          {/* Dates */}
          {(listing.start_date || listing.end_date) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Dates</Text>
              <View style={styles.datesRow}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Start</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(listing.start_date)}
                  </Text>
                </View>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>End</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(listing.end_date)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Pricing Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.pricingRow}>
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Monthly Rent</Text>
                <Text style={styles.pricingValue}>
                  {formatPrice(listing.price_monthly)}
                </Text>
              </View>
              {listing.utilities_monthly > 0 && (
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>Utilities</Text>
                  <Text style={styles.pricingValue}>
                    {formatPrice(listing.utilities_monthly)}
                  </Text>
                </View>
              )}
              {listing.deposit > 0 && (
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>Deposit</Text>
                  <Text style={styles.pricingValue}>
                    {formatPrice(listing.deposit)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          )}

          {/* Amenities */}
          {listing.amenities &&
            Object.keys(listing.amenities).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Amenities</Text>
                <View style={styles.amenitiesGrid}>
                  {Object.entries(listing.amenities).map(([key, value]) => (
                    <View key={key} style={styles.amenityItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text style={styles.amenityText}>
                        {typeof value === 'string' ? value : key}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        {isOwner ? (
          // Owner view: Edit button only
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, styles.editButtonText]}>
              Edit Listing
            </Text>
          </TouchableOpacity>
        ) : (
          // Visitor view: Save and Message buttons
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Ionicons
                name={saved ? 'heart' : 'heart-outline'}
                size={20}
                color={saved ? '#FFFFFF' : '#111827'}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  saved && styles.actionButtonTextActive,
                ]}
              >
                {saved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={handleMessage}
              disabled={messagingLoading}
            >
              {messagingLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
                  <Text style={[styles.actionButtonText, styles.messageButtonText]}>
                    Message Lister
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Room MVP: Commit Modal */}
      {listing && (
        <CommitModal
          visible={commitModalVisible}
          onClose={() => {
            setCommitModalVisible(false);
            setSelectedSlotId(null);
          }}
          onConfirm={handleCommitConfirm}
          listingTitle={listing.title}
          pricePerSpot={(listing as any).price_per_spot || listing.price_monthly}
          leaseTermMonths={(listing as any).lease_term_months}
          startDate={listing.start_date}
          utilitiesIncluded={listing.utilities_monthly === 0}
          requirementsText={(listing as any).requirements_text}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2C67FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  leftArrow: {
    left: 16,
  },
  rightArrow: {
    right: 16,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 24,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  pricingRow: {
    gap: 16,
  },
  pricingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#111827',
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
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageButton: {
    backgroundColor: '#111827',
    flex: 2,
  },
  editButton: {
    backgroundColor: '#2C67FF',
    flex: 1,
  },
  editButtonText: {
    color: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  messageButtonText: {
    color: '#FFFFFF',
  },
  // Room MVP styles
  momentumStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  momentumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  momentumText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0369A1',
  },
  momentumRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  momentumHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2C67FF',
    gap: 8,
  },
  interestButtonActive: {
    backgroundColor: '#2C67FF',
    borderColor: '#2C67FF',
  },
  interestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C67FF',
  },
  interestButtonTextActive: {
    color: '#FFFFFF',
  },
});

