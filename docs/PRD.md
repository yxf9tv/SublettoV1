# Room – Product Requirements Document (PRD)

## 1. Overview

**Name:** Room  
**Tagline:** Find Your Perfect Roommates  

Room is a mobile-first marketplace for **room rentals in shared housing**. It helps young adults find affordable housing in expensive cities by connecting them with available spots in multi-bedroom leases.

### 1.1 Problem

Today, it is increasingly expensive for single adults to move to large cities:
- Rent for a 1-bedroom apartment can be $2,000-4,000+/month
- Finding roommates through social media is messy and unstructured
- No dedicated platform exists for booking individual rooms in shared leases
- Current solutions (Craigslist, Facebook groups) lack trust and verification

### 1.2 Solution

Room provides a **dedicated room marketplace** with:

- Structured listings (price, lease terms, amenities, location)
- Airbnb-style checkout flow for instant booking
- Map + feed based discovery
- Direct messaging between hosts and renters
- Identity-verified users
- Host confirmation workflow

### 1.3 Target Users

- **Seekers (Renters)**
  - Young professionals, students, and interns who need affordable housing
  - Looking for 6-12 month leases in shared apartments
  - Want a trustworthy way to find roommates

- **Hosts (Listers)**
  - Current tenants with available rooms in their lease
  - Looking to fill rooms to reduce their own rent burden
  - Want reliable, verified roommates

### 1.4 Core Concept Summary

> "Room is the marketplace for shared housing — a dedicated platform for finding and booking individual rooms, turning informal roommate searches into a clean, trustworthy experience."


## 2. Core Use Cases

### 2.1 Find a Room

- Open app → see home discovery screen with available rooms
- Filter by price range, location, move-in date, furnished, amenities
- Tap into Listing Details
- View location on a map
- Save listing to favorites
- **Book Room** → Start checkout flow

### 2.2 Book a Room (Checkout Flow)

1. Click "Book Room" on available listing
2. **Listing locks for 15 minutes** (prevents double-booking)
3. Complete 4-step checkout:
   - **Confirm Details** - Review price, move-in date, lease term
   - **Verification** - Confirm income/credit/references capability
   - **Agreement** - Accept terms and conditions
   - **Submit** - Send booking request to host
4. Host receives notification and has 24 hours to confirm
5. Once confirmed, coordinate move-in via messaging

### 2.3 Post a Listing

- Fill out structured form: monthly rent, lease term, address, amenities
- Upload photos
- Publish listing
- Receive booking requests and confirm/decline

## 3. MVP Scope

**In scope:**
- Mobile app (Expo React Native)
- Supabase backend with Postgres, Auth, Storage, RLS
- Screens: Auth, Home, Map, Listing Details, Checkout, Post Listing, Messages, Profile

**Out of scope:**
- Payments / escrow
- Reviews system
- Web app

## 4. Key Screens

- **Home**: Room listings with availability status
- **Map**: Geographic view of rooms
- **Listing Details**: Photos, details, Book Room button
- **Checkout**: 4-step flow with 15-min timer
- **Post Listing**: Multi-step wizard
- **Messages**: Chat with hosts/renters
- **Profile**: My listings, settings

## 5. Success Metrics

- DAU / WAU
- Listings created per week
- Booking requests per listing
- Booking confirmation rate
- Retention (7-day, 30-day)
