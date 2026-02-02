# Room – Engineering Implementation Guide

This guide breaks down the Room app into parallelizable tasks for a team of engineers. Each sprint contains tasks that can be worked on simultaneously by different team members.

---

## Overview

**Total Sprints:** 5  
**Estimated Duration:** 4-6 weeks  
**Team Size:** 12 engineers  

### Tech Stack
- **Frontend:** Expo SDK 54, React Native, TypeScript
- **Backend:** Supabase (Postgres, Auth, Storage)
- **State:** Zustand
- **Navigation:** React Navigation 6

### Prerequisites
Each engineer needs:
- Node.js v18+
- Expo CLI (`npm install -g expo-cli`)
- Access to Supabase project
- Git access to repository

---

## Sprint 1: Foundation (Week 1)

**Goal:** Set up project infrastructure so all other work can proceed.

### Task 1.1: Project Initialization
**Assignees:** 1 engineer  
**Dependencies:** None  
**Estimated Hours:** 4

1. Create Expo project with TypeScript template:
   ```bash
   npx create-expo-app subletto-app --template expo-template-blank-typescript
   ```

2. Configure `app.json`:
   - Set name to "Room"
   - Set bundleIdentifier to "com.room.app"
   - Configure iOS and Android settings

3. Set up ESLint and Prettier:
   ```bash
   npm install -D eslint prettier @typescript-eslint/parser
   ```

4. Create folder structure:
   ```
   src/
   ├── screens/
   ├── components/
   ├── lib/
   ├── store/
   ├── theme/
   ├── navigation/
   └── constants/
   ```

5. Create `.env.example` with required variables

**Deliverable:** Clean Expo project with folder structure ready for development.

---

### Task 1.2: Supabase Schema - Core Tables
**Assignees:** 1-2 engineers  
**Dependencies:** Supabase project created  
**Estimated Hours:** 6

Create these tables via Supabase migrations:

