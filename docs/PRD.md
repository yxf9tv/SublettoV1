# Subletto – Product Requirements Document (PRD)

## 1. Overview

**Name:** Subletto  
**Slogan:** The lease marketplace  

Subletto is a mobile-first marketplace for **sublets, lease takeovers, and mid‑term room rentals**, posted directly by current tenants. It digitizes and organizes the informal rental market that currently lives in Facebook groups, GroupMe, and Craigslist.

### 1.1 Problem

Today, students and young adults rely on scattered, messy, and unsafe channels to find or post:
- Semester sublets
- Lease takeovers
- Spare rooms in existing leases

Issues:
- Unstructured posts (missing info, bad photos)
- No filtering, map view, or search beyond text
- Hard to verify posters
- No persistence (posts get buried in feeds)

### 1.2 Solution

Subletto provides a **dedicated lease marketplace** with:

- Structured listings (price, dates, bed/bath, amenities, location)
- Map + feed based discovery
- Direct messaging between renters
- Identity-verified posters
- Launching with college campuses, then expanding to cities

### 1.3 Target Users

- **Seekers**
  - Students, interns, young professionals who need flexible housing (1–12 months)
  - Want an easier way to find real, occupant-listed housing

- **Listers**
  - Current tenants who need to:
    - Sublet their room or unit
    - Transfer their lease
    - Fill a spare bedroom

### 1.4 Core Concept Summary

> “Subletto is **The Lease Marketplace** — a dedicated platform for sublets, lease takeovers, and room rentals, turning messy Facebook housing groups into a clean, searchable app.”


## 2. Core Use Cases

### 2.1 Find a Place

- Open app → see home discovery screen (featured + nearby listings)
- Filter by:
  - Listing type: Sublet / Lease takeover / Room
  - Price range
  - Dates
  - Furnished / unfurnished
  - Amenities
- Tap into Listing Details
- View location on a map
- Save listing to favorites
- Message lister

### 2.2 Post a Listing

- Verify identity (via email/phone + optional ID)
- Fill out structured form:
  - Lease type (sublet / takeover / room)
  - Address / location
  - Dates available
  - Price, utilities, deposit
  - Bed/bath
  - Furnished?
  - Amenities (pool, gym, parking, in-unit W/D, etc.)
  - Free-form description
- Upload 4+ photos
- Publish listing
- Optionally edit, pause, or delete listing

### 2.3 Connect & Close

- Message between seeker and lister
- Share listings with other roommates via in-app chat
- Mark listing as filled (later, post-MVP)


## 3. MVP Scope

**In scope:**

- Mobile app (Expo React Native)
- Supabase backend:
  - Postgres DB schema for users, listings, images, favorites, chats, messages
  - Auth (email/password; magic link optional later)
  - Storage (listing photos)
  - Row-Level Security policies for multi-tenant safety
- Screens:
  - Auth flow (login / sign up)
  - Home discovery
  - Map view
  - Listing details
  - Post listing (multi-step)
  - Inbox + chat
  - Profile (My listings + saved listings)
- Basic analytics events (later)

**Out of scope (for MVP):**

- Payments / escrow
- Landlord / property manager dashboards
- Complex recommendation engine
- Full reviews system
- Web app


## 4. Detailed Feature Requirements

### 4.1 Home Discovery Screen (Primary Screen)

- Top area:
  - “Find housing in [Location]” heading
  - Location selector with current city (e.g., “Charlottesville, VA”)
  - Optional “Current Location” indicator
- Search bar:
  - Rounded, centered, placeholder text like “Search listings”
- Category tabs (pills):
  - All, Sublets, Lease Takeovers, Rooms
- Featured carousel:
  - Horizontal scroll of visually rich cards with image, title, location, price, and rating
  - Note: Rating display is optional for MVP (can show placeholder or omit if not implemented)
- Nearby listings:
  - Vertical list of cards: thumbnail, title, mini-description/location, price, tag (e.g., “Lease Takeover”)
- Save (heart) icon on each card

The style should follow the sample hotel UI provided:
- Poppins typeface
- Primary text color `#113D43`
- Accent blue `#2C67FF`
- Soft shadows and rounded corners
- Elevated, modern hotel-style look

### 4.2 Map Screen

- Full-screen map (inside rounded container)
- Map markers as circular photo avatars of the listing
- Top search bar (floating)
- Central black pill stack with key info for selected listing (e.g., price, lease length, etc.)
- Tap marker or pill → open Listing Details

### 4.3 Listing Details Screen

- Image carousel at top
- Title, price, and lease type
- Dates available
- Bed/bath and other key stats
- Description
- Amenities grouped into Unit and Building
- Map preview
- Save button (heart)
- Primary CTA: “Message lister”

### 4.4 Post Listing Flow

Multi-step flow (wizard):

1. **Basics**
   - Lease type (sublet / takeover / room)
   - Title
   - City, state, address line (for now plain text)
2. **Details**
   - Price (monthly)
   - Utilities estimate
   - Deposit (optional)
   - Bedrooms, bathrooms
   - Furnished toggle
3. **Dates & Amenities**
   - Start / end dates
   - Amenities toggles
   - Tags (pets allowed, undergrad-friendly, etc.)
4. **Photos & Description**
   - Upload multiple images
   - Free-form description
   - Preview listing, then publish

### 4.5 Messaging

- Inbox shows list of chats:
  - Other user’s name
  - Related listing title & thumbnail
  - Last message preview
- Chat screen:
  - Bubbles UI
  - Time stamps
  - Optional typing indicator (later)
  - “Message lister” from Listing Details opens/creates chat thread

### 4.6 Profile

- Show name, avatar, verification status
- Sections:
  - My Listings (cards)
  - Saved Listings (cards)
- Simple settings access

## 5. Non-Functional Requirements

- Smooth 60fps UI on mid-range phones
- Minimal API calls, simple caching
- Secure auth (JWT or Supabase session)
- RLS in Supabase to prevent cross-tenant data leaks
- Clear error states and basic offline handling (at least friendly messages)


## 6. Success Metrics

- DAU / WAU
- Listings created per week
- Messages per listing
- Save rate (saved listings / viewed listings)
- Time to first message per new listing
- Retention (7-day, 30-day)

## 7. Future Enhancements (Post-MVP)

- Search by school/campus with pre-defined areas
- Automatic map-based suggestions
- AI-assisted description generation
- Reviews for buildings/landlords
- Web app
