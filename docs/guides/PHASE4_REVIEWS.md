# Phase 4: Reviews System Implementation Guide

This guide covers implementing a complete reviews system for the Room app, allowing renters and hosts to rate each other after completed bookings.

---

## Overview

| Task ID | Task Name | Estimated Hours | Dependencies |
|---------|-----------|-----------------|--------------|
| REV-001 | Reviews table & RLS | 4 | None |
| REV-002 | Reviews API | 4 | REV-001 |
| REV-003 | Review submission flow | 6 | REV-002 |
| REV-004 | Display reviews on profiles | 4 | REV-002 |
| REV-005 | Review request notifications | 3 | REV-001, PUSH-002 |

**Total Estimated Hours:** 21

---

## Prerequisites

- Supabase project with bookings table
- Push notifications set up (for REV-005)
- Profile screens implemented

---

## REV-001: Reviews Table & RLS

### Step 1: Create Reviews Table

Run this migration in Supabase:

```sql
-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_type TEXT NOT NULL CHECK (review_type IN ('GUEST_TO_HOST', 'HOST_TO_GUEST')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Each user can only leave one review per booking direction
  CONSTRAINT unique_review_per_booking_direction 
    UNIQUE (booking_id, reviewer_id, review_type)
);

-- Indexes for common queries
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_listing ON reviews(listing_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 2: Create RLS Policies

```sql
-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read public reviews
CREATE POLICY "Public reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (is_public = true);

-- Users can see their own reviews (including private ones)
CREATE POLICY "Users can view their own reviews"
  ON reviews FOR SELECT
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

-- Users can create reviews only for bookings they participated in
CREATE POLICY "Users can create reviews for their bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    -- Must be the reviewer
    reviewer_id = auth.uid()
    AND
    -- Booking must exist and be completed
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
      AND b.status = 'CONFIRMED'
      AND (
        -- Guest reviewing host
        (review_type = 'GUEST_TO_HOST' AND b.renter_id = auth.uid() AND reviewee_id = b.host_id)
        OR
        -- Host reviewing guest
        (review_type = 'HOST_TO_GUEST' AND b.host_id = auth.uid() AND reviewee_id = b.renter_id)
      )
    )
  );

-- Users cannot update or delete reviews (immutable for trust)
-- If you want to allow updates within a time window:
CREATE POLICY "Users can update their reviews within 24 hours"
  ON reviews FOR UPDATE
  USING (
    reviewer_id = auth.uid()
    AND created_at > now() - INTERVAL '24 hours'
  )
  WITH CHECK (
    reviewer_id = auth.uid()
  );
```

### Step 3: Create Aggregate Views

```sql
-- Create a view for user ratings (for display on profiles)
CREATE OR REPLACE VIEW user_ratings AS
SELECT 
  reviewee_id as user_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
  COUNT(*) FILTER (WHERE rating >= 4) as positive_count
FROM reviews
WHERE is_public = true
GROUP BY reviewee_id;

-- Grant access to the view
GRANT SELECT ON user_ratings TO authenticated, anon;

-- Create a view for listing ratings
CREATE OR REPLACE VIEW listing_ratings AS
SELECT 
  listing_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating
FROM reviews
WHERE is_public = true AND review_type = 'GUEST_TO_HOST'
GROUP BY listing_id;

GRANT SELECT ON listing_ratings TO authenticated, anon;
```

---

## REV-002: Reviews API

### Step 1: Create Reviews API File

Create `src/lib/reviewsApi.ts`:

```typescript
import { supabase } from './supabaseClient';

// Types
export interface Review {
  id: string;
  booking_id: string;
  listing_id: string;
  reviewer_id: string;
  reviewee_id: string;
  review_type: 'GUEST_TO_HOST' | 'HOST_TO_GUEST';
  rating: number;
  comment: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  reviewer?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  listing?: {
    id: string;
    title: string;
  };
}

export interface CreateReviewPayload {
  booking_id: string;
  listing_id: string;
  reviewee_id: string;
  review_type: 'GUEST_TO_HOST' | 'HOST_TO_GUEST';
  rating: number;
  comment?: string;
  is_public?: boolean;
}

