# Room – Architecture Overview

## 1. High-Level Design

Room is a **mobile-first** application built with:

- **Frontend:** Expo SDK 54 with React Native 0.81.5 and React 19.1.0 (TypeScript)
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)

The mobile app talks directly to Supabase using the official `@supabase/supabase-js` client.

## 2. Frontend

### 2.1 Tech Stack

- **Expo SDK 54** 
- **React Native 0.81.5**
- **React 19.1.0**
- **TypeScript 5.3.3**
- **React Navigation 6** (stack + bottom tabs)
- **Zustand 4.5.0** for global state
- **react-native-maps 1.20.1** for map screen

### 2.2 Environment Variables

Create a `.env` file in `subletto-app/`:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 2.3 Project Structure

```
subletto-app/src/
├── screens/
│   ├── HomeScreen.tsx
│   ├── MapScreen.tsx
│   ├── ListingDetailScreen.tsx
│   ├── CheckoutScreen.tsx
│   ├── BookingConfirmationScreen.tsx
│   ├── NewListing/ (wizard steps)
│   ├── Auth/ (Login, Signup)
│   ├── MessagesScreen.tsx
│   ├── ChatScreen.tsx
│   └── ProfileScreen.tsx
├── components/
│   ├── FeaturedCard.tsx
│   ├── SearchBar.tsx
│   ├── FilterModal.tsx
│   ├── BottomNavBar.tsx
│   └── RoomProgressBadge.tsx
├── lib/
│   ├── supabaseClient.ts
│   ├── listingsApi.ts
│   ├── checkoutApi.ts
│   └── messagesApi.ts
├── store/
│   └── authStore.ts
├── theme/
│   ├── colors.ts
│   └── typography.ts
└── constants/
    └── room.ts
```

### 2.4 Navigation

- **Auth Stack**: Login, SignUp
- **Main Tabs**: Home, Map, Post, Messages, Profile
- **Modal Screens**: Checkout, BookingConfirmation, NewListing, EditListing

## 3. Backend (Supabase)

### 3.1 Database Schema

#### Core Tables

**profiles**
- id (uuid, references auth.users.id)
- email, name, avatar_url
- created_at, updated_at

**listings**
- id (uuid)
- user_id (fk → profiles)
- title, description
- type (enum: 'ROOM')
- **status** (enum: 'AVAILABLE', 'IN_CHECKOUT', 'BOOKED')
- price_monthly, price_per_spot
- lease_term_months
- address_line1, unit_number, city, state, postal_code
- latitude, longitude
- start_date, bedrooms, bathrooms, furnished
- amenities (jsonb)
- requirements_text
- is_active, created_at, updated_at

**listing_images**
- id, listing_id, url, sort_order

#### Checkout System Tables

**checkout_sessions**
- id (uuid)
- listing_id (fk → listings)
- user_id (fk → profiles)
- **state** (enum: 'ACTIVE', 'EXPIRED', 'COMPLETED', 'CANCELLED')
- expires_at (15 min from creation)
- price_snapshot
- move_in_date, lease_months
- created_at, updated_at

**bookings**
- id (uuid)
- listing_id, renter_id, host_id
- **status** (enum: 'PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED')
- start_date, end_date
- monthly_rent
- checkout_session_id
- created_at, updated_at

#### Messaging Tables

**chats**
- id, listing_id, created_at

**chat_participants**
- id, chat_id, user_id

**messages**
- id, chat_id, sender_id, content, created_at

### 3.2 Database Functions

Atomic checkout operations (SECURITY DEFINER):

- `start_checkout(listing_id, user_id, duration_minutes)` 
  - Locks listing, creates session, returns session info
  - Prevents race conditions with FOR UPDATE

- `cancel_checkout(session_id, user_id)`
  - Releases lock, marks session cancelled

- `complete_checkout(session_id, user_id, start_date, end_date)`
  - Creates booking, marks listing BOOKED

- `cleanup_expired_checkout_sessions()`
  - Expires stale sessions, releases locks

### 3.3 Row-Level Security

- **listings**: Public read, owner can edit/delete
- **checkout_sessions**: User sees own sessions, host sees sessions on their listings
- **bookings**: Renter and host can see their bookings
- **messages/chats**: Only participants can access

## 4. Checkout Flow Architecture

```
User clicks "Book Room"
        ↓
start_checkout() [atomic]
  - Check listing AVAILABLE
  - Check no active user session
  - Lock listing (status = IN_CHECKOUT)
  - Create checkout_session (expires in 15 min)
        ↓
CheckoutScreen (4 steps)
  - Timer counting down
  - Details → Verify → Agree → Confirm
        ↓
complete_checkout() [atomic]
  - Verify session still active
  - Create booking (PENDING_CONFIRMATION)
  - Mark listing BOOKED
  - Mark session COMPLETED
        ↓
BookingConfirmationScreen
  - Success UI
  - Next steps
        ↓
Host confirms (24h window)
  - booking.status = CONFIRMED
```

### Session Expiry

If user doesnt complete checkout in 15 minutes:
- `cleanup_expired_checkout_sessions()` runs
- Session marked EXPIRED
- Listing status reset to AVAILABLE

## 5. Styling & Design System

- **Primary typeface**: Poppins (400, 500, 600, 700)
- **Colors**:
  - Primary/Text: `#111827` (dark gray)
  - Background: `#FFFFFF`
  - Success: `#10B981` (green)
  - Error: `#DC2626` (red)
  - Warning: `#F59E0B` (amber)
- **Components**: Rounded corners (12-20px), soft shadows

## 6. API Layer

### listingsApi.ts
- fetchListings(filters)
- fetchListingById(id)
- createListingWithImages(payload, images)
- updateListingWithImages(id, payload, images)

### checkoutApi.ts
- startCheckout(listingId, userId)
- cancelCheckout(sessionId, userId)
- completeCheckout(sessionId, userId, startDate, endDate)
- getActiveCheckoutSession(userId)
- canBookListing(listingId, userId)
- getTimeRemaining(expiresAt)

### messagesApi.ts
- getOrCreateChat(listingId, userId, hostId)
- sendMessage(chatId, content)
- fetchMessages(chatId)
