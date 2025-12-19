# Subletto – QA Checklist

This checklist covers all major features of the Subletto app. Each test case should be verified on both iOS and Android devices via Expo Go.

---

## 🔐 Authentication

### Sign Up Flow
- [ ] Can navigate to Sign Up from Login screen
- [ ] Form validates empty name field
- [ ] Form validates empty email field
- [ ] Form validates invalid email format
- [ ] Form validates password less than 6 characters
- [ ] Form validates mismatched passwords
- [ ] Successful sign up shows confirmation message
- [ ] After sign up, user can sign in with new credentials
- [ ] Loading indicator shows while signing up

### Login Flow
- [ ] Can enter email and password
- [ ] Form validates empty email
- [ ] Form validates empty password
- [ ] Invalid credentials show error message
- [ ] Successful login navigates to Home screen
- [ ] Loading indicator shows while signing in
- [ ] "Forgot Password" link is visible (stub functionality OK)

### Session Persistence
- [ ] App remembers logged-in user after closing and reopening
- [ ] Sign out clears session and returns to Login screen

---

## 🏠 Home Screen (Listings)

### Listing Display
- [ ] Listings load from Supabase on screen mount
- [ ] Loading indicator shows while fetching
- [ ] Error state shows if fetch fails (can test by disabling network)
- [ ] Empty state shows if no listings match filters
- [ ] Each listing card shows: image, price, title, location, rating, bed/bath

### Image Gallery
- [ ] Listing cards with multiple images show navigation arrows
- [ ] Tapping left/right arrows navigates between images
- [ ] Arrows fade in/out appropriately
- [ ] Image dots indicate current position (if implemented)

### Category Filters
- [ ] "Filter" button is visible
- [ ] "Sublets", "Takeovers", "Rooms" tabs are visible
- [ ] Tapping a category filters listings appropriately
- [ ] Active category is visually highlighted

### Navigation
- [ ] Tapping a listing card navigates to Listing Detail screen
- [ ] Pull-to-refresh reloads listings (if implemented)

---

## 🗺️ Map Screen

### Map Display
- [ ] Map loads and shows Charlottesville area by default
- [ ] Loading indicator shows while fetching listings
- [ ] Listings with coordinates appear as circular image markers
- [ ] Map region adjusts to show all listings

### Marker Interaction
- [ ] Tapping a marker shows info pill at bottom
- [ ] Info pill shows: image, title, price, type, bed count
- [ ] Tapping info pill navigates to Listing Detail
- [ ] Selected marker has visual highlight (blue border)

### Platform Support
- [ ] On web: Shows fallback message (map not supported)
- [ ] On iOS/Android: Native maps render correctly

---

## 📝 Post Listing (New Listing Wizard)

### Step 1: Basics
- [ ] Listing type options (Sublet, Takeover, Room) are selectable
- [ ] Selected type shows checkmark
- [ ] Title input accepts text (max 100 chars)
- [ ] Character counter updates
- [ ] Address, City, State, ZIP inputs work correctly
- [ ] State auto-capitalizes and limits to 2 chars
- [ ] "Continue" validates required fields before proceeding

### Step 2: Details
- [ ] Price input accepts numbers only
- [ ] Utilities input accepts numbers only
- [ ] Deposit input accepts numbers only
- [ ] Bedroom counter increments/decrements (0 = Studio)
- [ ] Bathroom counter increments/decrements (supports .5)
- [ ] Furnished toggle works
- [ ] "Continue" validates price is entered

### Step 3: Dates & Amenities
- [ ] Start date picker works (sets demo date)
- [ ] End date picker works (sets demo date)
- [ ] Amenities grid displays all options with icons
- [ ] Tapping amenity toggles selection (shows checkmark)
- [ ] Multiple amenities can be selected
- [ ] "Continue" allows proceeding (dates optional)

### Step 4: Photos & Description
- [ ] "Add Photo" button adds placeholder image
- [ ] First image shows "Cover" badge
- [ ] Photos can be removed via X button
- [ ] Photo count shows (X/10)
- [ ] Description textarea accepts text (max 2000 chars)
- [ ] Character counter updates
- [ ] "Preview & Publish" validates at least 1 photo

### Submission
- [ ] If not logged in: Shows preview alert with listing summary
- [ ] If logged in: Creates listing in Supabase and navigates to detail
- [ ] Loading indicator shows during submission
- [ ] Error shows if submission fails

### Navigation
- [ ] Back button returns to previous step
- [ ] Close (X) button prompts "Discard Listing?" confirmation
- [ ] Progress bar updates with each step

---

## 📋 Listing Detail Screen

### Content Display
- [ ] Image carousel shows all listing images
- [ ] Left/right arrows navigate images
- [ ] Pagination dots show current position
- [ ] Title displays correctly
- [ ] Price displays with "/month" label
- [ ] Bed/bath/furnished details show correctly
- [ ] Available dates section shows (if dates exist)
- [ ] Description section shows (if description exists)
- [ ] Amenities section shows enabled amenities
- [ ] Location section shows address

