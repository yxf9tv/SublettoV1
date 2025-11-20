import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import Typography, { H2, Body, BodySmall } from '../components/Typography';
import SearchBar from '../components/SearchBar';
import CategoryTabs, { ListingType } from '../components/CategoryTabs';
import FeaturedCard from '../components/FeaturedCard';
import ListingRowCard from '../components/ListingRowCard';

// Mock data for featured listings
const mockFeaturedListings = [
  {
    id: '1',
    title: 'Cozy 2BR Apartment Near Campus',
    location: 'Charlottesville, VA',
    price: '$1,200/mo',
    imageUrl: undefined,
  },
  {
    id: '2',
    title: 'Modern Studio with Parking',
    location: 'Charlottesville, VA',
    price: '$950/mo',
    imageUrl: undefined,
  },
  {
    id: '3',
    title: 'Spacious 3BR House',
    location: 'Charlottesville, VA',
    price: '$1,800/mo',
    imageUrl: undefined,
  },
];

// Mock data for nearby listings
const mockNearbyListings = [
  {
    id: '1',
    title: 'Sunny 1BR Sublet Available Now',
    location: '0.5 miles away',
    price: '$1,100/mo',
    tag: 'Sublet',
    imageUrl: undefined,
    isSaved: false,
  },
  {
    id: '2',
    title: 'Lease Takeover - 2BR Apartment',
    location: '1.2 miles away',
    price: '$1,350/mo',
    tag: 'Lease Takeover',
    imageUrl: undefined,
    isSaved: true,
  },
  {
    id: '3',
    title: 'Private Room in Shared House',
    location: '0.8 miles away',
    price: '$750/mo',
    tag: 'Room',
    imageUrl: undefined,
    isSaved: false,
  },
  {
    id: '4',
    title: 'Furnished Studio Sublet',
    location: '1.5 miles away',
    price: '$980/mo',
    tag: 'Sublet',
    imageUrl: undefined,
    isSaved: false,
  },
  {
    id: '5',
    title: 'Lease Takeover - 1BR Downtown',
    location: '2.0 miles away',
    price: '$1,200/mo',
    tag: 'Lease Takeover',
    imageUrl: undefined,
    isSaved: true,
  },
];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] =
    useState<ListingType>('ALL');
  const [savedListings, setSavedListings] = useState<Set<string>>(
    new Set(['2', '5'])
  );

  const handleSaveListing = (listingId: string) => {
    setSavedListings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(listingId)) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      return newSet;
    });
  };

  const filteredListings =
    selectedCategory === 'ALL'
      ? mockNearbyListings
      : mockNearbyListings.filter((listing) => {
          if (selectedCategory === 'SUBLET') return listing.tag === 'Sublet';
          if (selectedCategory === 'TAKEOVER')
            return listing.tag === 'Lease Takeover';
          if (selectedCategory === 'ROOM') return listing.tag === 'Room';
          return true;
        });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <H2 style={styles.headerTitle}>Find housing in</H2>
            <TouchableOpacity style={styles.locationButton}>
              <Body style={styles.locationText}>Charlottesville, VA</Body>
              <Typography variant="body" style={styles.locationIcon}>
                ▼
              </Typography>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.currentLocationButton}>
            <BodySmall style={styles.currentLocationText}>
              📍 Current Location
            </BodySmall>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar placeholder="Search listings" />
        </View>

        {/* Category Tabs */}
        <CategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Featured Carousel */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <H2 style={styles.sectionTitle}>Featured</H2>
          </View>
          <FlatList
            data={mockFeaturedListings}
            renderItem={({ item }) => (
              <FeaturedCard
                title={item.title}
                location={item.location}
                price={item.price}
                imageUrl={item.imageUrl}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>

        {/* Nearby Listings */}
        <View style={styles.nearbySection}>
          <View style={styles.sectionHeader}>
            <H2 style={styles.sectionTitle}>Nearby Listings</H2>
          </View>
          {filteredListings.map((listing) => (
            <ListingRowCard
              key={listing.id}
              title={listing.title}
              location={listing.location}
              price={listing.price}
              tag={listing.tag}
              imageUrl={listing.imageUrl}
              isSaved={savedListings.has(listing.id)}
              onSave={() => handleSaveListing(listing.id)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    flex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationText: {
    marginRight: 4,
    color: colors.accentBlue,
  },
  locationIcon: {
    fontSize: 10,
    color: colors.accentBlue,
  },
  currentLocationButton: {
    alignSelf: 'flex-start',
  },
  currentLocationText: {
    color: colors.accentBlue,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  featuredSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  nearbySection: {
    marginTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
  },
  featuredList: {
    paddingLeft: 16,
    paddingRight: 16,
  },
});