1. **profiles** table:
   ```sql
   CREATE TABLE profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
     email TEXT,
     name TEXT,
     avatar_url TEXT,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. **listings** table:
   ```sql
   CREATE TABLE listings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     description TEXT,
     type TEXT DEFAULT 'ROOM' CHECK (type IN ('ROOM')),
     status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'IN_CHECKOUT', 'BOOKED')),
     price_monthly NUMERIC NOT NULL,
     price_per_spot NUMERIC,
     utilities_monthly NUMERIC DEFAULT 0,
     deposit NUMERIC DEFAULT 0,
     lease_term_months INTEGER,
     address_line1 TEXT,
     unit_number TEXT,
     city TEXT,
     state TEXT,
     postal_code TEXT,
     latitude NUMERIC,
     longitude NUMERIC,
     start_date DATE,
     end_date DATE,
     bedrooms INTEGER DEFAULT 1,
     bathrooms NUMERIC DEFAULT 1,
     furnished BOOLEAN DEFAULT false,
     amenities JSONB DEFAULT '{}',
     requirements_text TEXT,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   ```

3. **listing_images** table:
   ```sql
   CREATE TABLE listing_images (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
     url TEXT NOT NULL,
     sort_order INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

4. **saved_listings** table:
   ```sql
   CREATE TABLE saved_listings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ DEFAULT now(),
     UNIQUE(user_id, listing_id)
   );
   ```

**Deliverable:** Core tables created with proper relationships and constraints.

---

### Task 1.3: Supabase Schema - Checkout & Messaging Tables
**Assignees:** 1-2 engineers  
**Dependencies:** Task 1.2 complete  
**Estimated Hours:** 6

1. **checkout_sessions** table:
   ```sql
   CREATE TABLE checkout_sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     state TEXT DEFAULT 'ACTIVE' CHECK (state IN ('ACTIVE', 'EXPIRED', 'COMPLETED', 'CANCELLED')),
     expires_at TIMESTAMPTZ NOT NULL,
     price_snapshot NUMERIC NOT NULL,
     move_in_date DATE,
     lease_months INTEGER,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. **bookings** table:
   ```sql
   CREATE TABLE bookings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
     renter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     checkout_session_id UUID REFERENCES checkout_sessions(id),
     status TEXT DEFAULT 'PENDING_CONFIRMATION' CHECK (status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED')),
     start_date DATE NOT NULL,
     end_date DATE NOT NULL,
     monthly_rent NUMERIC NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   ```

3. **chats** table:
   ```sql
   CREATE TABLE chats (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

4. **chat_participants** table:
   ```sql
   CREATE TABLE chat_participants (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     joined_at TIMESTAMPTZ DEFAULT now(),
     UNIQUE(chat_id, user_id)
   );
   ```

5. **messages** table:
   ```sql
   CREATE TABLE messages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
     sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

**Deliverable:** All tables for checkout and messaging created.

---

### Task 1.4: Supabase RLS Policies
**Assignees:** 1 engineer  
**Dependencies:** Tasks 1.2 and 1.3 complete  
**Estimated Hours:** 4

Create Row Level Security policies:

1. **profiles**: Users can read all, update own
2. **listings**: Public read, owner can insert/update/delete
3. **listing_images**: Same as listings
4. **saved_listings**: User can only see/modify own
5. **checkout_sessions**: User sees own, host sees on their listings
6. **bookings**: Renter and host can see their bookings
7. **chats/chat_participants/messages**: Only participants can access

**Deliverable:** RLS policies enabled and tested for all tables.

---

### Task 1.5: Theme & Design System
**Assignees:** 1 engineer  
**Dependencies:** Task 1.1 complete  
**Estimated Hours:** 4

1. Create `src/theme/colors.ts`:
   ```typescript
   export const colors = {
     background: '#FFFFFF',
     textPrimary: '#111827',
     textSecondary: '#6B7280',
     accent: '#111827',
     success: '#10B981',
     error: '#DC2626',
     warning: '#F59E0B',
     border: '#E5E7EB',
     card: '#FFFFFF',
     gray: {
       50: '#F9FAFB',
       100: '#F3F4F6',
       // ... etc
     }
   };
   ```

2. Create `src/theme/typography.ts`:
   ```typescript
   export const typography = {
     h1: { fontFamily: 'Poppins-Bold', fontSize: 28 },
     h2: { fontFamily: 'Poppins-SemiBold', fontSize: 22 },
     body: { fontFamily: 'Poppins-Regular', fontSize: 16 },
     caption: { fontFamily: 'Poppins-Regular', fontSize: 12 },
   };
   ```

3. Install and configure Poppins font:
   ```bash
   npm install @expo-google-fonts/poppins expo-font
   ```

4. Create Typography component for consistent text styling

**Deliverable:** Complete design system with colors, typography, and font loading.

---

### Task 1.6: Navigation Structure
**Assignees:** 1 engineer  
**Dependencies:** Task 1.1 complete  
**Estimated Hours:** 4

1. Install React Navigation:
   ```bash
   npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
   npm install react-native-screens react-native-safe-area-context
   ```

2. Create `src/navigation/AppNavigator.tsx`:
   - Auth stack (Login, SignUp)
   - Main tabs (Home, Map, Post, Messages, Profile)
   - Modal screens (Checkout, NewListing, ListingDetail)

3. Create placeholder screens for each route

4. Implement auth state check to show correct navigator

**Deliverable:** Full navigation structure with placeholder screens.

---

### Task 1.7: Supabase Client & Auth Store
**Assignees:** 1 engineer  
**Dependencies:** Task 1.1 complete  
**Estimated Hours:** 4

1. Install Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Create `src/lib/supabaseClient.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   
   const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
   const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
   
   export const supabase = createClient(supabaseUrl, supabaseKey);
   ```

3. Create `src/store/authStore.ts` with Zustand:
   ```typescript
   import { create } from 'zustand';
   
   interface AuthState {
     user: User | null;
     session: Session | null;
     isLoading: boolean;
     setUser: (user: User | null) => void;
     setSession: (session: Session | null) => void;
   }
   ```

4. Implement auth state listener in App.tsx

**Deliverable:** Supabase client configured and auth store working.

---

### Task 1.8: Supabase Database Functions
**Assignees:** 1 engineer  
**Dependencies:** Tasks 1.2, 1.3 complete  
**Estimated Hours:** 6

Create atomic database functions:

1. **start_checkout** function:
   - Accepts listing_id, user_id, duration_minutes
   - Checks listing is AVAILABLE
   - Checks user has no active session
   - Locks listing (status = IN_CHECKOUT)
   - Creates checkout_session
   - Returns session info

2. **cancel_checkout** function:
   - Accepts session_id, user_id
   - Verifies ownership
   - Marks session CANCELLED
   - Resets listing to AVAILABLE

3. **complete_checkout** function:
   - Accepts session_id, user_id, booking details
   - Verifies session is active
   - Creates booking record
   - Marks listing BOOKED
   - Marks session COMPLETED

4. **cleanup_expired_checkout_sessions** function:
   - Finds expired ACTIVE sessions
   - Marks them EXPIRED
   - Resets listing status to AVAILABLE

**Deliverable:** All checkout functions created and tested.

---

## Sprint 2: Core Screens (Week 2)

**Goal:** Build all main screens with UI complete (mock data OK).

*All tasks in this sprint can be worked on in parallel.*

---

### Task 2.1: Auth - Login Screen
**Assignees:** 1 engineer  
**Dependencies:** Tasks 1.5, 1.6, 1.7 complete  
**Estimated Hours:** 4

1. Create `src/screens/Auth/LoginScreen.tsx`
2. Build form with email and password inputs
3. Add validation for empty fields and email format
4. Connect to Supabase auth signInWithPassword
5. Handle loading and error states
6. Navigate to main app on success
7. Link to SignUp screen

**Deliverable:** Working login screen with Supabase auth.

---

### Task 2.2: Auth - SignUp Screen
**Assignees:** 1 engineer  
**Dependencies:** Tasks 1.5, 1.6, 1.7 complete  
**Estimated Hours:** 4

1. Create `src/screens/Auth/SignUpScreen.tsx`
2. Build form with name, email, password, confirm password
3. Add validation for all fields
4. Connect to Supabase auth signUp
5. Create profile record after signup
6. Handle loading and error states
7. Navigate to main app on success

**Deliverable:** Working signup screen with profile creation.

---

### Task 2.3: Home Screen - Layout & Cards
**Assignees:** 1-2 engineers  
**Dependencies:** Tasks 1.5, 1.6 complete  
**Estimated Hours:** 8

1. Create `src/screens/HomeScreen.tsx`
2. Build search bar component
3. Build filter button/modal trigger
4. Create ListingCard component with:
   - Image with top/bottom banners
   - Status badge (Available/Booked)
   - Title, location, price
   - Like/save buttons
5. Implement FlatList for listings
6. Add pull-to-refresh
7. Add loading and empty states

**Deliverable:** Complete Home screen UI with listing cards.

---

### Task 2.4: Map Screen
**Assignees:** 1 engineer  
**Dependencies:** Tasks 1.5, 1.6 complete  
**Estimated Hours:** 6

1. Install react-native-maps:
   ```bash
   npm install react-native-maps
   ```

2. Create `src/screens/MapScreen.tsx`
3. Render MapView with default region
4. Create custom markers for listings
5. Build info pill component (shows on marker tap)
6. Navigate to ListingDetail on pill tap
7. Handle web fallback (map not supported)

**Deliverable:** Working map screen with markers and info pills.

---

### Task 2.5: Listing Detail Screen
**Assignees:** 1-2 engineers  
**Dependencies:** Tasks 1.5, 1.6 complete  
**Estimated Hours:** 8

1. Create `src/screens/ListingDetailScreen.tsx`
2. Build image carousel with navigation arrows
3. Display all listing details:
   - Title, price, status
   - Lease term, move-in date
   - Bed/bath, furnished
   - Description
   - Amenities list
   - Requirements
   - Location with map preview
4. Build action buttons:
   - Book Room (for available listings)
   - Unavailable (for booked listings)
   - Edit Listing (for owner)
   - Save, Message
5. Handle different user states (owner vs visitor)

**Deliverable:** Complete listing detail screen with all sections.

---

### Task 2.6: Profile Screen
**Assignees:** 1 engineer  
**Dependencies:** Tasks 1.5, 1.6, 1.7 complete  
**Estimated Hours:** 6

1. Create `src/screens/ProfileScreen.tsx`
2. Display user info (avatar, name, email)
3. Create tabs: "My Listings" and "Saved"
4. Build listing card grid for each tab
5. Add empty states for each tab
6. Implement sign out button with confirmation
7. Add pull-to-refresh

**Deliverable:** Working profile screen with tabs and sign out.

---

### Task 2.7: Messages Screen (Inbox)
**Assignees:** 1 engineer  
**Dependencies:** Tasks 1.5, 1.6 complete  
**Estimated Hours:** 4

1. Create `src/screens/MessagesScreen.tsx`
2. Build chat list item component:
   - Avatar
   - Other user's name
   - Listing title
   - Last message preview
   - Timestamp
3. Implement FlatList for chats
4. Add empty state
5. Navigate to ChatScreen on tap

**Deliverable:** Working inbox screen with chat list.

---

### Task 2.8: Chat Screen
**Assignees:** 1 engineer  
**Dependencies:** Tasks 1.5, 1.6 complete  
**Estimated Hours:** 6

1. Create `src/screens/ChatScreen.tsx`
2. Build message bubble component:
   - Own messages on right (dark)
   - Other messages on left (light)
   - Timestamps
3. Implement FlatList for messages (inverted)
4. Build composer input with send button
5. Handle keyboard avoidance
6. Add loading and empty states

**Deliverable:** Working chat screen with message bubbles and composer.

---

## Sprint 3: API Layer (Week 3)

**Goal:** Connect all screens to Supabase with complete API layer.

*Tasks 3.1-3.4 can be worked on in parallel. Task 3.5 depends on all others.*

---

### Task 3.1: Listings API
**Assignees:** 1 engineer  
**Dependencies:** Sprint 1 complete  
**Estimated Hours:** 6

Create `src/lib/listingsApi.ts`:

1. `fetchListings(filters)` - Get listings with optional filters
2. `fetchListingById(id)` - Get single listing with images
3. `fetchUserListings(userId)` - Get user's own listings
4. `createListingWithImages(payload, images)` - Create listing and upload images
5. `updateListingWithImages(id, payload, images)` - Update listing
6. `deleteListingImage(imageId, url)` - Remove image from storage
7. `uploadListingImage(listingId, file)` - Upload to Supabase storage

**Deliverable:** Complete listings API with all CRUD operations.

---

### Task 3.2: Checkout API
**Assignees:** 1 engineer  
**Dependencies:** Task 1.8 complete  
**Estimated Hours:** 4

Create `src/lib/checkoutApi.ts`:

1. `startCheckout(listingId, userId)` - Call start_checkout function
2. `cancelCheckout(sessionId, userId)` - Call cancel_checkout function
3. `completeCheckout(sessionId, userId, details)` - Call complete_checkout function
4. `getActiveCheckoutSession(userId)` - Get user's active session
5. `getCheckoutSessionForListing(listingId)` - Check if listing is in checkout
6. `canBookListing(listingId)` - Check if listing is available

**Deliverable:** Complete checkout API wrapping database functions.

---

### Task 3.3: Messages API
**Assignees:** 1 engineer  
**Dependencies:** Sprint 1 complete  
**Estimated Hours:** 4

Create `src/lib/messagesApi.ts`:

1. `fetchUserChats(userId)` - Get all chats for user
2. `fetchChatMessages(chatId)` - Get messages for a chat
3. `sendMessage(chatId, senderId, content)` - Send a message
4. `getOrCreateChat(listingId, userId, hostId)` - Find or create chat
5. `subscribeToMessages(chatId, callback)` - Real-time subscription

**Deliverable:** Complete messages API with real-time support.

---

### Task 3.4: Auth API
**Assignees:** 1 engineer  
**Dependencies:** Task 1.7 complete  
**Estimated Hours:** 3

Create `src/lib/authApi.ts`:

1. `signIn(email, password)` - Sign in user
2. `signUp(email, password, name)` - Create account and profile
3. `signOut()` - Sign out user
4. `getCurrentUser()` - Get current session user
5. `updateProfile(userId, updates)` - Update profile data

**Deliverable:** Complete auth API with profile management.

---

### Task 3.5: Connect Screens to APIs
**Assignees:** 2-3 engineers  
**Dependencies:** Tasks 3.1-3.4 complete  
**Estimated Hours:** 8

Update each screen to use real APIs:

1. **HomeScreen**: Fetch listings, handle filters
2. **MapScreen**: Fetch listings with coordinates
3. **ListingDetailScreen**: Fetch by ID, handle save/message
4. **ProfileScreen**: Fetch user listings and saved
5. **MessagesScreen**: Fetch user chats
6. **ChatScreen**: Fetch messages, send messages, subscribe

**Deliverable:** All screens connected to Supabase with live data.

---

## Sprint 4: Features (Week 4)

**Goal:** Implement major features - listing creation and checkout flow.

---

### Task 4.1: Post Listing - Step 1 (Basics)
**Assignees:** 1 engineer  
**Dependencies:** Sprint 2 complete  
**Estimated Hours:** 4

Create `src/screens/NewListing/Step1Basics.tsx`:

1. Monthly rent input
2. Lease term input (months)
3. Requirements field (optional)
4. Address input with Google Places autocomplete (optional)
5. Manual address fields (street, city, state, zip)
6. Unit/Apt number field
7. Validation before proceeding

**Deliverable:** Working step 1 with address entry.

---

### Task 4.2: Post Listing - Step 2 (Details)
**Assignees:** 1 engineer  
**Dependencies:** Sprint 2 complete  
**Estimated Hours:** 4

Create `src/screens/NewListing/Step2Details.tsx`:

1. Bedrooms counter (0 = Studio)
2. Bathrooms counter (supports .5)
3. Furnished toggle
4. Utilities estimate input
5. Deposit input
6. Validation

**Deliverable:** Working step 2 with all property details.

---

### Task 4.3: Post Listing - Step 3 (Dates & Amenities)
**Assignees:** 1 engineer  
**Dependencies:** Sprint 2 complete  
**Estimated Hours:** 4

Create `src/screens/NewListing/Step3DatesAmenities.tsx`:

1. Move-in date picker
2. Move-out date picker (optional)
3. Amenities grid with icons:
   - WiFi, A/C, Heating, Washer/Dryer
   - Parking, Gym, Pool, Pets Allowed
   - Balcony, Elevator, Doorman, etc.
4. Toggle selection for each amenity

**Deliverable:** Working step 3 with dates and amenities.

---

### Task 4.4: Post Listing - Step 4 (Photos & Description)
**Assignees:** 1 engineer  
**Dependencies:** Sprint 2 complete  
**Estimated Hours:** 6

Create `src/screens/NewListing/Step4PhotosDescription.tsx`:

1. Photo picker using expo-image-picker
2. Photo grid with remove button
3. First photo marked as cover
4. Limit to 10 photos
5. Description textarea (max 2000 chars)
6. Character counter
7. Preview & Publish button

**Deliverable:** Working step 4 with photo upload and description.

---

### Task 4.5: Post Listing - Wizard Container
**Assignees:** 1 engineer  
**Dependencies:** Tasks 4.1-4.4 complete  
**Estimated Hours:** 4

Create `src/screens/NewListing/index.tsx`:

1. Manage form state across all steps
2. Progress indicator
3. Navigation between steps
4. Back button and close button
5. Submit handler that:
   - Uploads images to Supabase Storage
   - Creates listing record
   - Creates listing_images records
6. Edit mode support (pre-fill form from existing listing)

**Deliverable:** Complete wizard that creates listings in Supabase.

---

### Task 4.6: Checkout - Screen Layout
**Assignees:** 1 engineer  
**Dependencies:** Sprint 2, Sprint 3 complete  
**Estimated Hours:** 6

Create `src/screens/CheckoutScreen.tsx`:

1. 15-minute countdown timer display
2. Step indicator (1-4)
3. Step 1: Confirm Details
   - Show listing info
   - Price, move-in date, lease term
4. Step 2: Verification
   - Checkboxes for income, credit, references
5. Step 3: Agreement
   - Terms text
   - Agreement checkbox
6. Step 4: Confirm
   - Final summary
   - Submit button

**Deliverable:** Complete checkout UI with all steps.

---

### Task 4.7: Checkout - Logic & Timer
**Assignees:** 1 engineer  
**Dependencies:** Task 4.6 complete  
**Estimated Hours:** 4

Add to CheckoutScreen:

1. On mount: Call startCheckout API
2. Start countdown timer from expires_at
3. On timer expire: Cancel checkout, navigate back
4. On cancel button: Cancel checkout, navigate back
5. On submit: Call completeCheckout, navigate to confirmation
6. Handle errors gracefully

**Deliverable:** Fully functional checkout with timer and API integration.

---

### Task 4.8: Booking Confirmation Screen
**Assignees:** 1 engineer  
**Dependencies:** Task 4.7 complete  
**Estimated Hours:** 3

Create `src/screens/BookingConfirmationScreen.tsx`:

1. Success animation (checkmark)
2. Booking summary card
3. Next steps explanation:
   - Host will review
   - You'll be notified
   - Coordinate move-in via messages
4. Action buttons:
   - Message Host
   - Done (return to Home)

**Deliverable:** Booking confirmation screen with next steps.

---

### Task 4.9: Filter Modal
**Assignees:** 1 engineer  
**Dependencies:** Sprint 2 complete  
**Estimated Hours:** 4

Create `src/components/FilterModal.tsx`:

1. Modal presentation
2. Location filters (city, state)
3. Price range (min/max)
4. Bedrooms counter
5. Furnished toggle
6. Clear all button
7. Apply filters callback

**Deliverable:** Filter modal that updates Home screen listings.

---

## Sprint 5: Polish & Integration (Week 5)

**Goal:** Bug fixes, edge cases, and final polish.

---

### Task 5.1: Loading States
**Assignees:** 1 engineer  
**Dependencies:** Sprint 4 complete  
**Estimated Hours:** 3

1. Create `src/components/LoadingState.tsx`
2. Add loading spinners to all data-fetching screens
3. Ensure consistent loading UI across app

**Deliverable:** Consistent loading states everywhere.

---

### Task 5.2: Error States
**Assignees:** 1 engineer  
**Dependencies:** Sprint 4 complete  
**Estimated Hours:** 3

1. Create `src/components/ErrorState.tsx`
2. Add error handling to all API calls
3. Show user-friendly error messages
4. Add retry buttons where appropriate

**Deliverable:** Graceful error handling throughout app.

---

### Task 5.3: Empty States
**Assignees:** 1 engineer  
**Dependencies:** Sprint 4 complete  
**Estimated Hours:** 3

1. Create `src/components/EmptyState.tsx`
2. Add empty states to:
   - Home (no listings)
   - Profile (no listings, no saved)
   - Messages (no chats)
   - Chat (no messages)

**Deliverable:** Helpful empty states with icons and text.

---

### Task 5.4: Keyboard Handling
**Assignees:** 1 engineer  
**Dependencies:** Sprint 4 complete  
**Estimated Hours:** 3

1. Add KeyboardAvoidingView to all forms
2. Test on iOS and Android
3. Ensure inputs aren't covered by keyboard
4. Handle keyboard dismiss on tap outside

**Deliverable:** Smooth keyboard experience on all screens.

---

### Task 5.5: Pull-to-Refresh
**Assignees:** 1 engineer  
**Dependencies:** Sprint 4 complete  
**Estimated Hours:** 2

1. Add pull-to-refresh to:
   - HomeScreen
   - ProfileScreen
   - MessagesScreen
2. Ensure data reloads on pull

**Deliverable:** Pull-to-refresh on all list screens.

---

### Task 5.6: Navigation Polish
**Assignees:** 1 engineer  
**Dependencies:** Sprint 4 complete  
**Estimated Hours:** 3

1. Ensure back gestures work on iOS
2. Add proper screen transitions
3. Handle deep linking (optional)
4. Test navigation edge cases

**Deliverable:** Smooth navigation throughout app.

---

### Task 5.7: Real-time Updates
**Assignees:** 1 engineer  
**Dependencies:** Sprint 4 complete  
**Estimated Hours:** 4

1. Implement Supabase real-time for messages
2. New messages appear without refresh
3. Handle subscription cleanup on unmount
4. Test with multiple devices

**Deliverable:** Real-time messaging working.

---

### Task 5.8: Testing & QA
**Assignees:** 2-3 engineers  
**Dependencies:** All tasks complete  
**Estimated Hours:** 8

1. Follow QA_CHECKLIST.md
2. Test on iOS and Android
3. Test edge cases:
   - Network errors
   - Expired sessions
   - Race conditions
4. Document any bugs found
5. Fix critical bugs

**Deliverable:** QA checklist completed, critical bugs fixed.

---

## Task Assignment Matrix

| Sprint | Tasks | Engineers Needed |
|--------|-------|------------------|
| Sprint 1 | 1.1-1.8 | 6-8 engineers |
| Sprint 2 | 2.1-2.8 | 8-10 engineers |
| Sprint 3 | 3.1-3.5 | 4-5 engineers |
| Sprint 4 | 4.1-4.9 | 6-8 engineers |
| Sprint 5 | 5.1-5.8 | 6-8 engineers |

## Parallel Work Guidelines

### Safe to Work in Parallel
- Different screens (HomeScreen vs MapScreen vs ProfileScreen)
- Different API files (listingsApi vs messagesApi)
- Different wizard steps (Step1 vs Step2 vs Step3)
- UI components vs API logic

### Requires Coordination
- Navigation changes (affects all screens)
- Theme changes (affects all components)
- Shared types/interfaces
- Database schema changes

### Code Review Process
1. Create feature branch from main
2. Complete task
3. Open PR with task number in title
4. Get 1 approval before merge
5. Squash merge to main

---

## Quick Reference

### Environment Variables
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### Key Commands
```bash
cd subletto-app
npm install          # Install dependencies
npm start            # Start Expo dev server
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
```

### Supabase MCP
If using Cursor with Supabase MCP, you can:
- Run SQL migrations directly
- Query tables for testing
- Check RLS policies

---

*Document Version: 1.0*  
*Last Updated: February 2026*
