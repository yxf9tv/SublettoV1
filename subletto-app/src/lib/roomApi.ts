import { supabase } from './supabaseClient';
import { LOCK_DURATION_HOURS, SlotStatus, CommitmentStatus } from '../constants/room';

// ============================================================================
// Type Definitions
// ============================================================================

export interface RoomSlot {
  id: string;
  listing_id: string;
  status: SlotStatus;
  locked_by_user_id: string | null;
  locked_until: string | null;
  slot_number: number;
  created_at: string;
  updated_at: string;
}

export interface Commitment {
  id: string;
  user_id: string;
  listing_id: string;
  slot_id: string;
  status: CommitmentStatus;
  checklist_answers: Record<string, boolean>;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Interest {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface SlotWithUserInfo extends RoomSlot {
  locked_by_user?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CommitmentWithDetails extends Commitment {
  listing?: {
    id: string;
    title: string;
    address_line1: string | null;
    city: string | null;
    price_per_spot: number | null;
    price_monthly: number;
  };
  slot?: RoomSlot;
}

// ============================================================================
// Slot Functions
// ============================================================================

/**
 * Fetch all slots for a listing
 */
export async function fetchSlotsForListing(listingId: string): Promise<SlotWithUserInfo[]> {
  // First, clean up any expired locks
  await cleanupExpiredLocks(listingId);

  const { data, error } = await supabase
    .from('room_slots')
    .select(`
      *,
      locked_by_user:profiles!room_slots_locked_by_user_id_fkey(
        id,
        name,
        avatar_url
      )
    `)
    .eq('listing_id', listingId)
    .order('slot_number', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch slots: ${error.message}`);
  }

  return data || [];
}

/**
 * Create slots for a new listing
 */
export async function createSlotsForListing(
  listingId: string,
  totalSlots: number
): Promise<RoomSlot[]> {
  const slotsToCreate = Array.from({ length: totalSlots }, (_, i) => ({
    listing_id: listingId,
    slot_number: i + 1,
    status: 'available' as SlotStatus,
  }));

  const { data, error } = await supabase
    .from('room_slots')
    .insert(slotsToCreate)
    .select();

  if (error) {
    throw new Error(`Failed to create slots: ${error.message}`);
  }

  return data || [];
}

/**
 * Lock a slot for a user
 */
export async function lockSlot(
  slotId: string,
  userId: string
): Promise<RoomSlot> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + LOCK_DURATION_HOURS);

  const { data, error } = await supabase
    .from('room_slots')
    .update({
      status: 'locked',
      locked_by_user_id: userId,
      locked_until: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', slotId)
    .eq('status', 'available') // Only lock if currently available
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to lock slot: ${error.message}`);
  }

  if (!data) {
    throw new Error('Slot is no longer available');
  }

  return data;
}

/**
 * Unlock a slot (release the lock)
 */
export async function unlockSlot(slotId: string): Promise<RoomSlot> {
  const { data, error } = await supabase
    .from('room_slots')
    .update({
      status: 'available',
      locked_by_user_id: null,
      locked_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', slotId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to unlock slot: ${error.message}`);
  }

  return data;
}

/**
 * Mark a slot as filled (permanent)
 */
export async function markSlotFilled(slotId: string): Promise<RoomSlot> {
  const { data, error } = await supabase
    .from('room_slots')
    .update({
      status: 'filled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', slotId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark slot filled: ${error.message}`);
  }

  return data;
}

/**
 * Get slot counts for a listing
 */
export async function getSlotCounts(listingId: string): Promise<{
  total: number;
  available: number;
  locked: number;
  filled: number;
}> {
  const { data, error } = await supabase
    .from('room_slots')
    .select('status')
    .eq('listing_id', listingId);

  if (error) {
    throw new Error(`Failed to get slot counts: ${error.message}`);
  }

  const slots = data || [];
  return {
    total: slots.length,
    available: slots.filter((s) => s.status === 'available').length,
    locked: slots.filter((s) => s.status === 'locked').length,
    filled: slots.filter((s) => s.status === 'filled').length,
  };
}

/**
 * Clean up expired locks for a listing
 */
export async function cleanupExpiredLocks(listingId: string): Promise<void> {
  const now = new Date().toISOString();

  // Find and update expired slots
  const { data: expiredSlots, error: findError } = await supabase
    .from('room_slots')
    .select('id')
    .eq('listing_id', listingId)
    .eq('status', 'locked')
    .lt('locked_until', now);

  if (findError) {
    console.warn('Failed to find expired slots:', findError.message);
    return;
  }

  if (!expiredSlots || expiredSlots.length === 0) {
    return;
  }

  const expiredIds = expiredSlots.map((s) => s.id);

  // Update slots to available
  const { error: updateError } = await supabase
    .from('room_slots')
    .update({
      status: 'available',
      locked_by_user_id: null,
      locked_until: null,
      updated_at: new Date().toISOString(),
    })
    .in('id', expiredIds);

  if (updateError) {
    console.warn('Failed to cleanup expired slots:', updateError.message);
    return;
  }

  // Mark related commitments as expired
  const { error: commitmentError } = await supabase
    .from('commitments')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .in('slot_id', expiredIds)
    .eq('status', 'active');

  if (commitmentError) {
    console.warn('Failed to expire commitments:', commitmentError.message);
  }
}

// ============================================================================
// Commitment Functions
// ============================================================================

/**
 * Check if user has an active commitment
 */
export async function getActiveCommitment(
  userId: string
): Promise<CommitmentWithDetails | null> {
  const { data, error } = await supabase
    .from('commitments')
    .select(`
      *,
      listing:listings(
        id,
        title,
        address_line1,
        city,
        price_per_spot,
        price_monthly
      ),
      slot:room_slots(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get active commitment: ${error.message}`);
  }

  return data;
}

/**
 * Create a new commitment (and lock the slot)
 */
export async function createCommitment(
  userId: string,
  listingId: string,
  slotId: string,
  checklistAnswers: Record<string, boolean>
): Promise<Commitment> {
  // First check if user already has an active commitment
  const existing = await getActiveCommitment(userId);
  if (existing) {
    throw new Error('You already have an active commitment. Cancel it first to commit to a new spot.');
  }

  // Lock the slot first
  await lockSlot(slotId, userId);

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + LOCK_DURATION_HOURS);

  // Create the commitment
  const { data, error } = await supabase
    .from('commitments')
    .insert({
      user_id: userId,
      listing_id: listingId,
      slot_id: slotId,
      status: 'active',
      checklist_answers: checklistAnswers,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    // If commitment creation fails, unlock the slot
    await unlockSlot(slotId);
    throw new Error(`Failed to create commitment: ${error.message}`);
  }

  return data;
}

/**
 * Cancel a commitment (and unlock the slot)
 */
export async function cancelCommitment(commitmentId: string): Promise<void> {
  // Get the commitment first to find the slot
  const { data: commitment, error: fetchError } = await supabase
    .from('commitments')
    .select('slot_id')
    .eq('id', commitmentId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch commitment: ${fetchError.message}`);
  }

  // Update commitment status
  const { error: updateError } = await supabase
    .from('commitments')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', commitmentId);

  if (updateError) {
    throw new Error(`Failed to cancel commitment: ${updateError.message}`);
  }

  // Unlock the slot
  if (commitment?.slot_id) {
    await unlockSlot(commitment.slot_id);
  }
}

/**
 * Get all commitments for a listing (for listing owners)
 */
export async function getCommitmentsForListing(
  listingId: string
): Promise<Commitment[]> {
  const { data, error } = await supabase
    .from('commitments')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch commitments: ${error.message}`);
  }

  return data || [];
}

/**
 * Get active commitments for a listing with user info
 */
export async function getActiveCommitmentsForListing(
  listingId: string
): Promise<(Commitment & { user: { id: string; name: string | null; avatar_url: string | null } })[]> {
  const { data, error } = await supabase
    .from('commitments')
    .select(`
      *,
      user:profiles(id, name, avatar_url)
    `)
    .eq('listing_id', listingId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch active commitments: ${error.message}`);
  }

  return data || [];
}

// ============================================================================
// Interest Functions
// ============================================================================

/**
 * Express interest in a listing
 */
export async function expressInterest(
  userId: string,
  listingId: string
): Promise<Interest> {
  const { data, error } = await supabase
    .from('interests')
    .insert({
      user_id: userId,
      listing_id: listingId,
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation (already interested)
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('interests')
        .select('*')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .single();
      return existing!;
    }
    throw new Error(`Failed to express interest: ${error.message}`);
  }

  return data;
}

/**
 * Remove interest from a listing
 */
export async function removeInterest(
  userId: string,
  listingId: string
): Promise<void> {
  const { error } = await supabase
    .from('interests')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);

  if (error) {
    throw new Error(`Failed to remove interest: ${error.message}`);
  }
}

/**
 * Check if user has expressed interest in a listing
 */
export async function checkUserInterest(
  userId: string,
  listingId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('interests')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return false;
    }
    throw new Error(`Failed to check interest: ${error.message}`);
  }

  return !!data;
}

