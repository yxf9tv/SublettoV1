// Types for the New Listing wizard

export type ListingType = 'SUBLET' | 'TAKEOVER' | 'ROOM';

export interface ListingFormData {
  // Step 1: Basics
  type: ListingType;
  title: string;
  addressLine1: string;
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

export const LISTING_TYPE_OPTIONS: { key: ListingType; label: string; description: string }[] = [
  {
    key: 'SUBLET',
    label: 'Sublet',
    description: 'Temporarily rent out your place while you\'re away',
  },
  {
    key: 'TAKEOVER',
    label: 'Lease Takeover',
    description: 'Transfer your lease to someone else',
  },
];

export const initialFormData: ListingFormData = {
  type: 'SUBLET',
  title: '',
  addressLine1: '',
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
};
