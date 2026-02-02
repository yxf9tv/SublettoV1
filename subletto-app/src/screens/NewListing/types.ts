// Types for the New Listing wizard

// Room is now the only listing type - the app focuses on filling multi-bedroom units one spot at a time
export type ListingType = 'ROOM';

export interface ListingFormData {
  // Step 1: Basics
  type: ListingType;
  title: string;
  addressLine1: string;
  unitNumber: string;  // Apt/Unit number
  city: string;
  state: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;

  // Step 2: Details
  priceMonthly: string;
  utilitiesMonthly: string;
  deposit: string;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;

  // Step 3: Dates & Amenities
  startDate: Date | null;
  endDate: Date | null;
  amenities: AmenityKey[];

  // Step 4: Photos & Description
  photos: PhotoItem[];
  description: string;

  // Room MVP fields
  totalSlots: number;
  pricePerSpot: string;
  leaseTermMonths: string;
  requirementsText: string;
}

export interface PhotoItem {
  uri: string;
  type?: string;
  name?: string;
}

export type AmenityKey =
  | 'wifi'
  | 'airConditioning'
  | 'heating'
  | 'washerDryer'
  | 'dishwasher'
  | 'parking'
  | 'gym'
  | 'pool'
  | 'petsAllowed'
  | 'smokingAllowed'
  | 'wheelchairAccessible'
  | 'balcony'
  | 'rooftop'
  | 'doorman'
  | 'elevator';

export const AMENITY_OPTIONS: { key: AmenityKey; label: string; icon: string }[] = [
  { key: 'wifi', label: 'WiFi Included', icon: 'wifi' },
  { key: 'airConditioning', label: 'Air Conditioning', icon: 'snow' },
  { key: 'heating', label: 'Heating', icon: 'flame' },
  { key: 'washerDryer', label: 'Washer/Dryer', icon: 'water' },
  { key: 'dishwasher', label: 'Dishwasher', icon: 'restaurant' },
  { key: 'parking', label: 'Parking', icon: 'car' },
  { key: 'gym', label: 'Gym', icon: 'fitness' },
  { key: 'pool', label: 'Pool', icon: 'water' },
  { key: 'petsAllowed', label: 'Pets Allowed', icon: 'paw' },
  { key: 'smokingAllowed', label: 'Smoking Allowed', icon: 'bonfire' },
  { key: 'wheelchairAccessible', label: 'Wheelchair Accessible', icon: 'accessibility' },
  { key: 'balcony', label: 'Balcony', icon: 'sunny' },
  { key: 'rooftop', label: 'Rooftop Access', icon: 'trending-up' },
  { key: 'doorman', label: 'Doorman', icon: 'person' },
  { key: 'elevator', label: 'Elevator', icon: 'arrow-up' },
];

// LISTING_TYPE_OPTIONS removed - Room is the only listing type now

export const initialFormData: ListingFormData = {
  type: 'ROOM',
  title: '',
  addressLine1: '',
  unitNumber: '',
  city: '',
  state: '',
  postalCode: '',
  latitude: null,
  longitude: null,
  priceMonthly: '',
  utilitiesMonthly: '',
  deposit: '',
  bedrooms: 1,
  bathrooms: 1,
  furnished: false,
  startDate: null,
  endDate: null,
  amenities: [],
  photos: [],
  description: '',
  // Room MVP fields
  totalSlots: 1,  // Each listing is one bookable room
  pricePerSpot: '',
  leaseTermMonths: '12',
  requirementsText: '',
};

/**
 * Convert a ListingWithImages from the API to ListingFormData for the form
 */
export interface ListingWithImagesForConversion {
  type: ListingType;
  title: string;
  description: string | null;
  address_line1: string | null;
  unit_number?: string | null;  // Apt/Unit number
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  price_monthly: number;
  utilities_monthly: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  start_date: string | null;
  end_date: string | null;
  amenities: Record<string, any>;
  images: Array<{ id: string; url: string; sort_order: number }>;
  // Room MVP fields
  total_slots?: number;
  price_per_spot?: number | null;
  lease_term_months?: number | null;
  requirements_text?: string | null;
}

export function listingToFormData(listing: ListingWithImagesForConversion): ListingFormData {
  // Convert amenities object to array of keys
  const amenityKeys: AmenityKey[] = [];
  if (listing.amenities && typeof listing.amenities === 'object') {
    for (const key of Object.keys(listing.amenities)) {
      // Check if the key is a valid AmenityKey and the value is truthy
      if (listing.amenities[key] && isValidAmenityKey(key)) {
        amenityKeys.push(key as AmenityKey);
      }
    }
  }

  // Convert date strings to Date objects
  const startDate = listing.start_date ? new Date(listing.start_date) : null;
  const endDate = listing.end_date ? new Date(listing.end_date) : null;

  // Convert images to PhotoItem format
  const photos: PhotoItem[] = listing.images
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      uri: img.url,
      name: `image-${img.id}`,
    }));

  return {
    type: listing.type,
    title: listing.title || '',
    addressLine1: listing.address_line1 || '',
    unitNumber: listing.unit_number || '',
    city: listing.city || '',
    state: listing.state || '',
    postalCode: listing.postal_code || '',
    latitude: listing.latitude,
    longitude: listing.longitude,
    priceMonthly: listing.price_monthly?.toString() || '',
    utilitiesMonthly: listing.utilities_monthly?.toString() || '',
    deposit: listing.deposit?.toString() || '',
    bedrooms: listing.bedrooms || 0,
    bathrooms: listing.bathrooms || 1,
    furnished: listing.furnished || false,
    startDate,
    endDate,
    amenities: amenityKeys,
    photos,
    description: listing.description || '',
    // Room MVP fields
    totalSlots: listing.total_slots || listing.bedrooms || 1,
    pricePerSpot: listing.price_per_spot?.toString() || '',
    leaseTermMonths: listing.lease_term_months?.toString() || '12',
    requirementsText: listing.requirements_text || '',
  };
}

// Helper to check if a string is a valid AmenityKey
function isValidAmenityKey(key: string): key is AmenityKey {
  const validKeys: AmenityKey[] = [
    'wifi', 'airConditioning', 'heating', 'washerDryer', 'dishwasher',
    'parking', 'gym', 'pool', 'petsAllowed', 'smokingAllowed',
    'wheelchairAccessible', 'balcony', 'rooftop', 'doorman', 'elevator'
  ];
  return validKeys.includes(key as AmenityKey);
}
