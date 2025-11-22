# Subletto – Cursor To‑Do List

This file defines the main implementation steps for Cursor.  
Treat each numbered item as a separate Task.


## Phase 0 – Repo & Docs

### 0.1 – Initialize repo & docs
- Initialize git
- Ensure this `docs/` folder is present
- Read `PRD.md` and `ARCHITECTURE.md` into context

**Task Prompt (for Cursor):**
> You are a senior full-stack engineer. The goal is to build Subletto, a mobile app for sublets and lease takeovers, using Expo React Native + Supabase.  
> Initialize any missing tooling or config in this repo, but DO NOT generate app code yet. Verify that `docs/PRD.md` and `docs/ARCHITECTURE.md` are well-formed and add any minor clarifications as comments if needed.


## Phase 1 – Frontend Bootstrap (Expo)

### 1.1 – Create Expo app (TypeScript)
- Create `subletto-app/` as an Expo project with TypeScript
- Add scripts in its `package.json`

**Task Prompt:**
> In the `subletto-app/` directory, scaffold a new Expo React Native app using TypeScript.  
> Configure basic ESLint + Prettier, and update the root README with instructions to run the mobile app.  
> Do not yet implement features; just a minimal starter App component.


### 1.2 – Install core UI dependencies
- React Navigation (stack + bottom tabs)
- react-native-maps
- Zustand (or Redux Toolkit)

**Task Prompt:**
> In `subletto-app/`, install and configure:
> - React Navigation (stack + bottom tabs)
> - `react-native-maps`
> - A simple global store using Zustand
> Set up a root navigator with a placeholder Home screen and a bottom tab navigator.


### 1.3 – Theme & Fonts (Poppins)
- Implement theme tokens as per PRD
- Integrate Poppins via Expo Google Fonts

**Task Prompt:**
> In `subletto-app/`, create `src/theme/colors.ts` and `src/theme/typography.ts` that match the design tokens in `ARCHITECTURE.md`.  
> Integrate the Poppins font family using `@expo-google-fonts/poppins` and apply it globally in the app.  
> Ensure there is a simple Typography helper to keep consistent text styles.


### 1.4 – Home Discovery Screen UI
- Implement the full UI (no real data yet) based on PRD and design tokens

**Task Prompt:**
> Implement `HomeScreen.tsx` with the layout described in `PRD.md` section 4.1:
> - Top header with location and search
> - Category tabs (All, Sublets, Lease Takeovers, Rooms)
> - Featured listings horizontal carousel
> - Nearby listings vertical list
> Use mock data arrays for now and reusable components in `src/components/` (e.g., `FeaturedCard`, `ListingRowCard`, `CategoryTabs`, `SearchBar`).  
> Match the typography spec provided (Poppins weights and colors).


### 1.5 – Bottom Navigation
- Floating rounded tab bar with center Post button

**Task Prompt:**
> Implement a floating bottom navigation bar in `subletto-app/` consistent with the design: Home, Map, Post, Messages, Profile.  
> Make it visually polished with a rounded background, subtle shadows, and a primary center action button for posting a listing.  
> Hook `HomeScreen` to the Home tab, and create placeholder screens for the others.


## Phase 2 – Supabase Setup (Schema & Client)

### 2.1 – Supabase client helper
- Create `supabaseClient.ts`

**Task Prompt:**
> In `subletto-app/src/lib/`, create `supabaseClient.ts` that initializes Supabase using project URL and anon key from environment variables (Expo config).  
> Ensure it is typed with TypeScript and export a singleton client.  
> Update `ARCHITECTURE.md` with env variable names and usage.


### 2.2 – DB schema (SQL + RLS notes)
- Generate Supabase SQL for tables described in ARCHITECTURE

**Task Prompt:**
> Based on `ARCHITECTURE.md`, create a `docs/SUPABASE_SCHEMA.sql` file containing SQL to create all required tables: users (if needed beyond auth metadata), listings, listing_images, saved_listings, chats, chat_participants, messages.  
> Add comments with suggested RLS policies for each table.  
> Do not execute the SQL – just generate the script for the developer to run in Supabase.


### 2.3 – Listing data access helpers
- Create typed functions to load listings

**Task Prompt:**
> In `subletto-app/src/lib/`, create `listingsApi.ts` that exposes helper functions using Supabase client:
> - `fetchListings(filters)`
> - `fetchListingById(id)`
> - `createListing(payload)`
> - `saveListing(id)` / `unsaveListing(id)`
> Make them strongly typed and aligned with the schema in `SUPABASE_SCHEMA.sql`.


