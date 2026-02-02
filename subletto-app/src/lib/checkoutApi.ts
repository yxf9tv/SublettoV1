import { supabase } from './supabaseClient';

// ============================================================================
// Constants
// ============================================================================

export const CHECKOUT_SESSION_DURATION_MINUTES = 15;

// ============================================================================
// Type Definitions
// ============================================================================

export type CheckoutSessionState = 'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED';
export type BookingStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED';
export type ListingStatus = 'AVAILABLE' | 'IN_CHECKOUT' | 'BOOKED';

export interface CheckoutSession {
  id: string;
  listing_id: string;
  user_id: string;
  state: CheckoutSessionState;
  expires_at: string;
  price_snapshot: number;
  move_in_date: string | null;
  lease_months: number | null;
  created_at: string;
  updated_at: string;
}

export interface CheckoutSessionWithListing extends CheckoutSession {
  listing?: {
    id: string;
    title: string;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    user_id: string;
  } | null;
}

export interface Booking {
  id: string;
  listing_id: string;
  renter_id: string;
  host_id: string;
  status: BookingStatus;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  checkout_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  listing?: {
    id: string;
    title: string;
    address_line1: string | null;
    city: string | null;
  } | null;
  host?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface StartCheckoutResult {
  session_id: string;
  expires_at: string;
  price_snapshot: number;
  listing_title: string;
}

// ============================================================================
// Checkout Session Functions
// ============================================================================

/**
 * Start a checkout session for a listing
 * This atomically locks the listing and creates a session
 */
export async function startCheckout(
  listingId: string,
  userId: string
): Promise<StartCheckoutResult> {
  const { data, error } = await supabase.rpc('start_checkout', {
    p_listing_id: listingId,
    p_user_id: userId,
    p_session_duration_minutes: CHECKOUT_SESSION_DURATION_MINUTES,
  });

  if (error) {
    // Parse the error code for user-friendly messages
    if (error.message.includes('already has an active checkout')) {
      throw new Error('You already have an active checkout. Complete or cancel it first.');
    }
    if (error.message.includes('not available')) {
      throw new Error('This room is no longer available.');
    }
    if (error.message.includes('your own listing')) {
      throw new Error("You can't book your own listing.");
    }
    throw new Error(`Failed to start checkout: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Failed to create checkout session');
  }

  return data[0];
}

/**
 * Get the user's active checkout session
 */
export async function getActiveCheckoutSession(
  userId: string
): Promise<CheckoutSessionWithListing | null> {
  // First, clean up any expired sessions
  await cleanupExpiredSessions();

  const { data, error } = await supabase
    .from('checkout_sessions')
    .select(`
      *,
      listing:listings(
        id,
        title,
        address_line1,
        city,
        state,
        bedrooms,
        bathrooms,
        user_id
      )
    `)
    .eq('user_id', userId)
    .eq('state', 'ACTIVE')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get active session: ${error.message}`);
  }

  return data;
}

/**
 * Get checkout session by ID
 */
export async function getCheckoutSessionById(
  sessionId: string
): Promise<CheckoutSessionWithListing | null> {
  const { data, error } = await supabase
    .from('checkout_sessions')
    .select(`
      *,
      listing:listings(
        id,
        title,
        address_line1,
        city,
        state,
        bedrooms,
        bathrooms,
        user_id
      )
    `)
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get session: ${error.message}`);
  }

  return data;
}

/**
 * Cancel a checkout session
 */
export async function cancelCheckout(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('cancel_checkout', {
    p_session_id: sessionId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to cancel checkout: ${error.message}`);
  }

  return data === true;
}

/**
 * Complete checkout and create a booking
 */