/**
 * Get all users interested in a listing
 */
export async function getInterestedUsers(
  listingId: string
): Promise<{ userId: string; name: string | null; createdAt: string }[]> {
  const { data, error } = await supabase
    .from('interests')
    .select(`
      user_id,
      created_at,
      user:profiles(name)
    `)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch interested users: ${error.message}`);
  }

  return (data || []).map((d: any) => ({
    userId: d.user_id,
    name: d.user?.name || null,
    createdAt: d.created_at,
  }));
}

/**
 * Get all listings user is interested in
 */
export async function getUserInterests(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('interests')
    .select('listing_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch user interests: ${error.message}`);
  }

  return (data || []).map((d) => d.listing_id);
}

// ============================================================================
// Aggregate Functions for Listings
// ============================================================================

/**
 * Get slot summary for multiple listings (for feed display)
 */
export async function getSlotSummariesForListings(
  listingIds: string[]
): Promise<Map<string, { filled: number; total: number }>> {
  if (listingIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('room_slots')
    .select('listing_id, status')
    .in('listing_id', listingIds);

  if (error) {
    console.warn('Failed to fetch slot summaries:', error.message);
    return new Map();
  }

  // Group by listing_id and count
  const summaries = new Map<string, { filled: number; total: number }>();

  for (const listingId of listingIds) {
    const slots = (data || []).filter((s) => s.listing_id === listingId);
    summaries.set(listingId, {
      total: slots.length,
      filled: slots.filter((s) => s.status === 'locked' || s.status === 'filled').length,
    });
  }

  return summaries;
}

