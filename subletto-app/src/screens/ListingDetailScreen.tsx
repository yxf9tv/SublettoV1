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
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchListingById, ListingWithImages } from '../lib/listingsApi';
import { getOrCreateChat } from '../lib/messagesApi';
import {
  startCheckout,
  canBookListing,
  getActiveCheckoutSession,
  ListingStatus,
} from '../lib/checkoutApi';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: { listingId: string };
  Chat: { chatId: string };
  EditListing: { listingId: string };
  Checkout: { sessionId: string };
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
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingAvailable, setBookingAvailable] = useState<{ canBook: boolean; reason?: string }>({ canBook: false });

  // Use useFocusEffect to refetch listing data when returning from edit screen
  useFocusEffect(
    useCallback(() => {
      const loadListing = async () => {
        try {
          setLoading(true);
          setError(null);
          setCurrentImageIndex(0);
          const data = await fetchListingById(listingId);
          if (!data) {
            setError('Listing not found');
            return;
          }
          setListing(data);

          // Check booking availability
          if (user?.id) {
            const availability = await canBookListing(listingId, user.id);
            setBookingAvailable(availability);
          } else {
            setBookingAvailable({ canBook: false, reason: 'Sign in to book' });
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
    setSaved(!saved);
  };

  const handleMessage = async () => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to message the host.');
      return;
    }

    if (!listing) return;

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

  const handleBookRoom = async () => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to book a room.');
      return;
    }

    if (!listing) return;

    // Check if user has an active checkout session
    const existingSession = await getActiveCheckoutSession(user.id);
    if (existingSession) {
      Alert.alert(
        'Active Checkout',
        'You have an active checkout session. Complete or cancel it first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go to Checkout', 
            onPress: () => navigation.navigate('Checkout', { sessionId: existingSession.id })
          },
        ]
      );
      return;
    }

    setBookingLoading(true);
    try {
      const result = await startCheckout(listingId, user.id);
      navigation.navigate('Checkout', { sessionId: result.session_id });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start checkout');
    } finally {
      setBookingLoading(false);
    }
  };

  // Check if current user is the owner of this listing
  const isOwner = user?.id && listing?.user_id === user.id;

  // Get listing status
  const listingStatus: ListingStatus = (listing as any)?.status || 'AVAILABLE';

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
          <ActivityIndicator size="large" color={colors.primary} />
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
          
          {/* Status Badge */}
          {listingStatus !== 'AVAILABLE' && (
            <View style={[
              styles.statusBadge,
              listingStatus === 'BOOKED' ? styles.statusBooked : styles.statusInCheckout
            ]}>
              <Ionicons 
                name={listingStatus === 'BOOKED' ? 'checkmark-circle' : 'time'} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.statusBadgeText}>
                {listingStatus === 'BOOKED' ? 'Booked' : 'In Checkout'}
              </Text>
            </View>
          )}
          
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
                {formatPrice((listing as any).price_per_spot || listing.price_monthly)}
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

          {/* Lease Info */}
          {((listing as any).lease_term_months || listing.start_date) && (
            <View style={styles.leaseInfoCard}>
              <Text style={styles.leaseInfoTitle}>Lease Details</Text>
              <View style={styles.leaseInfoGrid}>
                {(listing as any).lease_term_months && (
                  <View style={styles.leaseInfoItem}>
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    <Text style={styles.leaseInfoText}>
                      {(listing as any).lease_term_months} month lease
                    </Text>
                  </View>
                )}
                {listing.start_date && (
                  <View style={styles.leaseInfoItem}>
                    <Ionicons name="flag-outline" size={18} color={colors.primary} />
                    <Text style={styles.leaseInfoText}>
                      Available {formatDate(listing.start_date)}
                    </Text>
                  </View>
                )}
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
                  {formatPrice((listing as any).price_per_spot || listing.price_monthly)}
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

          {/* Requirements */}
          {(listing as any).requirements_text && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <View style={styles.requirementsCard}>
                <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                <Text style={styles.requirementsText}>
                  {(listing as any).requirements_text}
                </Text>
              </View>
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
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
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
          // Visitor view
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Ionicons
                name={saved ? 'heart' : 'heart-outline'}
                size={20}
                color={saved ? colors.error : '#111827'}
              />
            </TouchableOpacity>
            
            {bookingAvailable.canBook ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.bookButton]}
                onPress={handleBookRoom}
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="flash" size={20} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, styles.bookButtonText]}>
                      Book Room
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={[styles.actionButton, styles.unavailableButton]}>
                <Ionicons 
                  name={listingStatus === 'BOOKED' ? 'checkmark-circle' : 'time-outline'} 
                  size={20} 
                  color="#6B7280" 
                />
                <Text style={styles.unavailableText}>
                  {bookingAvailable.reason || 'Unavailable'}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={handleMessage}
              disabled={messagingLoading}
            >
              {messagingLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textSecondary,
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
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
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
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBooked: {
    backgroundColor: '#DC2626',
  },
  statusInCheckout: {
    backgroundColor: '#D97706',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
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
    color: colors.textPrimary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
    fontWeight: '500',
  },
  leaseInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  leaseInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  leaseInfoGrid: {
    gap: 12,
  },
  leaseInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leaseInfoText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
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
    color: colors.textSecondary,
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  requirementsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
  },
  requirementsText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 22,
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
    color: colors.textPrimary,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    width: 52,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageButton: {
    width: 52,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  bookButton: {
    flex: 1,
    backgroundColor: colors.success,
  },
  bookButtonText: {
    color: '#FFFFFF',
  },
  unavailableButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unavailableText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  editButtonText: {
    color: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