## Phase 3 – Wire Home & Listing Details to Supabase

### 3.1 – Home screen data from Supabase
- Replace mock listings with Supabase data

**Task Prompt:**
> Update `HomeScreen.tsx` to fetch real listings from Supabase using `listingsApi.ts`.  
> - On first load, pull a default set of listings.
> - Apply basic loading and error states.
> - Make category tabs update the Supabase query (filter by listing type).


### 3.2 – Listing Detail Screen implementation
- New screen + navigation from cards

**Task Prompt:**
> Implement `ListingDetailScreen.tsx` that:
> - Accepts a listing ID via navigation params
> - Fetches the listing from Supabase
> - Displays images, price, dates, description, and amenities
> - Offers "Save" and "Message lister" actions (stub the messaging navigation for now).  
> Wire card taps in `HomeScreen` to navigate to this screen.


## Phase 4 – Map Screen

### 4.1 – Map layout
- Rounded map, markers, info pill stack

**Task Prompt:**
> Implement `MapScreen.tsx` using `react-native-maps`:
> - Fetch listings with lat/lng from Supabase.
> - Render circular image markers for each listing.
> - On marker press, show a black pill stack with key info as per PRD.
> - Tapping pill opens `ListingDetailScreen`.  
> Keep styles consistent with the rest of the app.


## Phase 5 – Post Listing Flow

### 5.1 – Multi-step wizard UI
- Steps: basics, details, dates/amenities, photos/description

**Task Prompt:**
> In `subletto-app/`, implement a `NewListing` wizard that collects all fields described in the PRD:
> - Step 1: type, title, location
> - Step 2: price, utilities, deposit, bed/bath, furnished
> - Step 3: dates and amenities
> - Step 4: photos + description, then preview
> Use local component state to manage progress. No Supabase calls yet.


### 5.2 – Supabase integration for listing creation
- Connect wizard to Supabase (including image upload)

**Task Prompt:**
> Wire the `NewListing` wizard to Supabase:
> - Use Supabase Storage for photo uploads.
> - On final submit, upload images, then insert the listing and associated `listing_images` rows.
> - After success, navigate to the created listing’s detail screen.  
> Use the helpers in `listingsApi.ts` and add storage helpers as needed.


## Phase 6 – Auth & Profile

### 6.1 – Auth flow
- Email/password auth via Supabase

**Task Prompt:**
> Implement an Auth flow using Supabase Auth:
> - Screens: Login, Sign Up
> - Use email/password authentication
> - Store session using Supabase client and a global auth store
> - Protect main app navigator so only authenticated users can access it.


### 6.2 – Profile screen
- Show my listings + saved listings

**Task Prompt:**
> Implement `ProfileScreen.tsx`:
> - Show user info from Supabase Auth
> - Fetch and render “My Listings” and “Saved Listings” in sections
> - Offer simple actions: log out, edit profile (stub).


## Phase 7 – Messaging

### 7.1 – Inbox screen
- List of chats for current user

**Task Prompt:**
> Implement `InboxScreen.tsx` that loads chats for the current user from Supabase (`chats` + `chat_participants` + last `messages`).  
> Display other user’s name, listing title, and last message preview.  
> Tapping a chat opens `ChatScreen`.


### 7.2 – Chat screen
- Bubble UI + sending messages

**Task Prompt:**
> Implement `ChatScreen.tsx` with:
> - Messages list (bubbles)
> - Composer input
> - Send button that inserts messages into Supabase
> Use Supabase real-time (if available) or polling to update messages.  
> From `ListingDetailScreen`, "Message lister" should create or reuse a chat and navigate here.


## Phase 8 – Polish & QA

### 8.1 – Error handling and loading states
- Consistent loaders, toasts, and empty states

**Task Prompt:**
> Sweep the app and ensure all data-fetching screens have:
> - Loading indicators
> - User-friendly error messages
> - Empty states where appropriate (no listings, no chats, etc.).


### 8.2 – QA checklist update
- Finalize QA doc

**Task Prompt:**
> Update `docs/QA_CHECKLIST.md` with concrete test cases for each major feature (auth, listings, messaging, posting, map).  
> Ensure it is clear enough for another developer or tester to follow.


---

Run these tasks sequentially. After each major phase, you (the human dev) should run the app on a device/emulator and manually sanity-check the behavior.