export async function completeCheckout(
  sessionId: string,
  userId: string,
  startDate: Date,
  endDate?: Date
): Promise<string> {
  const { data, error } = await supabase.rpc('complete_checkout', {
    p_session_id: sessionId,
    p_user_id: userId,
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate ? endDate.toISOString().split('T')[0] : null,
  });

  if (error) {
    if (error.message.includes('expired')) {
      throw new Error('Your checkout session has expired. Please start again.');
    }
    if (error.message.includes('no longer active')) {
      throw new Error('This checkout session is no longer active.');
    }
    throw new Error(`Failed to complete checkout: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to create booking');
  }

  return data; // Returns booking_id
}

/**
 * Check if a listing has an active checkout session
 */
export async function getCheckoutSessionForListing(
  listingId: string
): Promise<CheckoutSession | null> {
  const { data, error } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('listing_id', listingId)
    .eq('state', 'ACTIVE')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    // Don't throw for this - might just be no session
    console.warn('Error checking listing session:', error.message);
    return null;
  }

  return data;
}

/**
 * Cleanup expired checkout sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const { data, error } = await supabase.rpc('cleanup_expired_checkout_sessions');

  if (error) {
    console.warn('Failed to cleanup expired sessions:', error.message);
    return 0;
  }

  return data || 0;
}

/**
 * Calculate time remaining in a checkout session
 */
export function getTimeRemaining(expiresAt: string): {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
} {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return { minutes, seconds, totalSeconds, isExpired: false };
}

// ============================================================================
// Booking Functions
// ============================================================================

/**
 * Get a booking by ID
 */
export async function getBookingById(
  bookingId: string
): Promise<BookingWithDetails | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      listing:listings(id, title, address_line1, city),
      host:profiles!bookings_host_id_fkey(id, name, avatar_url)
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get booking: ${error.message}`);
  }

  return data;
}

/**
 * Get user's bookings (as renter)
 */
export async function getUserBookings(
  userId: string
): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      listing:listings(id, title, address_line1, city),
      host:profiles!bookings_host_id_fkey(id, name, avatar_url)
    `)
    .eq('renter_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get bookings: ${error.message}`);
  }

  return data || [];
}

/**
 * Get bookings for host's listings
 */
export async function getHostBookings(
  hostId: string
): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      listing:listings(id, title, address_line1, city),
      renter:profiles!bookings_renter_id_fkey(id, name, avatar_url)
    `)
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get host bookings: ${error.message}`);
  }

  return data || [];
}

/**
 * Host confirms a booking
 */
export async function confirmBooking(
  bookingId: string,
  hostId: string
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'CONFIRMED',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .eq('host_id', hostId)
    .eq('status', 'PENDING_CONFIRMATION')
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to confirm booking: ${error.message}`);
  }

  if (!data) {
    throw new Error('Booking not found or already processed');
  }

  return data;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(
  bookingId: string,
  userId: string
): Promise<Booking> {
  // First fetch the booking to verify ownership
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    throw new Error('Booking not found');
  }

  // Check if user is either renter or host
  if (booking.renter_id !== userId && booking.host_id !== userId) {
    throw new Error('Not authorized to cancel this booking');
  }

  // Update booking status
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'CANCELLED',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to cancel booking: ${error.message}`);
  }

  // Release the listing back to available
  await supabase
    .from('listings')
    .update({
      status: 'AVAILABLE',
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.listing_id);

  return data;
}

// ============================================================================
// Listing Status Helpers
// ============================================================================

/**
 * Get listing availability status
 */
export async function getListingStatus(
  listingId: string
): Promise<ListingStatus> {
  // First cleanup expired sessions
  await cleanupExpiredSessions();

  const { data, error } = await supabase
    .from('listings')
    .select('status')
    .eq('id', listingId)
    .single();

  if (error) {
    throw new Error(`Failed to get listing status: ${error.message}`);
  }

  return data?.status || 'AVAILABLE';
}

/**
 * Check if a listing can be booked
 */
export async function canBookListing(
  listingId: string,
  userId: string
): Promise<{ canBook: boolean; reason?: string }> {
  // First cleanup expired sessions
  await cleanupExpiredSessions();

  // Get listing
  const { data: listing, error } = await supabase
    .from('listings')
    .select('status, user_id, is_active')
    .eq('id', listingId)
    .single();

  if (error || !listing) {
    return { canBook: false, reason: 'Listing not found' };
  }

  if (!listing.is_active) {
    return { canBook: false, reason: 'Listing is not active' };
  }

  if (listing.user_id === userId) {
    return { canBook: false, reason: "You can't book your own listing" };
  }

  if (listing.status === 'BOOKED') {
    return { canBook: false, reason: 'This room has already been booked' };
  }

  if (listing.status === 'IN_CHECKOUT') {
    return { canBook: false, reason: 'Someone else is currently booking this room' };
  }

  // Check if user has an active session already
  const existingSession = await getActiveCheckoutSession(userId);
  if (existingSession) {
    return { 
      canBook: false, 
      reason: 'You have an active checkout. Complete or cancel it first.' 
    };
  }

  return { canBook: true };
}
