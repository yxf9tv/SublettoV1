# Phase 5: App Store Assets Implementation Guide

This guide covers creating all required assets and metadata for App Store submission.

---

## Overview

| Task ID | Task Name | Estimated Hours | Dependencies |
|---------|-----------|-----------------|--------------|
| ASSET-001 | App icon (1024x1024) | 4 | None |
| ASSET-002 | App Store screenshots | 6 | None |
| ASSET-003 | App description & keywords | 4 | None |
| ASSET-004 | Privacy policy & terms of service | 4 | None |
| ASSET-005 | App Store Connect metadata | 3 | None |

**Total Estimated Hours:** 21

---

## Prerequisites

- Design tool (Figma, Sketch, or Photoshop)
- App running on iOS Simulator
- Website/hosting for legal documents
- Apple Developer account

---

## ASSET-001: App Icon (1024x1024)

### Step 1: Design Requirements

**Apple Guidelines:**
- Size: 1024x1024 pixels (for App Store)
- Format: PNG without alpha channel (no transparency)
- Shape: Square (iOS rounds the corners automatically)
- No text or words (icon should work at all sizes)
- Avoid photos - use simple, recognizable graphics

### Step 2: Design the Icon

Create an icon that represents "Room" - finding a spot in a shared living space.

**Design suggestions:**
```
Option A: Abstract door/room
- Minimalist door outline
- Warm, inviting color (coral, amber)
- Simple geometric shape

Option B: Key/home hybrid
- Key combined with house shape
- Clean lines
- Two-tone color scheme

Option C: Grid/room layout
- Abstract floor plan
- Multiple "rooms" or dots
- Represents finding your spot
```

**Color recommendations:**
```
Primary: #111827 (dark charcoal - matches app theme)
Accent: #10B981 (success green) or #F59E0B (warm amber)
Background: #FFFFFF or gradient
```

### Step 3: Export Icon Sizes

For Expo/EAS Build, you only need the 1024x1024 version. Expo generates all other sizes.

Create `assets/icon.png` at 1024x1024 pixels.

**If creating manually for Xcode, you need:**

| Size | Usage |
|------|-------|
| 1024x1024 | App Store |
| 180x180 | iPhone (60pt @3x) |
| 120x120 | iPhone (60pt @2x) |
| 167x167 | iPad Pro (83.5pt @2x) |
| 152x152 | iPad (76pt @2x) |
| 87x87 | Spotlight @3x |
| 80x80 | Spotlight @2x |
| 60x60 | Settings @3x |
| 40x40 | Settings @2x |

