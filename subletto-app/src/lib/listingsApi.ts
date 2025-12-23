import { supabase } from './supabaseClient';

// Type definitions matching the database schema
export type ListingType = 'SUBLET' | 'TAKEOVER' | 'ROOM';

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: ListingType;
  price_monthly: number;
  utilities_monthly: number;
  deposit: number;
  latitude: number | null;
  longitude: number | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  start_date: string | null;
  end_date: string | null;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  amenities: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface ListingWithImages extends Listing {
  images: ListingImage[];
}

export interface ListingFilters {
  type?: ListingType;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  furnished?: boolean;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface CreateListingPayload {
  title: string;
  description?: string | null;
  type: ListingType;
  price_monthly: number;
  utilities_monthly?: number;
  deposit?: number;
  latitude?: number | null;
  longitude?: number | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  amenities?: Record<string, any>;
}

export interface UpdateListingPayload extends Partial<CreateListingPayload> {
  is_active?: boolean;
}

/**
 * Fetch listings with optional filters
 */
export async function fetchListings(
  filters: ListingFilters = {}
): Promise<ListingWithImages[]> {
  let query = supabase
    .from('listings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.city) {
    query = query.eq('city', filters.city);
  }
  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.minPrice !== undefined) {
    query = query.gte('price_monthly', filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('price_monthly', filters.maxPrice);
  }
  if (filters.bedrooms !== undefined) {
    query = query.eq('bedrooms', filters.bedrooms);
  }
  if (filters.furnished !== undefined) {
    query = query.eq('furnished', filters.furnished);
  }
  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch listings: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Fetch images for all listings
  const listingIds = data.map((listing) => listing.id);
  const { data: images, error: imagesError } = await supabase
    .from('listing_images')
    .select('*')
    .in('listing_id', listingIds)
    .order('sort_order', { ascending: true });

  if (imagesError) {
    console.warn('Failed to fetch listing images:', imagesError.message);
  }

  // Combine listings with their images
  const listingsWithImages: ListingWithImages[] = data.map((listing) => ({
    ...listing,
    images: (images || []).filter((img) => img.listing_id === listing.id),
  }));

  return listingsWithImages;
}

/**
 * Fetch a single listing by ID with images
 */
export async function fetchListingById(
  id: string
): Promise<ListingWithImages | null> {
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to fetch listing: ${error.message}`);
  }

  if (!listing) {
    return null;
  }

  // Fetch images for the listing
  const { data: images, error: imagesError } = await supabase
    .from('listing_images')
    .select('*')
    .eq('listing_id', id)
    .order('sort_order', { ascending: true });

  if (imagesError) {
    console.warn('Failed to fetch listing images:', imagesError.message);
  }

  return {
    ...listing,
    images: images || [],
  };
}

/**
 * Create a new listing
 */
export async function createListing(
  payload: CreateListingPayload,
  userId: string
): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      ...payload,
      user_id: userId,
      utilities_monthly: payload.utilities_monthly ?? 0,
      deposit: payload.deposit ?? 0,
      bedrooms: payload.bedrooms ?? 0,
      bathrooms: payload.bathrooms ?? 0,
      furnished: payload.furnished ?? false,
      amenities: payload.amenities ?? {},
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create listing: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing listing
 */
export async function updateListing(
  id: string,
  payload: UpdateListingPayload
): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update listing: ${error.message}`);
  }

  return data;
}

/**
 * Delete a listing (soft delete by setting is_active to false)
 */
export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete listing: ${error.message}`);
  }
}

/**
 * Save a listing for a user
 */
export async function saveListing(
  userId: string,
  listingId: string
): Promise<void> {
  const { error } = await supabase.from('saved_listings').insert({
    user_id: userId,
    listing_id: listingId,
  });

  if (error) {
    // If it's a unique constraint violation, the listing is already saved
    if (error.code === '23505') {
      return;
    }
    throw new Error(`Failed to save listing: ${error.message}`);
  }
}

/**
 * Unsave a listing for a user
 */
export async function unsaveListing(
  userId: string,
  listingId: string
): Promise<void> {
  const { error } = await supabase
    .from('saved_listings')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);

  if (error) {
    throw new Error(`Failed to unsave listing: ${error.message}`);
  }
}

/**
 * Get all saved listings for a user
 */
export async function getSavedListings(
  userId: string
): Promise<ListingWithImages[]> {
  const { data: savedListings, error: savedError } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (savedError) {
    throw new Error(`Failed to fetch saved listings: ${savedError.message}`);
  }

  if (!savedListings || savedListings.length === 0) {
    return [];
  }

  const listingIds = savedListings.map((saved) => saved.listing_id);

  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('*')
    .in('id', listingIds)
    .eq('is_active', true);

  if (listingsError) {
    throw new Error(`Failed to fetch listings: ${listingsError.message}`);
  }

  if (!listings || listings.length === 0) {
    return [];
  }

  // Fetch images for all listings
  const { data: images, error: imagesError } = await supabase
    .from('listing_images')
    .select('*')
    .in('listing_id', listingIds)
    .order('sort_order', { ascending: true });

  if (imagesError) {
    console.warn('Failed to fetch listing images:', imagesError.message);
  }

  // Combine listings with their images
  const listingsWithImages: ListingWithImages[] = listings.map((listing) => ({
    ...listing,
    images: (images || []).filter((img) => img.listing_id === listing.id),
  }));

  return listingsWithImages;
}

/**
 * Upload an image to Supabase Storage
 */
export async function uploadListingImage(
  listingId: string,
  imageUri: string,
  index: number
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${listingId}/${timestamp}_${index}.jpg`;

    // For web URIs (placeholder images), we'll just return the URI as-is
    if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      return imageUri;
    }

    // For local file URIs, fetch and upload
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('listing-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('listing-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Error uploading image:', err);
    // If upload fails, return the original URI (for demo purposes)
    return imageUri;
  }
}

/**
 * Add an image record to the listing_images table
 */
export async function addListingImage(
  listingId: string,
  url: string,
  sortOrder: number
): Promise<void> {
  const { error } = await supabase.from('listing_images').insert({
    listing_id: listingId,
    url,
    sort_order: sortOrder,
  });

  if (error) {
    throw new Error(`Failed to add listing image: ${error.message}`);
  }
}

/**
 * Create a listing with images (full flow)
 */
export async function createListingWithImages(
  payload: CreateListingPayload,
  userId: string,
  imageUris: string[]
): Promise<ListingWithImages> {
  // 1. Create the listing
  const listing = await createListing(payload, userId);

  // 2. Upload and add images
  const images: ListingImage[] = [];
  for (let i = 0; i < imageUris.length; i++) {
    try {
      const uploadedUrl = await uploadListingImage(listing.id, imageUris[i], i);
      await addListingImage(listing.id, uploadedUrl, i);
      images.push({
        id: `temp-${i}`,
        listing_id: listing.id,
        url: uploadedUrl,
        sort_order: i,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`Failed to upload image ${i}:`, err);
    }
  }

  return {
    ...listing,
    images,
  };
}

