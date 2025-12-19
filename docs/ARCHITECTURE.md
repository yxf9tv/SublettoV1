# Subletto – Architecture Overview

## 1. High-Level Design

Subletto is a **mobile-first** application built with:

- **Frontend:** Expo SDK 54 with React Native 0.81.5 and React 19.1.0 (TypeScript)
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Infra:** Supabase project hosts the database, auth, storage, and any server-side logic via RLS and functions.

The mobile app talks directly to Supabase using the official `@supabase/supabase-js` client, and optionally calls custom Supabase Edge Functions for more complex operations.

This bootstrap repo is intentionally light on code – Cursor will generate most of the implementation using these docs as context.

### Platform Support

- **iOS**: Full support via Expo SDK 54, tested on iOS Simulator and physical devices via Expo Go
- **Android**: Full support via Expo SDK 54, tested on Android Emulator and physical devices via Expo Go
- **Web**: Basic support via `react-native-web`

## 2. Frontend

### 2.0 Environment Variables

The app uses Expo environment variables prefixed with `EXPO_PUBLIC_`:

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public API key

These variables are automatically loaded by Expo and accessible via `process.env.EXPO_PUBLIC_SUPABASE_URL` and `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY`.

**Setup:**
1. Create a `.env` file in the `subletto-app/` directory
2. Add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. The `.env` file is already in `.gitignore` to keep credentials secure
4. Use `.env.example` as a template for other developers

**Supabase Client Usage:**
The Supabase client is initialized in `subletto-app/src/lib/supabaseClient.ts` and exported as a singleton. Import it in your components:

```typescript
import { supabase } from '../lib/supabaseClient';
```

### 2.1 Tech Stack

- **Expo SDK 54** (`expo@^54.0.25`)
- **React Native 0.81.5** (`react-native@0.81.5`)
- **React 19.1.0** (`react@19.1.0`)
- **TypeScript 5.3.3** (`typescript@^5.3.3`)
- **React Navigation 6** (`@react-navigation/native@^6.1.9`, `@react-navigation/bottom-tabs@^6.5.11`, `@react-navigation/native-stack@^6.9.17`)
- **Zustand 4.5.0** (`zustand@^4.5.0`) for global state management
- **react-native-maps 1.20.1** (`react-native-maps@1.20.1`) for map screen
- **Expo Vector Icons** (`@expo/vector-icons@^15.0.3`) for icons
- **Poppins** font family (`@expo-google-fonts/poppins@^0.2.3`) for UI typography

### 2.2 Structure (Planned)

`subletto-app/`

- `src/`
  - `screens/`
    - `HomeScreen.tsx`
    - `MapScreen.tsx`
    - `ListingDetailScreen.tsx`
    - `NewListing/` (wizard steps)
    - `Auth/` (Login, Signup)
    - `InboxScreen.tsx`
    - `ChatScreen.tsx`
    - `ProfileScreen.tsx`
  - `components/`
    - `ListingCard.tsx`
    - `FeaturedCard.tsx`
    - `SearchBar.tsx`
    - `CategoryTabs.tsx`
    - `BottomNavBar.tsx`
    - `MapMarkerAvatar.tsx`
  - `theme/`
    - `colors.ts`
    - `typography.ts`
  - `store/`
    - `authStore.ts`
    - `uiStore.ts`
  - `lib/`
    - `supabaseClient.ts`

### 2.3 Navigation

- Root: Auth stack vs App tabs
- App Tabs:
  - Home
  - Map
  - Post
  - Messages
  - Profile

The bottom nav is **floating**, rounded, with a primary center button for posting a listing, consistent with the shared design references.

## 3. Backend (Supabase)

Supabase provides:

- **Postgres DB**
- **Auth**
- **Storage**
- **RLS (Row-Level Security)**
- **Edge Functions** (optional later)

The mobile app uses Supabase's client for:

- Auth (email/password)
- CRUD on tables (listings, chats, messages, favorites)
- File uploads to Storage for listing images

### 3.1 Database Schema (Conceptual)

Tables (to be created by Cursor + Supabase migrations):

- `users` (or `profiles`)
  - id (uuid, references auth.users.id)
  - email (can be synced from auth.users or stored here)
  - name
  - avatar_url
  - created_at
  - updated_at
  - Note: Supabase Auth provides a built-in `auth.users` table. This table extends it with profile data, or can be named `profiles` to follow Supabase conventions.

- `listings`
  - id (uuid)
  - user_id (fk → users)
  - title
  - description
  - type (enum: SUBLET, TAKEOVER, ROOM)
  - price_monthly
  - utilities_monthly
  - deposit
  - latitude
  - longitude
  - address_line1
  - city
  - state
  - postal_code
  - start_date
  - end_date
  - bedrooms
  - bathrooms
  - furnished (bool)
  - amenities (jsonb)
  - is_active (bool)
  - created_at
  - updated_at

- `listing_images`
  - id (uuid)
  - listing_id (fk → listings)
  - url
  - sort_order

- `saved_listings`
  - id (uuid)
  - user_id (fk → users)
  - listing_id (fk → listings)
  - created_at

- `chats`
  - id (uuid)
  - listing_id (fk → listings)
  - created_at

- `chat_participants`
  - id (uuid, primary key)
  - chat_id (fk → chats)
  - user_id (fk → users)
  - Note: Consider adding a unique constraint on (chat_id, user_id) to prevent duplicate participants

- `messages`
  - id (uuid)
  - chat_id (fk → chats)
  - sender_id (fk → users)
  - content
  - created_at

RLS policies will ensure:
- Users can only see and modify their own data where appropriate
- Listings are public read, but only owners can edit/delete
- Messages/chats visible only to participants

## 4. Data Flow

- Auth:
  - App uses Supabase Auth to register/login users.
  - Supabase returns session and JWT; stored securely on device.
- Listings:
  - App fetches listings via Supabase `from('listings')` queries.
  - App inserts/updates listings using Supabase client while passing user ID.
  - Images uploaded to Supabase Storage and associated via `listing_images` entries.
- Messaging:
  - App subscribes to message changes (optionally via Supabase real-time).
  - Messages are inserted and queried using Supabase client.
- Map:
  - App fetches listings with lat/lng and renders markers on the map.

## 5. Styling & Design System

- Primary typeface: **Poppins** (400, 500, 600, 700)
- Secondary (optional): SF Pro for rating badges
- Colors:
  - Text primary: `#113D43`
  - Accent blue: `#2C67FF`
  - Background: `#F5F5F7`
  - Card: `#FFFFFF`
- Components are:
  - Highly rounded (20–28px radius)
  - Lightly shadowed
  - Persistently consistent across screens (same paddings, spacing, etc.)

## 6. Database Migrations

The database schema has been created via Supabase migrations. All tables, RLS policies, indexes, and constraints are in place:

- `profiles` - User profile data extending auth.users
- `listings` - Property listings with enum type (SUBLET, TAKEOVER, ROOM)
- `listing_images` - Images associated with listings
- `saved_listings` - User's saved/favorited listings
- `chats` - Chat conversations about listings
- `chat_participants` - Users participating in chats
- `messages` - Messages within chats

All migrations have been applied to the Supabase project. RLS policies ensure proper data access control.

## 7. Cursor's Role

Cursor will:
- Generate Expo app structure in `subletto-app/`
- Generate Supabase schema migration SQL and setup scripts (completed)
- Generate Supabase client helpers in the app (completed)
- Implement each screen to match the PRD and design system
- Implement messaging, listing CRUD, and saved listings features using Supabase

Use the `docs/TODO.md` file for a step-by-step task list for Cursor to execute.
