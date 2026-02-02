import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchListings, ListingWithImages } from '../lib/listingsApi';
import { colors } from '../theme';

type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: { listingId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default region centered on Charlottesville, VA
const DEFAULT_REGION: Region = {
  latitude: 38.0293,
  longitude: -78.4767,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function MapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [listings, setListings] = useState<ListingWithImages[]>([]);
  const [selectedListing, setSelectedListing] = useState<ListingWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchListings({});
        // Filter out listings without coordinates
        const listingsWithCoords = data.filter(
          (listing) => listing.latitude !== null && listing.longitude !== null
        );
        setListings(listingsWithCoords);

        // Adjust map region to show all listings if we have any
        if (listingsWithCoords.length > 0) {
          const latitudes = listingsWithCoords.map((l) => l.latitude!);
          const longitudes = listingsWithCoords.map((l) => l.longitude!);
          const minLat = Math.min(...latitudes);
          const maxLat = Math.max(...latitudes);
          const minLng = Math.min(...longitudes);
          const maxLng = Math.max(...longitudes);

          const latDelta = (maxLat - minLat) * 1.5 || 0.1;
          const lngDelta = (maxLng - minLng) * 1.5 || 0.1;

          setRegion({
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(latDelta, 0.05),
            longitudeDelta: Math.max(lngDelta, 0.05),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
        console.error('Error fetching listings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  const handleMarkerPress = (listing: ListingWithImages) => {
    setSelectedListing(listing);
  };

  const handleInfoPillPress = () => {
    if (selectedListing) {
      navigation.navigate('ListingDetail', { listingId: selectedListing.id });
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  // All listings are Room type now
  const formatListingType = () => 'Room';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#9BA3AF"
            style={styles.searchIcon}
          />
          <Text style={styles.searchText}>Search for rooms near you...</Text>
        </View>

        {/* Map */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2C67FF" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={region}
              region={region}
              onRegionChangeComplete={setRegion}
              onMapReady={() => console.log('Map ready')}
              onError={(error) => {
                console.error('Map error:', error);
                setError('Map failed to load. Maps require a development build in Expo SDK 54.');
              }}
            >
              {listings.map((listing) => {
                if (!listing.latitude || !listing.longitude) return null;

                const imageUrl =
                  listing.images && listing.images.length > 0
                    ? listing.images[0].url
                    : 'https://via.placeholder.com/100?text=No+Image';

                return (
                  <Marker
                    key={listing.id}
                    coordinate={{
                      latitude: listing.latitude,
                      longitude: listing.longitude,
                    }}
                    onPress={() => handleMarkerPress(listing)}
                  >
                    <View style={styles.markerContainer}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.markerImage}
                        resizeMode="cover"
                      />
                      {selectedListing?.id === listing.id && (
                        <View style={styles.markerSelected} />
                      )}
                    </View>
                  </Marker>
                );
              })}
            </MapView>

            {/* Info Pill Stack */}
            {selectedListing && (
              <TouchableOpacity
                style={styles.infoPillContainer}
                onPress={handleInfoPillPress}
                activeOpacity={0.8}
              >
                <View style={styles.infoPill}>
                  {/* Listing Image */}
                  {selectedListing.images && selectedListing.images.length > 0 && (
                    <Image
                      source={{ uri: selectedListing.images[0].url }}
                      style={styles.infoPillImage}
                      resizeMode="cover"
                    />
                  )}

                  {/* Info Content */}
                  <View style={styles.infoPillContent}>
                    <Text style={styles.infoPillTitle} numberOfLines={1}>
                      {selectedListing.title}
                    </Text>
                    <View style={styles.infoPillDetails}>
                      <Text style={styles.infoPillPrice}>
                        {formatPrice(selectedListing.price_monthly)}
                        <Text style={styles.infoPillPriceLabel}>/mo</Text>
                      </Text>
                      <View style={styles.infoPillDivider} />
                      <Text style={styles.infoPillType}>
                        {formatListingType(selectedListing.type)}
                      </Text>
                      {selectedListing.bedrooms > 0 && (
                        <>
                          <View style={styles.infoPillDivider} />
                          <View style={styles.infoPillBedBath}>
                            <Ionicons name="bed-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.infoPillBedBathText}>
                              {selectedListing.bedrooms === 0
                                ? 'Studio'
                                : selectedListing.bedrooms}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Arrow Icon */}
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 14,
    color: '#9BA3AF',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  map: {
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
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  markerContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  markerSelected: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: '#2C67FF',
    borderRadius: 30,
  },
  infoPillContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 12,
    minWidth: 200,
    maxWidth: SCREEN_WIDTH - 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoPillImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  infoPillContent: {
    flex: 1,
    marginRight: 8,
  },
  infoPillTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  infoPillDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  infoPillPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoPillPriceLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  infoPillDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#374151',
    marginHorizontal: 8,
  },
  infoPillType: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  infoPillBedBath: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoPillBedBathText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
