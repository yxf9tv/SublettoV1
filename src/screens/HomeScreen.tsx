import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  imageUrl: string;
  bedrooms: number;
  bathrooms: number;
};

const MOCK_LISTINGS: Listing[] = [
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
    imageUrl:
      'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/1648771/pexels-photo-1648771.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/1329711/pexels-photo-1329711.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/1267438/pexels-photo-1267438.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    imageUrl:
      'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800',
    bedrooms: 4,
    bathrooms: 2.5,
  },
];

const CATEGORY_TABS: { key: ListingType; label: string }[] = [
  { key: 'Sublet', label: 'Sublets' },
  { key: 'Lease Takeover', label: 'Lease Takeovers' },
  { key: 'Room', label: 'Rooms' },
];

const HomeScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ListingType>('Sublet');
  const [search, setSearch] = useState('');

  const filteredListings = MOCK_LISTINGS.filter((l) =>
    activeCategory === 'Room' ? true : l.type === activeCategory
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
          <Ionicons
            name="options-outline"
            size={18}
            color="#9BA3AF"
            style={styles.filterIcon}
          />
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryRow}>
          {CATEGORY_TABS.map((cat) => {
            const active = cat.key === activeCategory;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                ]}
                onPress={() => setActiveCategory(cat.key)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    active && styles.categoryChipTextActive,
                  ]}
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
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </ScrollView>

      </View>
    </SafeAreaView>
  );
};

const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardImageContainer}>
        <Image source={{ uri: listing.imageUrl }} style={styles.cardImage} />
        <View style={styles.cardTopRow}>
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>Recommended</Text>
          </View>
          <TouchableOpacity style={styles.heartBtn}>
            <Ionicons name="heart-outline" size={18} color="#111827" />
          </TouchableOpacity>
        </View>
        {/* Bedroom and Bathroom Stickers */}
        <View style={styles.propertyInfoSticker}>
          <View style={styles.propertyInfoItem}>
            <Ionicons name="bed-outline" size={14} color="#FFFFFF" />
            <Text style={styles.propertyInfoText}>
              {listing.bedrooms === 0 ? 'Studio' : listing.bedrooms}
            </Text>
          </View>
          <View style={styles.propertyInfoDivider} />
          <View style={styles.propertyInfoItem}>
            <Ionicons name="water-outline" size={14} color="#FFFFFF" />
            <Text style={styles.propertyInfoText}>
              {listing.bathrooms % 1 === 0
                ? listing.bathrooms
                : listing.bathrooms.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.cardAddress} numberOfLines={1}>
          {listing.address}, {listing.city} {listing.state}
        </Text>
        <View style={styles.cardMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.metaText}>{listing.rating} Rating</Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.metaItem}>
            <Ionicons name="navigate-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{listing.distanceKm} km</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.priceBlock}>
            <Text style={styles.priceText}>${listing.price}</Text>
            <Text style={styles.priceLabel}>{listing.priceLabel}</Text>
          </View>
        </View>
      </View>
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
  filterIcon: {
    marginLeft: 8,
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
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  categoryChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#111827',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    marginTop: 4,
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
    height: 160,
  },
  cardImage: {
    width: '100%',
    height: 160,
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
  heartBtn: {
    marginLeft: 'auto',
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 15,
    color: '#111827',
  },
  cardAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    color: '#111827',
  },
  priceLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 2,
    marginBottom: 1,
  },
  propertyInfoSticker: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  propertyInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyInfoText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  propertyInfoDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
});

export default HomeScreen;
