# Room – Find Your Perfect Roommates

A mobile-first marketplace for finding and booking rooms in shared housing. Room makes it easy for young adults to find affordable housing in expensive cities by connecting them with available spots in multi-bedroom leases.

## Tech Stack

### Mobile App (`subletto-app/`)
- **Expo SDK**: 54.0.x
- **React Native**: 0.81.5
- **React**: 19.1.0
- **TypeScript**: 5.3.3
- **React Navigation**: 6.x
- **Zustand**: 4.5.0
- **react-native-maps**: 1.20.1

### Backend (Supabase)
- **PostgreSQL** - Database with Row-Level Security
- **Supabase Auth** - Email/password authentication
- **Supabase Storage** - Image uploads for listings
- **Database Functions** - Atomic checkout operations

See `subletto-app/package.json` for the complete list of dependencies.

## Key Features

### For Renters (Seekers)
- **Browse Rooms** - Discover available rooms with photos, pricing, and details
- **Map View** - See rooms on an interactive map
- **Instant Booking** - Airbnb-style checkout with 15-minute reservation window
- **Messaging** - Chat directly with hosts after booking

### For Hosts (Listers)
- **Post Listings** - Create detailed room listings with photos
- **Manage Bookings** - Receive and confirm booking requests
- **Edit Anytime** - Update your listings as availability changes

## Quick Start

### Running the Mobile App

1. Navigate to the app directory:
```bash
cd subletto-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your Supabase credentials:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key  # Optional, for address autocomplete
```

4. Start the Expo development server:
```bash
npm start
```

Or use specific platform commands:
```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

5. Open the app:
   - Scan the QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

## Project Structure

```
.
├── docs/              # Project documentation
│   ├── PRD.md         # Product Requirements Document
│   ├── ARCHITECTURE.md # Technical architecture
│   ├── TODO.md        # Implementation checklist
│   └── QA_CHECKLIST.md # Testing guide
├── subletto-app/      # Expo React Native mobile app
│   ├── src/
│   │   ├── screens/   # App screens
│   │   ├── components/ # Reusable UI components
│   │   ├── lib/       # API and utilities
│   │   ├── store/     # Zustand state stores
│   │   └── theme/     # Colors and typography
│   └── ...
└── README.md
```

## Core Flow

1. **Sign Up/Login** - Create account with email/password
2. **Browse Rooms** - Explore available rooms on Home or Map screens
3. **Book a Room** - Click "Book Room" to start 15-min checkout
4. **Complete Checkout** - Verify details, agree to terms, submit request
5. **Host Confirms** - Host reviews and confirms within 24 hours
6. **Move In** - Coordinate with host for move-in details

## Documentation

- `docs/PRD.md` - Product requirements and feature specs
- `docs/ARCHITECTURE.md` - Technical architecture and database schema
- `docs/TODO.md` - Implementation task list (completed)
- `docs/QA_CHECKLIST.md` - Testing checklist

## License

Private - All rights reserved.