### Step 4: Update app.json

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.room.app",
      "icon": "./assets/icon.png"
    }
  }
}
```

### Step 5: Create Adaptive Icon (Android)

For Android, create an adaptive icon with foreground and background:

```json
{
  "expo": {
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon-foreground.png",
        "backgroundImage": "./assets/adaptive-icon-background.png",
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
```

**Adaptive icon specs:**
- Foreground: 432x432 with icon centered in 288x288 safe zone
- Background: 432x432 (solid color or pattern)

---

## ASSET-002: App Store Screenshots

### Step 1: Device Sizes Required

**Required sizes for App Store:**

| Device | Size (pixels) | Required |
|--------|---------------|----------|
| iPhone 6.9" (15 Pro Max) | 1320 x 2868 | Yes |
| iPhone 6.7" (14 Pro Max) | 1290 x 2796 | Optional* |
| iPhone 6.5" (11 Pro Max) | 1284 x 2778 | Yes |
| iPhone 5.5" (8 Plus) | 1242 x 2208 | Yes |
| iPad Pro 12.9" | 2048 x 2732 | If supporting iPad |

*One 6.5" or larger screenshot is required

### Step 2: Screens to Capture

Capture 5-10 screenshots showing key features:

1. **Home/Discovery** - Featured listings, search
2. **Listing Detail** - Photos, pricing, book button
3. **Map View** - Location-based search
4. **Checkout Flow** - Booking process
5. **Booking Confirmation** - Success state
6. **Profile** - User listings, saved items
7. **Messages** - Chat interface
8. **Post Listing** - Easy listing creation

### Step 3: Capture Raw Screenshots

**Using iOS Simulator:**

```bash
# Start simulator with specific device
npx expo start --ios

# Press Command+S to save screenshot
# Or use: xcrun simctl io booted screenshot ~/Desktop/screenshot.png
```

**Recommended workflow:**
1. Set up each screen with good sample data
2. Use light mode for most screenshots
3. Capture at native resolution
4. Avoid personal information in screenshots

### Step 4: Add Marketing Graphics

Enhance screenshots with:

**Option A: Simple text overlay**
```
Structure per screenshot:
- Top: Marketing headline (2-4 words)
- Middle: Raw screenshot
- Bottom: (Optional) Subheadline

Example headlines:
1. "Find Your Room"
2. "Browse Listings"
3. "Explore the Map"
4. "Book in Minutes"
5. "Confirmed!"
```

**Option B: Device frame with text**
- Place screenshot in iPhone frame
- Add headline above device
- Add gradient or colored background

### Step 5: Create Using Figma Template

**Figma file structure:**
```
📁 Room App Store Assets
  📁 Screenshots
    📄 iPhone 6.9"
      - Frame 1: Home
      - Frame 2: Detail
      - Frame 3: Map
      - Frame 4: Checkout
      - Frame 5: Confirmation
    📄 iPhone 6.5"
      (duplicate frames, resize)
    📄 iPhone 5.5"
      (duplicate frames, resize)
```

### Step 6: Export Screenshots

Export each frame as PNG:
- Format: PNG or JPEG
- No alpha channel
- sRGB color space

**File naming convention:**
```
room-screenshot-1-home-6.9.png
room-screenshot-2-detail-6.9.png
room-screenshot-3-map-6.9.png
...
```

---

## ASSET-003: App Description & Keywords

### Step 1: App Name (30 characters max)

```
Room - Find Your Spot
```

Alternative options:
- "Room - Easy Rentals"
- "Room Finder"

### Step 2: Subtitle (30 characters max)

```
Affordable Room Rentals
```

Alternatives:
- "Find Your Perfect Room"
- "Rent a Room, Easily"

### Step 3: App Description (4000 characters max)

```
Room makes it simple to find affordable housing by connecting you with people who have rooms available in their homes.

**Finding a room has never been easier:**

Whether you're moving to a new city, looking for a temporary stay, or just want to save money on rent, Room helps you find the perfect spot.

**KEY FEATURES**

🏠 Browse Rooms Near You
Discover available rooms in your area with our easy-to-use map and list views. Filter by price, location, and amenities to find exactly what you're looking for.

📱 Book in Minutes
Our streamlined checkout process lets you reserve a room quickly and securely. No back-and-forth negotiations - just simple, transparent pricing.

💬 Direct Messaging
Chat directly with hosts to ask questions, schedule viewings, or coordinate move-in details. Real-time messaging keeps you connected.

🔒 Verified Profiles
Every host and renter has a profile with ratings and reviews from past stays. Know who you're renting from before you commit.

⭐ Reviews You Can Trust
After every stay, both hosts and guests leave reviews. Build your reputation and find trustworthy roommates.

**HOW IT WORKS**

1. Search: Enter your desired location and browse available rooms
2. Filter: Narrow down by price, dates, and amenities
3. Book: Reserve your spot with our secure checkout
4. Move In: Coordinate with your host and enjoy your new room

**FOR HOSTS**

Have an extra room? List it on Room and start earning. Our simple listing process takes just minutes, and we handle payments securely.

- Easy photo uploads
- Set your own price
- Choose your availability
- Screen potential renters

**WHY ROOM?**

Traditional apartment hunting is stressful and expensive. Room offers a better way:

- More affordable than renting alone
- Flexible lease terms
- Built-in community
- Secure payments
- 24/7 support

Download Room today and find your perfect spot!

---
Questions? Contact us at support@roomapp.com
```

### Step 4: Keywords (100 characters max)

Keywords are comma-separated, no spaces after commas:

```
room,rental,roommate,housing,apartment,sublet,rent,share,affordable,monthly
```

**Keyword research tips:**
- Use App Store keyword tools (App Annie, Sensor Tower)
- Include competitor names if allowed
- Focus on what users search for
- Avoid duplicating words from app name

### Step 5: Promotional Text (170 characters max)

This can be updated without a new app version:

```
Find affordable rooms near you. Book instantly with verified hosts. Save money on rent and find your perfect spot today!
```

### Step 6: What's New (4000 characters max)

For version 1.0:

```
Welcome to Room! 🏠

We're excited to launch the easiest way to find affordable rooms and connect with great roommates.

Version 1.0 Features:
• Browse rooms near you with map and list views
• Book instantly with secure checkout
• Message hosts directly
• Create and manage your listings
• Save your favorite rooms
• Leave and view reviews

Start finding your perfect spot today!
```

---

## ASSET-004: Privacy Policy & Terms of Service

### Step 1: Privacy Policy Requirements

Apple requires you to have a privacy policy if you collect ANY user data.

**Must include:**
- What data you collect
- How you use the data
- Who you share it with
- How users can delete their data
- Contact information

### Step 2: Create Privacy Policy

**Option A: Use a generator**
- [Termly](https://termly.io) - Free tier available
- [Iubenda](https://iubenda.com) - Free tier available
- [PrivacyPolicies.com](https://privacypolicies.com)

**Option B: Write your own**

Create a document covering:

```markdown
# Room Privacy Policy

Last updated: [Date]

## Introduction

Room ("we", "our", or "us") operates the Room mobile application. This privacy policy explains how we collect, use, and protect your information.

## Information We Collect

### Account Information
- Email address
- Name
- Profile photo (optional)

### Listing Information
- Property photos
- Address and location
- Pricing and availability

### Usage Data
- App interactions
- Device information
- IP address

### Payment Information
- Payments are processed by Stripe
- We do not store credit card numbers

## How We Use Your Information

- To provide and maintain the service
- To facilitate bookings between users
- To communicate with you
- To improve the app

## Data Sharing

We share data with:
- Other users (listings, profiles, messages)
- Service providers (Stripe, Supabase)
- Law enforcement if required

## Data Retention

We retain your data while your account is active. You can request deletion at any time.

## Your Rights

You have the right to:
- Access your data
- Correct inaccurate data
- Delete your data
- Export your data

## Contact Us

Email: privacy@roomapp.com

## Changes

We may update this policy. Check back periodically.
```

### Step 3: Create Terms of Service

```markdown
# Room Terms of Service

Last updated: [Date]

## Acceptance of Terms

By using Room, you agree to these terms.

## The Service

Room is a platform connecting people looking for rooms with those who have rooms available.

## User Accounts

- You must be 18+ to use Room
- You are responsible for your account
- Provide accurate information

## Listings

Hosts are responsible for:
- Accuracy of listing information
- Compliance with local laws
- Safety of their property

## Bookings

- Bookings are agreements between users
- Room facilitates but is not party to agreements
- Cancellation policies are set by hosts

## Payments

- Payments processed by Stripe
- Room charges a service fee
- Payouts to hosts per our payout schedule

## Prohibited Conduct

- No illegal activity
- No harassment
- No fraudulent listings
- No spam

## Limitation of Liability

Room is not liable for:
- Issues between users
- Property damage
- Personal injury

## Termination

We may terminate accounts that violate these terms.

## Contact

support@roomapp.com
```

### Step 4: Host Documents

**Option A: Host on your own website**
```
https://roomapp.com/privacy
https://roomapp.com/terms
```

**Option B: Use GitHub Pages**
1. Create a public repo
2. Add markdown files
3. Enable GitHub Pages
4. URL: `https://username.github.io/room-legal/privacy`

**Option C: Use Notion**
1. Create public Notion pages
2. Use the public share links

### Step 5: Add Links to App

In your settings/profile screen:

```typescript
import { Linking } from 'react-native';

const PRIVACY_URL = 'https://roomapp.com/privacy';
const TERMS_URL = 'https://roomapp.com/terms';

<TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
  <Text>Privacy Policy</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
  <Text>Terms of Service</Text>
</TouchableOpacity>
```

---

## ASSET-005: App Store Connect Metadata

### Step 1: Log into App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account
3. Go to **My Apps** → **+** → **New App**

### Step 2: Basic Information

**App Information:**
- Name: Room - Find Your Spot
- Primary Language: English
- Bundle ID: com.room.app (must match app.json)
- SKU: room-app-ios (internal identifier)

### Step 3: Pricing and Availability

- Price: Free
- Availability: All territories (or select specific)
- Pre-Order: No (for v1.0)

### Step 4: App Privacy

Complete the App Privacy questionnaire:

**Data Types Collected:**

| Data Type | Collected | Linked to User | Tracking |
|-----------|-----------|----------------|----------|
| Contact Info (Email) | Yes | Yes | No |
| User Content (Photos) | Yes | Yes | No |
| Identifiers | Yes | Yes | No |
| Usage Data | Yes | Yes | No |
| Location | Yes | Yes | No |

### Step 5: Age Rating

Answer the questionnaire:

- Cartoon or Fantasy Violence: None
- Realistic Violence: None
- Sexual Content: None
- Profanity: None
- Drugs: None
- Gambling: None
- Horror: None
- Medical: None
- Alcohol: None

**Resulting rating:** 4+ (most likely)

### Step 6: Category Selection

- **Primary Category:** Lifestyle
- **Secondary Category:** Travel (optional)

### Step 7: Contact Information

**Support URL:** https://roomapp.com/support
**Marketing URL:** https://roomapp.com (optional)
**Privacy Policy URL:** https://roomapp.com/privacy (REQUIRED)

### Step 8: Review Information

**Contact for Review Team:**
- First Name: [Your name]
- Last Name: [Your name]
- Phone: [Your phone]
- Email: [Your email]

**Demo Account (Required if app has login):**
- Username: demo@roomapp.com
- Password: DemoPassword123!

**Notes for Review:**
```
Thank you for reviewing Room!

Demo account credentials are provided above. The app allows users to:
1. Browse available room listings
2. Book rooms with a secure checkout
3. Message hosts
4. Post their own listings

Test card for payments (Stripe test mode):
4242 4242 4242 4242, any future date, any CVC

Please contact us if you have any questions.
```

### Step 9: Export Compliance

**Does your app use encryption?**

Most apps answer: **Yes** (for HTTPS)

Then: **Available as exempt** because you only use encryption for:
- Standard HTTPS/TLS
- Standard encryption APIs provided by iOS

This exempts you from annual reporting.

---

## Asset Checklist

- [ ] App icon 1024x1024 created and in assets/
- [ ] Adaptive icon for Android created
- [ ] 6.9" iPhone screenshots (5-10 images)
- [ ] 6.5" iPhone screenshots (5-10 images)
- [ ] 5.5" iPhone screenshots (5-10 images)
- [ ] App name and subtitle finalized
- [ ] Full description written
- [ ] Keywords list optimized
- [ ] What's New text prepared
- [ ] Privacy policy created and hosted
- [ ] Terms of service created and hosted
- [ ] Links to legal docs added in app
- [ ] App Store Connect app created
- [ ] All metadata fields completed
- [ ] Demo account credentials prepared
- [ ] Age rating questionnaire completed
- [ ] Export compliance answered

---

## Resources

- [App Store Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications)
- [App Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [App Store Product Page](https://developer.apple.com/app-store/product-page/)
- [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Termly Privacy Policy Generator](https://termly.io)

---

*Document Version: 1.0*  
*Last Updated: February 2026*
