import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchListings,
  ListingWithImages,
  ListingFilters,
} from '../lib/listingsApi';
import { getSlotSummariesForListings } from '../lib/roomApi';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FilterModal from '../components/FilterModal';

type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: { listingId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FilterState {
  search: string;
  city: string;
  state: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: number | null;
  furnished: boolean | null;
}

type Listing = {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  price: number;
  priceLabel?: string;
  rating: number;
  distanceKm: number;
  imageUrls: string[];
  bedrooms: number;
  bathrooms: number;
  // Room MVP slot data
  totalSlots: number;
  filledSlots: number;
};

// Helper function to map API listing to UI listing format
function mapApiListingToUIListing(
  apiListing: ListingWithImages,
  slotSummary?: { filled: number; total: number }
): Listing {
  return {
    id: apiListing.id,
    title: apiListing.title,
    address: apiListing.address_line1 || '',
    city: apiListing.city || '',
    state: apiListing.state || '',
    price: Number(apiListing.price_monthly),
    priceLabel: ' /month',
    rating: 4.5, // Default rating - can be added to schema later
    distanceKm: 0, // Default distance - can be calculated later
    imageUrls: apiListing.images.map((img) => img.url),
    bedrooms: apiListing.bedrooms,
    bathrooms: Number(apiListing.bathrooms),
    // Use slot summary if available, otherwise fall back to bedrooms as total_slots
    totalSlots: slotSummary?.total ?? (apiListing as any).total_slots ?? apiListing.bedrooms ?? 1,
    filledSlots: slotSummary?.filled ?? 0,
  };
}

// Mock data removed - now fetching from Supabase
// Keeping this comment for reference
/*
const OLD_MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Forest Haven Estate – 2BR Sublet',
    address: '3517 W. Gray St.',
    city: 'Charlottesville',
    state: 'VA',
    price: 1200,
    priceLabel: ' /month',
    rating: 4.8,
    distanceKm: 0.8,
    type: 'Sublet',
    imageUrls: [
      'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 2,
    bathrooms: 1.5,
  },
  {
    id: '2',
    title: 'Verdant Escape – Lease Takeover',
    address: '6391 Elgin St.',
    city: 'Charlottesville',
    state: 'VA',
    price: 950,
    priceLabel: ' /month',
    rating: 4.7,
    distanceKm: 1.2,
    type: 'Lease Takeover',
    imageUrls: [
      'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: '3',
    title: 'Sunny Downtown Studio Sublet',
    address: '1245 Main St.',
    city: 'Charlottesville',
    state: 'VA',
    price: 1100,
    priceLabel: ' /month',
    rating: 4.9,
    distanceKm: 0.5,
    type: 'Sublet',
    imageUrls: [
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 0,
    bathrooms: 1,
  },
  {
    id: '4',
    title: 'Cozy Room Near UVA Campus',
    address: '892 University Ave.',
    city: 'Charlottesville',
    state: 'VA',
    price: 650,
    priceLabel: ' /month',
    rating: 4.6,
    distanceKm: 0.3,
    type: 'Room',
    imageUrls: [
      'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1648771/pexels-photo-1648771.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: '5',
    title: 'Modern 1BR Apartment – Lease Takeover',
    address: '2450 Emmet St.',
    city: 'Charlottesville',
    state: 'VA',
    price: 1050,
    priceLabel: ' /month',
    rating: 4.5,
    distanceKm: 1.5,
    type: 'Lease Takeover',
    imageUrls: [
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: '6',
    title: 'Spacious 3BR House Sublet',
    address: '5678 Barracks Rd.',
    city: 'Charlottesville',
    state: 'VA',
    price: 1800,
    priceLabel: ' /month',
    rating: 4.7,
    distanceKm: 2.1,
    type: 'Sublet',
    imageUrls: [
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 3,
    bathrooms: 2,
  },
  {
    id: '7',
    title: 'Private Room with Bathroom',
    address: '1234 JPA St.',
    city: 'Charlottesville',
    state: 'VA',
    price: 750,
    priceLabel: ' /month',
    rating: 4.8,
    distanceKm: 0.6,
    type: 'Room',
    imageUrls: [
      'https://images.pexels.com/photos/1648771/pexels-photo-1648771.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1329711/pexels-photo-1329711.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: '8',
    title: 'Charming 2BR Cottage Sublet',
    address: '789 Preston Ave.',
    city: 'Charlottesville',
    state: 'VA',
    price: 1350,
    priceLabel: ' /month',
    rating: 4.9,
    distanceKm: 1.8,
    type: 'Sublet',
    imageUrls: [
      'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 2,
    bathrooms: 1.5,
  },
  {
    id: '9',
    title: 'Lease Takeover – 1BR Near Downtown',
    address: '3456 Market St.',
    city: 'Charlottesville',
    state: 'VA',
    price: 980,
    priceLabel: ' /month',
    rating: 4.4,
    distanceKm: 1.0,
    type: 'Lease Takeover',
    imageUrls: [
      'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: '10',
    title: 'Furnished Room in Quiet Neighborhood',
    address: '4567 Ivy Rd.',
    city: 'Charlottesville',
    state: 'VA',
    price: 700,
    priceLabel: ' /month',
    rating: 4.6,
    distanceKm: 2.5,
    type: 'Room',
    imageUrls: [
      'https://images.pexels.com/photos/1329711/pexels-photo-1329711.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1267438/pexels-photo-1267438.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: '11',
    title: 'Luxury 2BR Sublet with Balcony',
    address: '8900 Hydraulic Rd.',
    city: 'Charlottesville',
    state: 'VA',
    price: 1500,
    priceLabel: ' /month',
    rating: 5.0,
    distanceKm: 3.2,
    type: 'Sublet',
    imageUrls: [
      'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 2,
    bathrooms: 2,
  },
  {
    id: '12',
    title: 'Lease Takeover – Studio Apartment',
    address: '2345 Wertland St.',
    city: 'Charlottesville',
    state: 'VA',
    price: 875,
    priceLabel: ' /month',
    rating: 4.3,
    distanceKm: 0.9,
    type: 'Lease Takeover',
    imageUrls: [
      'https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 0,
    bathrooms: 1,
  },
  {
    id: '13',
    title: 'Shared Room Near Corner',
    address: '6789 The Corner',
    city: 'Charlottesville',
    state: 'VA',
    price: 550,
    priceLabel: ' /month',
    rating: 4.2,
    distanceKm: 0.4,
    type: 'Room',
    imageUrls: [
      'https://images.pexels.com/photos/1267438/pexels-photo-1267438.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: '14',
    title: 'Family-Friendly 4BR Sublet',
    address: '1122 Fontaine Ave.',
    city: 'Charlottesville',
    state: 'VA',
    price: 2200,
    priceLabel: ' /month',
    rating: 4.7,
    distanceKm: 2.8,
    type: 'Sublet',
    imageUrls: [
      'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    bedrooms: 4,
    bathrooms: 2.5,
  },
];
*/

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    city: '',
    state: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: null,
    furnished: null,
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Calculate active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.city) count++;
    if (filters.state) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.bedrooms !== null) count++;
    if (filters.furnished !== null) count++;
    return count;
  }, [filters]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const loadListings = useCallback(async () => {
    try {
      console.log('🏠 HomeScreen: Loading Room listings with filters');
      setLoading(true);
      setError(null);

      // Build API filter object
      const apiFilters: ListingFilters = {
        type: 'ROOM',
      };

      if (filters.city) apiFilters.city = filters.city;
      if (filters.state) apiFilters.state = filters.state.toUpperCase();
      if (filters.minPrice) apiFilters.minPrice = parseInt(filters.minPrice);
      if (filters.maxPrice) apiFilters.maxPrice = parseInt(filters.maxPrice);
      if (filters.bedrooms !== null) apiFilters.bedrooms = filters.bedrooms;
      if (filters.furnished !== null) apiFilters.furnished = filters.furnished;

      // Fetch listings with filters
      const apiListings = await fetchListings(apiFilters);
      console.log('🏠 HomeScreen: Received', apiListings.length, 'listings');

      // Client-side text search (temporary until backend supports it)
      let filteredListings = apiListings;
      if (debouncedSearch.trim()) {
        const searchLower = debouncedSearch.toLowerCase();
        filteredListings = apiListings.filter(listing =>
          listing.title.toLowerCase().includes(searchLower) ||
          (listing.description?.toLowerCase().includes(searchLower)) ||
          (listing.address_line1?.toLowerCase().includes(searchLower)) ||
          (listing.city?.toLowerCase().includes(searchLower))
        );
      }

      // Fetch slot summaries for filtered listings
      const listingIds = filteredListings.map(l => l.id);
      const slotSummaries = await getSlotSummariesForListings(listingIds);

      const uiListings = filteredListings.map(listing =>
        mapApiListingToUIListing(listing, slotSummaries.get(listing.id))
      );
      setListings(uiListings);
      console.log('🏠 HomeScreen: Set', uiListings.length, 'UI listings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.city, filters.state, filters.minPrice, filters.maxPrice,
      filters.bedrooms, filters.furnished, debouncedSearch]);

  // Fetch listings from Supabase - refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [loadListings])
  );

  // Also listen for navigation state changes to refetch when coming back from detail screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('HomeScreen focused - refreshing listings');
      setRefreshKey(prev => prev + 1);
      loadListings();
    });

    return unsubscribe;
  }, [navigation, loadListings]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container} pointerEvents="box-none">
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#9BA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search for rooms near you..."
            placeholderTextColor="#9BA3AF"
            style={styles.searchInput}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setFilters(prev => ({ ...prev, search: text }));
            }}
          />
        </View>

        {/* Filter Bar - Room is the only listing type */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={16} color="#111827" />
            <Text style={styles.filterChipText}>Filters</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeText}>Rooms</Text>
          </View>
        </View>

        {/* Listings */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2C67FF" />
              <Text style={styles.loadingText}>Loading listings...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  loadListings();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : listings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No listings found</Text>
              <Text style={styles.emptySubtext}>
                {activeFilterCount > 0
                  ? 'Try adjusting your filters or search'
                  : 'Check back later for new listings'}
              </Text>
            </View>
          ) : (
            listings.map((listing) => (
              <ListingCard
                key={`${listing.id}-${refreshKey}`}
                listing={listing}
                onPress={() =>
                  navigation.navigate('ListingDetail', { listingId: listing.id })
                }
              />
            ))
          )}
        </ScrollView>

        {/* Filter Modal */}
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onChange={(newFilters) => {
            setFilters(newFilters);
          }}
          initialFilters={filters}
        />

      </View>
    </SafeAreaView>
  );
};


