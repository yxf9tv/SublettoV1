import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  fetchListings,
  ListingWithImages,
  ListingType as ApiListingType,
} from '../lib/listingsApi';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: { listingId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// UI display types
type ListingType = 'Sublet' | 'Lease Takeover' | 'Room';

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
  type: ListingType;
  imageUrls: string[];
  bedrooms: number;
  bathrooms: number;
};

// Helper function to map API listing type to UI display type
function mapApiTypeToDisplayType(apiType: ApiListingType): ListingType {
  switch (apiType) {
    case 'SUBLET':
      return 'Sublet';
    case 'TAKEOVER':
      return 'Lease Takeover';
    case 'ROOM':
      return 'Room';
    default:
      return 'Sublet';
  }
}

// Helper function to map API listing to UI listing format
function mapApiListingToUIListing(apiListing: ListingWithImages): Listing {
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
    type: mapApiTypeToDisplayType(apiListing.type),
    imageUrls: apiListing.images.map((img) => img.url),
    bedrooms: apiListing.bedrooms,
    bathrooms: Number(apiListing.bathrooms),
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

const CATEGORY_TABS: { key: ListingType; label: string; apiType?: ApiListingType }[] = [
  { key: 'Sublet', label: 'Sublets', apiType: 'SUBLET' },
  { key: 'Lease Takeover', label: 'Takeovers', apiType: 'TAKEOVER' },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeCategory, setActiveCategory] = useState<ListingType>('Sublet');
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch listings from Supabase
  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const activeTab = CATEGORY_TABS.find((tab) => tab.key === activeCategory);
        const filters: { type?: ApiListingType } = {};
        
        // Filter by type based on selected category
        if (activeTab?.apiType) {
          filters.type = activeTab.apiType;
        }
        
        const apiListings = await fetchListings(filters);
        const uiListings = apiListings.map(mapApiListingToUIListing);
        setListings(uiListings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
        console.error('Error fetching listings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, [activeCategory]);

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
            placeholder="Search in Charlottesville, VA"
            placeholderTextColor="#9BA3AF"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryRow}>
          <TouchableOpacity style={styles.filterChip}>
            <Ionicons name="options-outline" size={16} color="#111827" />
          </TouchableOpacity>
          {CATEGORY_TABS.map((cat, index) => {
            const active = cat.key === activeCategory;
            const isLast = index === CATEGORY_TABS.length - 1;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                  isLast && styles.categoryChipLast,
                ]}
                onPress={() => setActiveCategory(cat.key)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    active && styles.categoryChipTextActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
                  setLoading(true);
                  // Trigger reload by changing a dependency
                  setActiveCategory(activeCategory);
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
                Try adjusting your filters or check back later
              </Text>
            </View>
          ) : (
            listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onPress={() =>
                  navigation.navigate('ListingDetail', { listingId: listing.id })
                }
              />
            ))
          )}
        </ScrollView>

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

      return (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardImageContainer}
            activeOpacity={1}
            onPressIn={showArrows}
            onPressOut={scheduleHideArrows}
            onPress={onPress}
          >
        <Image source={{ uri: currentImage }} style={styles.cardImage} />
        
        {/* Left Arrow - Previous Image */}
        {hasMultipleImages && currentImageIndex > 0 && (
          <TouchableOpacity
            style={styles.leftArrowContainer}
            onPress={goToPrevious}
            activeOpacity={0.7}
            onPressIn={showArrows}
            onPressOut={scheduleHideArrows}
          >
            <Animated.View style={[styles.arrowButton, { opacity: leftArrowOpacity }]}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Right Arrow - Next Image */}
        {hasMultipleImages && currentImageIndex < listing.imageUrls.length - 1 && (
          <TouchableOpacity
            style={styles.rightArrowContainer}
            onPress={goToNext}
            activeOpacity={0.7}
            onPressIn={showArrows}
            onPressOut={scheduleHideArrows}
          >
            <Animated.View style={[styles.arrowButton, { opacity: rightArrowOpacity }]}>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        )}
        
        {/* Top Row - Badge, Price, and Heart */}
        <View style={styles.cardTopRow}>
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>Recommended</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>
              ${listing.price}
              {listing.priceLabel}
            </Text>
          </View>
          <TouchableOpacity style={styles.heartBtn}>
            <Ionicons name="heart-outline" size={18} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Bottom Gradient Overlay for Text Readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
          style={styles.bottomGradient}
        >
          {/* Left Side - Rating, Title, and Location */}
          <View style={styles.bottomInfoContainer}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{listing.rating}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {listing.title}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={12} color="#FFFFFF" />
              <Text style={styles.cardAddress} numberOfLines={1}>
                {listing.city}, {listing.state}
              </Text>
            </View>
          </View>

          {/* Right Side - Bedroom and Bathroom Stickers */}
          <View style={styles.propertyInfoSticker}>
            <View style={styles.propertyInfoItem}>
              <Ionicons name="bed-outline" size={16} color="#FFFFFF" />
              <Text style={styles.propertyInfoText}>
                {listing.bedrooms === 0 ? 'Studio' : listing.bedrooms}
              </Text>
            </View>
            <View style={styles.propertyInfoDivider} />
            <View style={styles.propertyInfoItem}>
              <Ionicons name="water-outline" size={16} color="#FFFFFF" />
              <Text style={styles.propertyInfoText}>
                {listing.bathrooms % 1 === 0
                  ? listing.bathrooms
                  : listing.bathrooms.toFixed(1)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  categoryRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8,
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryChipLast: {
    marginRight: 0,
  },
  categoryChipText: {
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 280,
  },
  cardImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  cardTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  recommendedText: {
    fontSize: 11,
    color: '#FFFFFF',
  },
  priceBadge: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  heartBtn: {
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  bottomInfoContainer: {
    flex: 1,
    flexDirection: 'column',
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAddress: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 4,
  },
  propertyInfoSticker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    alignSelf: 'flex-end',
  },
  propertyInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyInfoText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 5,
  },
  propertyInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 10,
  },
  leftArrowContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
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
    width: 80,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
    zIndex: 10,
  },
  arrowButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default HomeScreen;