export interface UserRating {
  user_id: string;
  review_count: number;
  average_rating: number;
  five_star_count: number;
  positive_count: number;
}

/**
 * Fetch reviews for a specific user (as reviewee)
 */
export async function fetchUserReviews(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar_url),
      listing:listings(id, title)
    `)
    .eq('reviewee_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user reviews:', error);
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch reviews for a specific listing
 */
export async function fetchListingReviews(listingId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar_url)
    `)
    .eq('listing_id', listingId)
    .eq('review_type', 'GUEST_TO_HOST')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching listing reviews:', error);
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new review
 */
export async function createReview(
  payload: CreateReviewPayload,
  reviewerId: string
): Promise<Review> {
  // Validate rating
  if (payload.rating < 1 || payload.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      ...payload,
      reviewer_id: reviewerId,
      is_public: payload.is_public ?? true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already reviewed this booking');
    }
    console.error('Error creating review:', error);
    throw new Error(`Failed to create review: ${error.message}`);
  }

  return data;
}

/**
 * Get aggregate rating for a user
 */
export async function getUserRating(userId: string): Promise<UserRating | null> {
  const { data, error } = await supabase
    .from('user_ratings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No reviews yet
      return null;
    }
    console.error('Error fetching user rating:', error);
    return null;
  }

  return data;
}

/**
 * Get aggregate rating for a listing
 */
export async function getListingRating(listingId: string): Promise<{
  average_rating: number;
  review_count: number;
} | null> {
  const { data, error } = await supabase
    .from('listing_ratings')
    .select('*')
    .eq('listing_id', listingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    return null;
  }

  return data;
}

/**
 * Check if user can review a booking
 */
export async function canReviewBooking(
  bookingId: string,
  userId: string,
  reviewType: 'GUEST_TO_HOST' | 'HOST_TO_GUEST'
): Promise<{ canReview: boolean; reason?: string }> {
  // Check if booking exists and is completed
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, renter_id, host_id, end_date')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return { canReview: false, reason: 'Booking not found' };
  }

  if (booking.status !== 'CONFIRMED') {
    return { canReview: false, reason: 'Booking must be confirmed' };
  }

  // Check user is participant
  const isGuest = booking.renter_id === userId;
  const isHost = booking.host_id === userId;

  if (reviewType === 'GUEST_TO_HOST' && !isGuest) {
    return { canReview: false, reason: 'Only the guest can leave this type of review' };
  }

  if (reviewType === 'HOST_TO_GUEST' && !isHost) {
    return { canReview: false, reason: 'Only the host can leave this type of review' };
  }

  // Check if already reviewed
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('reviewer_id', userId)
    .eq('review_type', reviewType)
    .single();

  if (existingReview) {
    return { canReview: false, reason: 'You have already reviewed this booking' };
  }

  return { canReview: true };
}

/**
 * Get pending reviews for a user
 */