### Actions
- [ ] "Save" button toggles heart icon (local state)
- [ ] "Message Lister" button visible
- [ ] If not logged in: Shows "Sign In Required" alert
- [ ] If viewing own listing: Shows "This is your own listing" alert
- [ ] If viewing other's listing: Creates/opens chat and navigates

### Navigation
- [ ] Back gesture/button returns to previous screen

---

## 💬 Messages (Inbox)

### Chat List
- [ ] Loading indicator shows while fetching chats
- [ ] Empty state shows if no conversations
- [ ] Each chat shows: avatar, other user's name, listing title, last message
- [ ] Time formatting: "Today" times, "Yesterday", weekday, or date
- [ ] Own messages prefixed with "You: "
- [ ] Pull-to-refresh reloads chats

### Navigation
- [ ] Tapping a chat opens ChatScreen

---

## 💬 Chat Screen

### Header
- [ ] Back button returns to inbox
- [ ] Other user's avatar and name display
- [ ] Listing title is tappable (navigates to listing)

### Messages
- [ ] Loading indicator shows while fetching
- [ ] Empty state shows "No messages yet"
- [ ] Own messages appear on right (blue bubbles)
- [ ] Other's messages appear on left (white bubbles)
- [ ] Timestamps show on each message
- [ ] Date headers separate messages from different days

### Sending Messages
- [ ] Composer input accepts text
- [ ] Send button disabled when input is empty
- [ ] Send button shows loading while sending
- [ ] Sent message appears immediately
- [ ] Input clears after sending

### Real-time Updates
- [ ] New messages from other user appear without refresh
- [ ] Messages auto-scroll to bottom

---

## 👤 Profile Screen

### User Info
- [ ] Avatar shows (or initials if no avatar)
- [ ] User name displays
- [ ] User email displays
- [ ] Listings count shows
- [ ] Saved count shows
- [ ] "Edit Profile" button visible (stub OK)

### My Listings Tab
- [ ] Shows user's own listings
- [ ] Empty state if no listings
- [ ] Tapping listing navigates to detail

### Saved Tab
- [ ] Shows saved listings
- [ ] Empty state if nothing saved
- [ ] Tapping listing navigates to detail

### Actions
- [ ] Pull-to-refresh reloads data
- [ ] Sign Out button shows confirmation
- [ ] Confirming Sign Out returns to Login screen

---

## 🧭 Navigation

### Bottom Tab Bar
- [ ] Shows 5 tabs: Home, Map, Post (+), Messages, Profile
- [ ] Active tab is highlighted
- [ ] Tapping Post (+) opens NewListing wizard as modal
- [ ] Tab bar floats above content
- [ ] Content can scroll under the floating tab bar

### Stack Navigation
- [ ] ListingDetail slides in from right
- [ ] NewListing slides up as modal
- [ ] ChatScreen slides in from right
- [ ] Back gestures work on iOS
- [ ] Back buttons work on all screens

---

## 🎨 UI/UX Quality

### Loading States
- [ ] All data-fetching screens show loading indicators
- [ ] Loading indicators are centered and visible

### Error States
- [ ] Network errors show user-friendly messages
- [ ] "Try Again" buttons are available where appropriate

### Empty States
- [ ] Empty states have icons, titles, and helpful subtitles
- [ ] Empty states suggest actions where appropriate

### Visual Consistency
- [ ] Colors match theme (primary: #113D43, accent: #2C67FF)
- [ ] Fonts are consistent (Poppins family)
- [ ] Cards have consistent rounded corners and shadows
- [ ] Spacing is consistent throughout

### Responsive Design
- [ ] UI looks good on various screen sizes
- [ ] Text doesn't overflow or get cut off
- [ ] Buttons are tappable (minimum touch targets)

---

## 🔧 Edge Cases

### Network
- [ ] App handles offline state gracefully
- [ ] Retry options available after network errors

### Data
- [ ] Handles listings with no images
- [ ] Handles listings with missing optional fields
- [ ] Handles very long titles/descriptions (truncation)

### Authentication
- [ ] Protected screens redirect to login if session expires
- [ ] Can't access other users' private data

---

## 📱 Platform-Specific

### iOS
- [ ] Safe area insets respected
- [ ] Status bar style appropriate
- [ ] Keyboard avoidance works in forms
- [ ] Back swipe gesture works

### Android
- [ ] Status bar color matches theme
- [ ] Back button works correctly
- [ ] Keyboard doesn't cover inputs

---

## ✅ Sign-off

| Tester | Date | Platform | Notes |
|--------|------|----------|-------|
|        |      |          |       |

---

*Last updated: Phase 8 completion*