const ListingCard: React.FC<{
  listing: Listing;
  onPress?: () => void;
}> = ({ listing, onPress }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [leftArrowOpacity] = useState(new Animated.Value(0.3));
  const [rightArrowOpacity] = useState(new Animated.Value(0.3));
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';
  const hasMultipleImages = listing.imageUrls.length > 1;
  const currentImage = listing.imageUrls[currentImageIndex] || PLACEHOLDER_IMAGE;
  
  // Debug logging
  useEffect(() => {
    console.log('📷 ListingCard:', listing.title, 'has', listing.imageUrls.length, 'images:', 
                listing.imageUrls.map(url => url.substring(0, 50)));
  }, [listing.imageUrls, listing.title]);

  const hideArrows = useCallback(() => {
    Animated.parallel([
      Animated.timing(leftArrowOpacity, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rightArrowOpacity, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [leftArrowOpacity, rightArrowOpacity]);

  const showArrows = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    Animated.parallel([
      Animated.timing(leftArrowOpacity, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rightArrowOpacity, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [leftArrowOpacity, rightArrowOpacity]);

  const scheduleHideArrows = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(hideArrows, 2000);
  }, [hideArrows]);

  const goToPrevious = useCallback(() => {
    setCurrentImageIndex((prev) => {
      if (prev > 0) {
        const newIndex = prev - 1;
        setTimeout(() => {
          showArrows();
          scheduleHideArrows();
        }, 0);
        return newIndex;
      }
      return prev;
    });
  }, [showArrows, scheduleHideArrows]);

  const goToNext = useCallback(() => {
    setCurrentImageIndex((prev) => {
      if (prev < listing.imageUrls.length - 1) {
        const newIndex = prev + 1;
        setTimeout(() => {
          showArrows();
          scheduleHideArrows();
        }, 0);
        return newIndex;
      }
      return prev;
    });
  }, [listing.imageUrls.length, showArrows, scheduleHideArrows]);

  useEffect(() => {
    if (hasMultipleImages) {
      showArrows();
      scheduleHideArrows();
    }
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageIndex]);

  // Calculate spots left (totalSlots is based on bedrooms)
  const spotsLeft = listing.totalSlots - listing.filledSlots;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      {/* White Top Banner */}
      <View style={styles.topBanner}>
        <View style={styles.recommendedBadge}>
          <Ionicons name="checkmark-circle" size={12} color="#10B981" />
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
        <View style={{ flex: 1 }} />
        {listing.totalSlots > 1 && (
          <View style={[
            styles.spotsBadge,
            spotsLeft === 0 && styles.spotsBadgeFull,
          ]}>
            <Text style={styles.spotsNumber}>{spotsLeft}</Text>
            <Text style={styles.spotsTotal}>/{listing.totalSlots}</Text>
          </View>
        )}
      </View>

      {/* Image Container */}
      <View
        style={styles.cardImageContainer}
        onTouchStart={showArrows}
        onTouchEnd={scheduleHideArrows}
      >
        <Image source={{ uri: currentImage }} style={styles.cardImage} />
        
        {/* Left Arrow - Previous Image */}
        {hasMultipleImages && currentImageIndex > 0 && (
          <TouchableOpacity
            style={styles.leftArrowContainer}
            onPress={goToPrevious}
            activeOpacity={0.7}
          >
            <Animated.View style={[styles.arrowButton, { opacity: leftArrowOpacity }]}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Right Arrow - Next Image */}
        {hasMultipleImages && currentImageIndex < listing.imageUrls.length - 1 && (
          <TouchableOpacity
            style={styles.rightArrowContainer}
            onPress={goToNext}
            activeOpacity={0.7}
          >
            <Animated.View style={[styles.arrowButton, { opacity: rightArrowOpacity }]}>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Image Pagination Dots */}
        {hasMultipleImages && (
          <View style={styles.paginationDots}>
            {listing.imageUrls.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentImageIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* White Bottom Banner */}
      <View style={styles.bottomBanner}>
        {/* Title Row */}
        <Text style={styles.cardTitle} numberOfLines={1}>
          {listing.title}
        </Text>

        {/* Info Row */}
        <View style={styles.infoRow}>
          {/* Location */}
          <View style={styles.locationPill}>
            <Ionicons name="location-outline" size={13} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {listing.city}, {listing.state}
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{listing.rating}</Text>
          </View>

          {/* Bathrooms */}
          <View style={styles.bathPill}>
            <Ionicons name="water-outline" size={13} color="#6B7280" />
            <Text style={styles.bathText}>
              {listing.bathrooms % 1 === 0
                ? listing.bathrooms
                : listing.bathrooms.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Price and Actions Row */}
        <View style={styles.priceActionsRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmount}>${listing.price.toLocaleString()}</Text>
            <Text style={styles.priceLabel}>/mo</Text>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="heart-outline" size={20} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="bookmark-outline" size={20} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  scroll: {
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  filterBadge: {
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  roomBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  roomBadgeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  // Top Banner
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  spotsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  spotsBadgeFull: {
    backgroundColor: '#6B7280',
  },
  spotsNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spotsTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Image
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Bottom Banner
  bottomBanner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  bathPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bathText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  priceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  priceLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    padding: 6,
  },
  leftArrowContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 60,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 8,
    zIndex: 10,
  },
  rightArrowContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
    zIndex: 10,
  },
  arrowButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 15,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default HomeScreen;
