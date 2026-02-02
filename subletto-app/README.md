# Room App

Expo React Native app for Room – Find Your Perfect Roommates.

## Tech Stack

- **Expo SDK 54**
- **React Native 0.81.5**
- **React 19.1.0**
- **TypeScript 5.3.3**
- **React Navigation 6** for navigation
- **Zustand 4.5.0** for state management
- **react-native-maps 1.20.1** for map functionality

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo Go app on your mobile device (for testing)
- iOS Simulator (for macOS) or Android Emulator (optional)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your credentials:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Running the App

Start the Expo development server:
```bash
npm start
```

Or use specific platform commands:
```bash
npm run ios      # iOS simulator (requires macOS and Xcode)
npm run android  # Android emulator
npm run web      # Web browser
```

## Key Features

- **Browse Rooms** - Discover available rooms with photos and details
- **Map View** - See rooms on an interactive map
- **Airbnb-style Checkout** - 15-minute booking window prevents double-booking
- **Post Listings** - Create detailed room listings with photos
- **Messaging** - Chat with hosts and renters
- **Profile** - Manage your listings and settings

## Project Structure

```
subletto-app/
├── App.tsx              # Root component
├── app.json             # Expo configuration
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── src/
    ├── screens/         # App screens
    │   ├── HomeScreen.tsx
    │   ├── MapScreen.tsx
    │   ├── ListingDetailScreen.tsx
    │   ├── CheckoutScreen.tsx
    │   ├── BookingConfirmationScreen.tsx
    │   ├── NewListing/
    │   ├── Auth/
    │   ├── MessagesScreen.tsx
    │   ├── ChatScreen.tsx
    │   └── ProfileScreen.tsx
    ├── components/      # Reusable components
    ├── lib/             # API and utilities
    │   ├── supabaseClient.ts
    │   ├── listingsApi.ts
    │   ├── checkoutApi.ts
    │   └── messagesApi.ts
    ├── store/           # Zustand stores
    ├── theme/           # Colors and typography
    └── navigation/      # App navigation
```

## Database Schema

The app uses Supabase with these key tables:
- `profiles` - User data
- `listings` - Room listings with status (AVAILABLE/IN_CHECKOUT/BOOKED)
- `checkout_sessions` - Active checkout sessions with 15-min expiry
- `bookings` - Confirmed bookings
- `chats` / `messages` - Messaging

## Checkout Flow

1. User clicks "Book Room" on available listing
2. Listing locks for 15 minutes
3. User completes 4-step checkout
4. Booking request sent to host
5. Host confirms within 24 hours

For detailed documentation, see `../docs/`.