export async function getPendingReviews(userId: string): Promise<{
  bookingId: string;
  listingTitle: string;
  otherUserName: string;
  reviewType: 'GUEST_TO_HOST' | 'HOST_TO_GUEST';
}[]> {
  // Get completed bookings where user hasn't left a review
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      renter_id,
      host_id,
      listing:listings(title),
      host:profiles!bookings_host_id_fkey(name),
      renter:profiles!bookings_renter_id_fkey(name)
    `)
    .eq('status', 'CONFIRMED')
    .or(`renter_id.eq.${userId},host_id.eq.${userId}`);

  if (error || !bookings) {
    return [];
  }

  // Filter out bookings where user has already reviewed
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('booking_id, review_type')
    .eq('reviewer_id', userId);

  const reviewedBookings = new Set(
    existingReviews?.map(r => `${r.booking_id}-${r.review_type}`) || []
  );

  const pending = [];

  for (const booking of bookings) {
    const isGuest = booking.renter_id === userId;
    const reviewType = isGuest ? 'GUEST_TO_HOST' : 'HOST_TO_GUEST';
    const key = `${booking.id}-${reviewType}`;

    if (!reviewedBookings.has(key)) {
      pending.push({
        bookingId: booking.id,
        listingTitle: booking.listing?.title || 'Unknown Listing',
        otherUserName: isGuest 
          ? (booking.host?.name || 'Host')
          : (booking.renter?.name || 'Guest'),
        reviewType,
      });
    }
  }

  return pending;
}
```

---

## REV-003: Review Submission Flow

### Step 1: Create Star Rating Component

Create `src/components/StarRating.tsx`:

```typescript
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ rating, onChange, size = 32, readonly = false }: Props) {
  const stars = [1, 2, 3, 4, 5];

  const handlePress = (value: number) => {
    if (!readonly && onChange) {
      onChange(value);
    }
  };

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handlePress(star)}
          disabled={readonly}
          activeOpacity={readonly ? 1 : 0.7}
          style={styles.starButton}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? colors.warning : colors.gray[300]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 4,
  },
});
```

### Step 2: Create Write Review Screen

Create `src/screens/WriteReviewScreen.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StarRating } from '../components/StarRating';
import { createReview, canReviewBooking } from '../lib/reviewsApi';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

const MAX_COMMENT_LENGTH = 500;

const RATING_LABELS = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

export function WriteReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();

  const { bookingId, reviewType, revieweeId, listingId, revieweeName } = route.params as {
    bookingId: string;
    reviewType: 'GUEST_TO_HOST' | 'HOST_TO_GUEST';
    revieweeId: string;
    listingId: string;
    revieweeName: string;
  };

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    checkCanReview();
  }, []);

  const checkCanReview = async () => {
    if (!user) return;
    
    const result = await canReviewBooking(bookingId, user.id, reviewType);
    setCanReview(result.canReview);
    
    if (!result.canReview) {
      Alert.alert('Cannot Review', result.reason || 'Unable to submit review');
      navigation.goBack();
    }
    
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReview(
        {
          booking_id: bookingId,
          listing_id: listingId,
          reviewee_id: revieweeId,
          review_type: reviewType,
          rating,
          comment: comment.trim() || undefined,
        },
        user.id
      );

      Alert.alert(
        'Review Submitted',
        'Thank you for your feedback!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to submit review'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const isHost = reviewType === 'GUEST_TO_HOST';
  const title = isHost ? `Review your host` : `Review your guest`;
  const subtitle = isHost 
    ? `How was your experience with ${revieweeName}?`
    : `How was ${revieweeName} as a guest?`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <StarRating
            rating={rating}
            onChange={setRating}
            size={48}
          />
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {RATING_LABELS[rating as keyof typeof RATING_LABELS]}
            </Text>
          )}
        </View>

        {/* Comment Input */}
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>
            Share your experience (optional)
          </Text>
          <TextInput
            style={styles.commentInput}
            placeholder="What did you like or dislike? Was communication good? Was the space as described?"
            placeholderTextColor={colors.gray[400]}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={MAX_COMMENT_LENGTH}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {comment.length}/{MAX_COMMENT_LENGTH}
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Review Tips</Text>
          <Text style={styles.tip}>• Be honest and constructive</Text>
          <Text style={styles.tip}>• Focus on your actual experience</Text>
          <Text style={styles.tip}>• Avoid personal information</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (rating === 0 || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Your review will be public and associated with your profile.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 32,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 16,
  },
  ratingLabel: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  commentSection: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    color: colors.textPrimary,
  },
  characterCount: {
    textAlign: 'right',
    marginTop: 8,
    color: colors.gray[500],
    fontSize: 12,
  },
  tipsSection: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  tip: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    textAlign: 'center',
    color: colors.gray[500],
    fontSize: 12,
  },
});
```

### Step 3: Add Navigation

Add to your navigation configuration:

```typescript
// In AppNavigator.tsx
<Stack.Screen
  name="WriteReview"
  component={WriteReviewScreen}
  options={{
    title: 'Write Review',
    presentation: 'modal',
  }}
/>
```

---

## REV-004: Display Reviews on Profiles

### Step 1: Create Review Card Component

Create `src/components/ReviewCard.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { StarRating } from './StarRating';
import { Review } from '../lib/reviewsApi';
import { colors } from '../theme/colors';

interface Props {
  review: Review;
}

export function ReviewCard({ review }: Props) {
  const formattedDate = new Date(review.created_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={
            review.reviewer?.avatar_url
              ? { uri: review.reviewer.avatar_url }
              : require('../assets/default-avatar.png')
          }
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.reviewerName}>
            {review.reviewer?.name || 'Anonymous'}
          </Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <StarRating rating={review.rating} size={14} readonly />
        </View>
      </View>

      {review.comment && (
        <Text style={styles.comment}>{review.comment}</Text>
      )}

      {review.listing && (
        <Text style={styles.listingRef}>
          Review for: {review.listing.title}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  date: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
  },
  comment: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
  },
  listingRef: {
    marginTop: 12,
    fontSize: 13,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
});
```

### Step 2: Create Reviews List Component

Create `src/components/ReviewsList.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ReviewCard } from './ReviewCard';
import { Review } from '../lib/reviewsApi';
import { colors } from '../theme/colors';

interface Props {
  reviews: Review[];
  averageRating?: number;
  reviewCount?: number;
  emptyMessage?: string;
}

export function ReviewsList({ 
  reviews, 
  averageRating, 
  reviewCount,
  emptyMessage = 'No reviews yet'
}: Props) {
  const renderHeader = () => {
    if (!averageRating || !reviewCount) return null;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.ratingCircle}>
          <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
          <Text style={styles.ratingMax}>/5</Text>
        </View>
        <Text style={styles.reviewCount}>
          Based on {reviewCount} review{reviewCount !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{emptyMessage}</Text>
    </View>
  );

  return (
    <FlatList
      data={reviews}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ReviewCard review={item} />}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  summaryContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 16,
  },
  ratingCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ratingMax: {
    fontSize: 20,
    color: colors.gray[500],
    marginLeft: 4,
  },
  reviewCount: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray[600],
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[500],
  },
});
```

### Step 3: Add Reviews Tab to Profile Screen

Update `src/screens/ProfileScreen.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fetchUserReviews, getUserRating, Review, UserRating } from '../lib/reviewsApi';
import { ReviewsList } from '../components/ReviewsList';

// In your ProfileScreen component:
const [activeTab, setActiveTab] = useState<'listings' | 'saved' | 'reviews'>('listings');
const [reviews, setReviews] = useState<Review[]>([]);
const [userRating, setUserRating] = useState<UserRating | null>(null);
const [reviewsLoading, setReviewsLoading] = useState(false);

useEffect(() => {
  if (activeTab === 'reviews' && user) {
    loadReviews();
  }
}, [activeTab, user]);

const loadReviews = async () => {
  if (!user) return;
  setReviewsLoading(true);
  try {
    const [reviewsData, ratingData] = await Promise.all([
      fetchUserReviews(user.id),
      getUserRating(user.id),
    ]);
    setReviews(reviewsData);
    setUserRating(ratingData);
  } catch (error) {
    console.error('Error loading reviews:', error);
  } finally {
    setReviewsLoading(false);
  }
};

// Add Reviews tab button
<TouchableOpacity
  style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
  onPress={() => setActiveTab('reviews')}
>
  <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
    Reviews {userRating ? `(${userRating.review_count})` : ''}
  </Text>
</TouchableOpacity>

// Add Reviews tab content
{activeTab === 'reviews' && (
  <ReviewsList
    reviews={reviews}
    averageRating={userRating?.average_rating}
    reviewCount={userRating?.review_count}
    emptyMessage="No reviews yet. Complete a booking to get reviews!"
  />
)}
```

---

## REV-005: Review Request Notifications

### Step 1: Create Review Request Function

Run this in Supabase:

```sql
-- Function to check and send review request notifications
CREATE OR REPLACE FUNCTION request_booking_reviews()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_booking RECORD;
  v_push_token TEXT;
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  v_supabase_url := current_setting('app.supabase_url', true);
  v_service_role_key := current_setting('app.service_role_key', true);

  -- Find completed bookings without reviews from yesterday
  FOR v_booking IN
    SELECT 
      b.id as booking_id,
      b.renter_id,
      b.host_id,
      l.title as listing_title,
      pr.name as renter_name,
      ph.name as host_name,
      pr.push_token as renter_push_token,
      ph.push_token as host_push_token
    FROM bookings b
    JOIN listings l ON l.id = b.listing_id
    JOIN profiles pr ON pr.id = b.renter_id
    JOIN profiles ph ON ph.id = b.host_id
    WHERE b.status = 'CONFIRMED'
      AND b.end_date = CURRENT_DATE - INTERVAL '1 day'
  LOOP
    -- Check if renter hasn't reviewed host
    IF NOT EXISTS (
      SELECT 1 FROM reviews 
      WHERE booking_id = v_booking.booking_id 
        AND reviewer_id = v_booking.renter_id
    ) AND v_booking.renter_push_token IS NOT NULL THEN
      -- Send push to renter
      PERFORM extensions.http_post(
        url := v_supabase_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_role_key
        ),
        body := jsonb_build_object(
          'pushToken', v_booking.renter_push_token,
          'title', 'How was your stay?',
          'body', 'Leave a review for your experience at ' || v_booking.listing_title,
          'data', jsonb_build_object(
            'type', 'REVIEW_REQUEST',
            'bookingId', v_booking.booking_id
          )
        )
      );
    END IF;

    -- Check if host hasn't reviewed renter
    IF NOT EXISTS (
      SELECT 1 FROM reviews 
      WHERE booking_id = v_booking.booking_id 
        AND reviewer_id = v_booking.host_id
    ) AND v_booking.host_push_token IS NOT NULL THEN
      -- Send push to host
      PERFORM extensions.http_post(
        url := v_supabase_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_role_key
        ),
        body := jsonb_build_object(
          'pushToken', v_booking.host_push_token,
          'title', 'Review your guest',
          'body', 'How was ' || v_booking.renter_name || ' as a guest?',
          'data', jsonb_build_object(
            'type', 'REVIEW_REQUEST',
            'bookingId', v_booking.booking_id
          )
        )
      );
    END IF;
  END LOOP;
END;
$$;
```

### Step 2: Schedule Daily Review Requests

Create a scheduled job using Supabase pg_cron:

```sql
-- Enable pg_cron extension (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule review requests to run daily at 10 AM UTC
SELECT cron.schedule(
  'daily-review-requests',
  '0 10 * * *',
  'SELECT request_booking_reviews()'
);
```

### Step 3: Handle Review Request Notification in App

Update your notification handler:

```typescript
// In useNotifications.ts
case 'REVIEW_REQUEST':
  if (data.bookingId) {
    // Fetch booking details and navigate to review screen
    navigation.navigate('WriteReview', { 
      bookingId: data.bookingId,
      // Other params would need to be fetched
    });
  }
  break;
```

---

## Testing Checklist

- [ ] Reviews table created with correct constraints
- [ ] RLS policies prevent unauthorized reviews
- [ ] User can only review bookings they participated in
- [ ] Star rating component works (1-5 stars)
- [ ] Comment input respects character limit
- [ ] Review submission creates record in database
- [ ] Duplicate review prevention works
- [ ] User reviews display on profile
- [ ] Aggregate ratings calculate correctly
- [ ] Review request notifications sent after booking ends
- [ ] Tapping notification navigates to review screen

---

## Troubleshooting

### "Already reviewed" error
- Check unique constraint on booking_id, reviewer_id, review_type
- Verify canReviewBooking check is working

### Reviews not showing
- Check is_public is true
- Verify RLS policies allow reading
- Check join queries include profile data

### Aggregate ratings wrong
- Ensure view is refreshed after new reviews
- Check view query filters correctly

### Notifications not sending
- Verify pg_cron is enabled
- Check push tokens exist in profiles
- Review Edge Function logs

---

## Resources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Views](https://www.postgresql.org/docs/current/sql-createview.html)
- [pg_cron Extension](https://github.com/citusdata/pg_cron)

---

*Document Version: 1.0*  
*Last Updated: February 2026*
