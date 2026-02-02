import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore, Profile } from '../store/authStore';
import { fetchListings, ListingWithImages, getSavedListings } from '../lib/listingsApi';
import { getSlotSummariesForListings, getActiveCommitmentsForListing } from '../lib/roomApi';
import RoomProgressBadge from '../components/RoomProgressBadge';
import { formatTimeRemaining } from '../constants/room';
import { colors } from '../theme';

type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: { listingId: string };
  ActiveCommitment: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ListingWithSlotData extends ListingWithImages {
  slotSummary?: { filled: number; total: number };
  activeCommitments?: { userId: string; name: string | null; expiresAt: string }[];
}

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, profile, signOut, isLoading: authLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'listings' | 'saved'>('listings');
  const [myListings, setMyListings] = useState<ListingWithSlotData[]>([]);
  const [savedListings, setSavedListings] = useState<ListingWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch my listings
      const listings = await fetchListings({ userId: user.id });
      
      // Fetch slot summaries for Room listings
      const listingIds = listings.map(l => l.id);
      const slotSummaries = await getSlotSummariesForListings(listingIds);
      
      // Enrich listings with slot data and active commitments
      const enrichedListings: ListingWithSlotData[] = await Promise.all(
        listings.map(async (listing) => {
          const slotSummary = slotSummaries.get(listing.id);
          let activeCommitments: { userId: string; name: string | null; expiresAt: string }[] = [];
          
          // Fetch active commitments for Room listings
          if ((listing as any).total_slots > 1) {
            try {
              const commitments = await getActiveCommitmentsForListing(listing.id);
              activeCommitments = commitments.map(c => ({
                userId: c.user_id,
                name: (c as any).user?.name || null,
                expiresAt: c.expires_at,
              }));
            } catch (err) {
              console.warn('Failed to fetch commitments for listing:', listing.id);
            }
          }
          
          return {
            ...listing,
            slotSummary,
            activeCommitments,
          };
        })
      );
      
      setMyListings(enrichedListings);

      // Fetch saved listings
      const saved = await getSavedListings(user.id);
      setSavedListings(saved);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderListingCard = (listing: ListingWithSlotData | ListingWithImages, isMyListing: boolean = false) => {
    const imageUrl =
      listing.images.length > 0
        ? listing.images[0].url
        : 'https://via.placeholder.com/200?text=No+Image';

    const slotData = isMyListing ? (listing as ListingWithSlotData) : null;
    const hasSlots = slotData?.slotSummary && slotData.slotSummary.total > 1;

    return (
      <TouchableOpacity
        key={listing.id}
        style={styles.listingCard}
        onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
        activeOpacity={0.8}
      >
        <View style={styles.listingImageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.listingImage} />
          {hasSlots && slotData?.slotSummary && (
            <View style={styles.cardBadgeContainer}>
              <RoomProgressBadge
                filled={slotData.slotSummary.filled}
                total={slotData.slotSummary.total}
                size="small"
              />
            </View>
          )}
        </View>
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {listing.title}
          </Text>
          <Text style={styles.listingPrice}>
            ${listing.price_monthly}
            <Text style={styles.listingPriceLabel}>/mo</Text>
          </Text>
          <Text style={styles.listingLocation} numberOfLines={1}>
            {listing.city}, {listing.state}
          </Text>
          {/* Show active commitments for Room listings */}
          {hasSlots && slotData?.activeCommitments && slotData.activeCommitments.length > 0 && (
            <View style={styles.commitmentsContainer}>
              <Text style={styles.commitmentsLabel}>
                {slotData.activeCommitments.length} active lock{slotData.activeCommitments.length > 1 ? 's' : ''}
              </Text>
              {slotData.activeCommitments.slice(0, 2).map((c, idx) => (
                <Text key={idx} style={styles.commitmentItem} numberOfLines={1}>
                  {c.name || 'User'} • {formatTimeRemaining(c.expiresAt)}
                </Text>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const displayListings = activeTab === 'listings' ? myListings : savedListings;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {getInitials(profile?.name || user?.email)}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{profile?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myListings.length}</Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{savedListings.length}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editProfileButton}>
            <Ionicons name="pencil-outline" size={16} color={colors.accentBlue} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'listings' && styles.tabActive]}
            onPress={() => setActiveTab('listings')}
          >
            <Ionicons
              name="home-outline"
              size={20}
              color={activeTab === 'listings' ? colors.accentBlue : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'listings' && styles.tabTextActive,
              ]}
            >
              My Listings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons
              name="heart-outline"
              size={20}
              color={activeTab === 'saved' ? colors.accentBlue : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'saved' && styles.tabTextActive,
              ]}
            >
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        {/* Listings Grid */}
        <View style={styles.listingsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accentBlue} />
            </View>
          ) : displayListings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'listings' ? 'home-outline' : 'heart-outline'}
                size={48}
                color="#D1D5DB"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'listings'
                  ? "You haven't posted any listings yet"
                  : "You haven't saved any listings yet"}
              </Text>
              {activeTab === 'listings' && (
                <TouchableOpacity
                  style={styles.createListingButton}
                  onPress={() => navigation.navigate('MainTabs')}
                >
                  <Text style={styles.createListingText}>Create Listing</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.listingsGrid}>
              {activeTab === 'listings'
                ? myListings.map((listing) => renderListingCard(listing, true))
                : savedListings.map((listing) => renderListingCard(listing, false))}
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accentBlue,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accentBlue,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#F0F5FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: colors.accentBlue,
  },
  listingsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  createListingButton: {
    marginTop: 16,
    backgroundColor: colors.accentBlue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createListingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listingCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listingImageContainer: {
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E5E7EB',
  },
  cardBadgeContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  listingInfo: {
    padding: 10,
  },
  listingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  listingPriceLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  listingLocation: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  commitmentsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  commitmentsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  commitmentItem: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
});
