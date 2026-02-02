# Room – QA Checklist

This checklist covers all major features of the Room app. Each test case should be verified on both iOS and Android devices via Expo Go.

---

## 🔐 Authentication

### Sign Up Flow
- [ ] Can navigate to Sign Up from Login screen
- [ ] Form validates empty fields
- [ ] Form validates invalid email format
- [ ] Form validates password less than 6 characters
- [ ] Successful sign up shows confirmation
- [ ] Loading indicator shows while signing up

### Login Flow
- [ ] Can enter email and password
- [ ] Invalid credentials show error message
- [ ] Successful login navigates to Home screen
- [ ] Loading indicator shows while signing in

### Session Persistence
- [ ] App remembers logged-in user after closing/reopening
- [ ] Sign out clears session and returns to Login screen

---

## 🏠 Home Screen (Listings)

### Listing Display
- [ ] Listings load from Supabase on screen mount
- [ ] Loading indicator shows while fetching
- [ ] Error state shows if fetch fails
- [ ] Empty state shows if no listings
- [ ] Each listing card shows: image, price, title, location, status

### Status Display
- [ ] Available listings show "Available" status
- [ ] In-checkout listings show "In Checkout" status
- [ ] Booked listings show "Booked" status

### Actions
- [ ] Heart icon toggles save state
- [ ] Tapping a listing navigates to Listing Detail

---

## 🗺️ Map Screen

### Map Display
- [ ] Map loads and centers on listings area
- [ ] Listings appear as markers on map
- [ ] Loading indicator shows while fetching

### Marker Interaction
- [ ] Tapping marker shows info pill
- [ ] Info pill shows: image, title, price, status
- [ ] Tapping info pill navigates to Listing Detail

---

## 📝 Post Listing (New Listing Wizard)

### Step 1: Room Details
- [ ] Monthly rent input works
- [ ] Lease term input works (months)
- [ ] Requirements field accepts optional text
- [ ] Address autocomplete works (or manual entry)
- [ ] Unit/Apt number field works
- [ ] City, State, ZIP fields work

### Step 2: Property Details
- [ ] Bedroom counter works
- [ ] Bathroom counter works
- [ ] Furnished toggle works

### Step 3: Dates & Amenities
- [ ] Move-in date picker works
- [ ] Amenities can be toggled

### Step 4: Photos & Description
- [ ] Can add photos
- [ ] Photos can be removed
- [ ] Description field works
- [ ] Preview & Publish creates listing

### Navigation
- [ ] Back button returns to previous step
- [ ] Close button prompts discard confirmation
- [ ] Progress bar updates per step

---

## 📋 Listing Detail Screen

### Content Display
- [ ] Image carousel shows listing images
- [ ] Title displays correctly
- [ ] Price displays with "/mo" label
- [ ] Status badge shows correctly
- [ ] Lease term shows
- [ ] Bed/bath details show
- [ ] Description shows
- [ ] Amenities show
- [ ] Location shows

### Actions - Available Listing (Not Owner)
- [ ] "Book Room" button is visible and green
- [ ] Tapping "Book Room" opens CheckoutScreen
- [ ] Save button toggles heart icon
- [ ] Message button visible

### Actions - In Checkout/Booked Listing
- [ ] "Unavailable" button shows (disabled/gray)
- [ ] Cannot start new checkout

### Actions - Own Listing
- [ ] "Edit Listing" button shows
- [ ] Tapping "Edit" opens edit wizard with pre-filled data

---

## 🛒 Checkout Flow

### Starting Checkout
- [ ] Clicking "Book Room" locks listing
- [ ] Checkout screen opens as modal
- [ ] 15-minute countdown timer starts

### Step 1: Confirm Details
- [ ] Shows listing details (price, move-in, term)
- [ ] Timer displays countdown
- [ ] Continue button proceeds to step 2

### Step 2: Verification
- [ ] Shows verification checkboxes
- [ ] All checkboxes must be checked to proceed
- [ ] Continue button proceeds to step 3

### Step 3: Agreement
- [ ] Shows terms text
- [ ] Agreement checkbox works
- [ ] Continue button proceeds to step 4

### Step 4: Confirm
- [ ] Shows final summary
- [ ] "Submit Request" button completes checkout
- [ ] Success navigates to BookingConfirmation

### Timer Expiry
- [ ] When timer hits 0, checkout cancels
- [ ] User is returned to listing detail
- [ ] Listing returns to Available status

### Cancellation
- [ ] Cancel button shows confirmation
- [ ] Confirming cancel releases lock
- [ ] Listing returns to Available status

---

## ✅ Booking Confirmation Screen

### Display
- [ ] Success animation/checkmark shows
- [ ] Booking details display correctly
- [ ] Next steps are explained

### Actions
- [ ] "Message Host" opens chat
- [ ] "Done" returns to Home

---

## 💬 Messages

### Chat List
- [ ] Shows all user's conversations
- [ ] Each chat shows avatar, name, listing, last message
- [ ] Empty state if no conversations

### Chat Screen
- [ ] Messages display with correct alignment
- [ ] Own messages on right, others on left
- [ ] Can type and send messages
- [ ] New messages appear without refresh

---

## 👤 Profile Screen

### User Info
- [ ] Avatar/initials display
- [ ] Name and email display
- [ ] Listing count shows

### My Listings Tab
- [ ] Shows user's own listings
- [ ] Can tap to view/edit listing
- [ ] Empty state if no listings

### Actions
- [ ] Sign Out button works
- [ ] Confirmation dialog appears

---

## 🧭 Navigation

### Bottom Tab Bar
- [ ] Shows 5 tabs: Home, Map, Post (+), Messages, Profile
- [ ] Active tab is highlighted
- [ ] Post (+) opens NewListing modal

### Stack Navigation
- [ ] ListingDetail slides in correctly
- [ ] CheckoutScreen opens as modal
- [ ] BookingConfirmation opens as modal
- [ ] Back navigation works correctly

---

## 🎨 UI/UX Quality

### Loading States
- [ ] All screens show appropriate loading indicators

### Error States
- [ ] User-friendly error messages display
- [ ] Retry options available

### Empty States
- [ ] Helpful empty states with icons/text

### Visual Consistency
- [ ] Black & white theme applied
- [ ] Green accents for success/available
- [ ] Fonts consistent (Poppins)

---

## 🔧 Edge Cases

### Checkout Race Conditions
- [ ] Cannot book listing already in checkout
- [ ] Cannot have two active checkout sessions
- [ ] Cannot checkout own listing

### Network
- [ ] App handles offline gracefully
- [ ] Checkout fails gracefully if network drops

---

## ✅ Sign-off

| Tester | Date | Platform | Notes |
|--------|------|----------|-------|
|        |      |          |       |

---

*Last updated: Phase 9 - Room Pivot & Checkout System*
