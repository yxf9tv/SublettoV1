# Phase 8: App Store Submission Implementation Guide

This guide covers the complete App Store submission process, from preparing for review to launching your app.

---

## Overview

| Task ID | Task Name | Estimated Hours | Dependencies |
|---------|-----------|-----------------|--------------|
| SUB-001 | App Store review preparation | 4 | BUILD-005 |
| SUB-002 | Submit to App Store | 3 | SUB-001 |
| SUB-003 | Handle review feedback | 8 | SUB-002 |
| SUB-004 | App Store launch | 2 | SUB-002 |

**Total Estimated Hours:** 17

---

## Prerequisites

- Build uploaded to TestFlight and tested
- All App Store assets complete
- Privacy policy and terms of service published
- Apple Developer account in good standing

---

## SUB-001: App Store Review Preparation

### Step 1: Read App Review Guidelines

Before submission, thoroughly read:
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

**Key sections for Room app:**

| Guideline | Relevance | Action Required |
|-----------|-----------|-----------------|
| 1.1 Safety | User-generated content | Implement reporting mechanism |
| 2.1 App Completeness | No placeholder content | Remove test data |
| 3.1 Payments | In-app purchases | Stripe for services (allowed) |
| 4.2 Minimum Functionality | Must provide value | Ensure core flows work |
| 5.1 Privacy | Data collection | Privacy policy, disclosures |

### Step 2: Create Demo Account

Apple reviewers need to test your app. Create a demo account:

```
Email: demo@roomapp.com
Password: RoomDemo2026!
```

**Set up the demo account with:**
- Profile complete with name and photo
- At least 1 active listing
- Some saved listings
- At least 1 chat conversation
- A completed booking (if possible)

### Step 3: Prepare Review Notes

Write notes to help reviewers understand your app:

```markdown
## App Review Notes for Room

### What is Room?
Room is a marketplace connecting people who have rooms available with those looking for affordable housing.

### Demo Account
Email: demo@roomapp.com
Password: RoomDemo2026!

### How to Test Core Features

1. **Browse Listings**
   - Open the app, you'll see the Home screen
   - Scroll to view listings
   - Tap a listing to see details
   - Use the Map tab to see location-based view

2. **Book a Room**
   - Open any listing with "Available" status
   - Tap "Book Room"
   - Complete the 4-step checkout
   - For payment testing, use: 4242 4242 4242 4242

3. **Post a Listing**
   - Tap the "+" button in the bottom nav
   - Follow the 4-step wizard
   - Fill in details and upload photos
   - Publish the listing

4. **Messaging**
   - Open any listing not owned by demo account
   - Tap "Message Host"
   - Send a message

### Payment Information
We use Stripe for payment processing. The app is currently in test mode.
Test card: 4242 4242 4242 4242, any future expiry, any CVC

### Required Permissions
- **Camera/Photos**: For uploading listing images
- **Location**: For showing nearby listings on map
- **Notifications**: For message and booking alerts

### Contact
For any questions during review:
Email: appstore@roomapp.com
Phone: +1-555-123-4567
```

### Step 4: Pre-Submission Checklist

Verify before submitting:

**App Content:**
- [ ] No placeholder/test content visible
- [ ] All links work (privacy policy, terms, support)
- [ ] App icon appears correctly
- [ ] Splash screen displays properly
- [ ] No console.log statements in production

**Functionality:**
- [ ] Login/signup works
- [ ] Core features complete and functional
- [ ] No crashes in normal usage
- [ ] Payments work (in test mode is OK)

**Legal/Privacy:**
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] All required disclosures made
- [ ] IDFA usage (if any) disclosed

**Metadata:**
- [ ] App name finalized
- [ ] Description written
- [ ] Screenshots uploaded for all required sizes
- [ ] Keywords set
- [ ] Age rating complete
- [ ] Category selected

### Step 5: Permission Justifications

Prepare explanations for each permission:

| Permission | Justification |
|------------|---------------|
| Camera | "Room uses the camera to allow users to take photos of their rooms for listings." |
| Photo Library | "Room accesses your photos to let you select images for your room listings." |
| Location | "Room uses your location to show nearby room listings and display your listing's location on the map." |
| Push Notifications | "Room sends notifications for new messages and booking updates." |

Add these to `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Room uses the camera to allow you to take photos of your room for listings.",
        "NSPhotoLibraryUsageDescription": "Room accesses your photos to let you select images for your listings.",
        "NSLocationWhenInUseUsageDescription": "Room uses your location to show nearby listings.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Room uses your location to show nearby listings even when the app is in the background."
      }
    }
  }
}
```

---

## SUB-002: Submit to App Store

### Step 1: Log into App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account
3. Select **My Apps**
4. Select your app

### Step 2: Select Build

1. Go to **App Store** tab
2. Scroll to **Build** section
3. Click **+** to select a build
4. Choose your TestFlight build
5. Build must be processed (not "Processing")

### Step 3: Complete Version Information

Fill in all required fields:

**What's New in This Version:**
```
Welcome to Room! 🏠

Find your perfect room in a shared living space:
• Browse available rooms near you
• Book instantly with secure checkout
• Message hosts directly
• Post your own room listing

Start finding affordable housing today!
```

### Step 4: Add Screenshots

Upload screenshots for each required device size:
- 6.9" Display (iPhone 15 Pro Max)
- 6.5" Display (iPhone 14 Plus)
- 5.5" Display (iPhone 8 Plus)

Order screenshots to tell a story:
1. Home/discovery
2. Listing detail
3. Checkout
4. Confirmation
5. Map view

### Step 5: Complete App Review Information

**Contact Information:**
- First Name: [Your name]
- Last Name: [Your name]
- Phone: [Your phone]
- Email: [Your email]

**Demo Account:**
- User name: demo@roomapp.com
- Password: RoomDemo2026!

**Notes:** Paste your review notes from Step 3 above

### Step 6: Answer Compliance Questions

**Export Compliance:**
- "Does your app use encryption?" → Yes
- "Does your app qualify for any exemptions?" → Yes
- Select: "Only uses encryption available in iOS/macOS"

**Content Rights:**
- "Does your app contain third-party content?" → No (if applicable)
- If yes, confirm you have rights to use it

**Advertising Identifier (IDFA):**
- "Does this app use the Advertising Identifier?" → No (if not using ads)

### Step 7: Set Pricing and Availability

1. Go to **Pricing and Availability**
2. Price: Free
3. Availability: All territories (or select specific)
4. Pre-order: No

### Step 8: Submit for Review

1. Go back to **App Store** tab
2. Click **Add for Review** (top right)
3. Review all information
4. Click **Submit to App Review**

### Step 9: Confirm Submission

You'll see:
- App Status: **Waiting for Review**
- Estimated review time: 24-48 hours (first submission may take longer)

---

## SUB-003: Handle Review Feedback

### Common Rejection Reasons

#### 1. Guideline 2.1 - App Completeness

**Issue:** App has placeholder content or incomplete features.

**Fix:**
- Remove all test/lorem ipsum content
- Ensure all screens are functional
- Fix any "coming soon" features

#### 2. Guideline 4.3 - Spam/Duplicate

**Issue:** App too similar to existing apps.

**Fix:**
- Emphasize unique features in description
- Add differentiating functionality
- Improve design to be distinctive

#### 3. Guideline 5.1.1 - Data Collection

**Issue:** Privacy practices not clearly disclosed.

**Fix:**
- Update privacy policy with all data types
- Complete App Privacy details in ASC
- Add in-app privacy disclosure

#### 4. Guideline 2.3.3 - Screenshots

**Issue:** Screenshots don't match app functionality.

**Fix:**
- Capture new screenshots from actual app
- Ensure no Photoshopped features
- Show real app screens

#### 5. Guideline 4.2 - Minimum Functionality

**Issue:** App is a wrapper for a website or too simple.

**Fix:**
- Add native functionality
- Ensure app provides value beyond website
- Implement offline features if possible

### Step-by-Step: Responding to Rejection

#### Step 1: Read the Rejection Message

1. Check email for rejection notice
2. Go to App Store Connect → App → **Resolution Center**
3. Read the full rejection reason
4. Note specific guidelines cited

#### Step 2: Understand the Issue

Ask yourself:
- Is the rejection about functionality or metadata?
- Is it a misunderstanding or actual violation?
- Can it be fixed quickly or needs significant changes?

#### Step 3: Options for Response

**Option A: Fix and Resubmit**
1. Address the issues in your app/metadata
2. Create new build (increment build number)
3. Upload to TestFlight
4. Submit for review again

**Option B: Reply to App Review**
1. Go to Resolution Center
2. Reply with clarification
3. Provide additional information
4. Request re-review

**Option C: Appeal**
1. If you believe rejection is incorrect
2. Submit appeal via Resolution Center
3. Provide detailed reasoning
4. Wait for Apple's response

### Step 4: Fix Common Issues

**Missing Functionality:**
```bash
# Increment build number
npm run bump

# Make fixes
# Test thoroughly

# Build and submit
eas build --profile production --platform ios
eas submit --platform ios
```

**Metadata Issues:**
1. Log into App Store Connect
2. Update description, screenshots, etc.
3. Resubmit without new build

### Step 5: Resubmit

1. Address all cited issues
2. Update app if needed
3. Submit for review
4. Add note in Resolution Center explaining fixes:

```
Thank you for your feedback.

We have addressed the issues as follows:

1. [Guideline 2.1] - Removed all placeholder content and ensured all features are complete.

2. [Guideline 5.1.1] - Updated our privacy policy and in-app disclosures.

Please let us know if you need any additional information.
```

### Expedited Review

If you have a critical bug fix:

1. Go to [Contact Us](https://developer.apple.com/contact/app-store/)
2. Select "App Review"
3. Request expedited review
4. Explain the critical nature

---

## SUB-004: App Store Launch

### Step 1: Approval Notification

When approved, you'll see:
- Email: "Your app is Ready for Sale"
- Status: **Ready for Sale** or **Pending Developer Release**

### Step 2: Release Options

**Option A: Immediate Release**
- App goes live within 24 hours
- Good for simple launches

**Option B: Manual Release**
- You control when app goes live
- Good for coordinating marketing

**Option C: Phased Release**
- Gradual rollout over 7 days
- Good for catching issues early

### Step 3: Choose Release Timing

1. Go to App Store Connect
2. **App Store** → **Version**
3. Under **Version Release**, select:
   - Automatically release this version
   - Manually release this version
   - Automatically release over 7 days (phased)

For v1.0, we recommend: **Manually release**

### Step 4: Release the App

If manual release:
1. Click **Release This Version**
2. Confirm release
3. App appears in App Store within 24 hours

### Step 5: Verify Live Listing

1. Search "Room" in App Store (may take time to index)
2. Verify:
   - Icon displays correctly
   - Screenshots show properly
   - Description is complete
   - Price is correct
   - Download works

### Step 6: Post-Launch Monitoring

**Day 1-7:**
- [ ] Monitor crash reports in App Store Connect
- [ ] Check user reviews
- [ ] Respond to support emails
- [ ] Track downloads and usage

**Crash Reports:**
1. App Store Connect → **App Analytics**
2. Check **Crashes** section
3. Review crash logs
4. Prioritize fixes by impact

**User Reviews:**
1. App Store Connect → **Ratings and Reviews**
2. Read all reviews
3. Respond to negative reviews professionally
4. Thank positive reviewers

### Step 7: Prepare for Updates

Plan for quick iteration:

1. Have v1.0.1 ready to address initial feedback
2. Keep build process streamlined
3. Monitor for critical bugs

**Update cycle:**
```bash
# Fix bugs, increment version
npm run bump

# Build and submit
eas build --profile production --platform ios
eas submit --platform ios

# Expedited review if critical
```

---

## Timeline Expectations

| Phase | Duration |
|-------|----------|
| Initial submission | 1-2 hours |
| First review | 24-48 hours (can be longer) |
| If rejected, fix and resubmit | 1-3 days |
| Approval to live | 24 hours |
| Phased rollout (if chosen) | 7 days |

**Total: 3-7 days** from first submission to full availability

---

## App Store Connect Quick Reference

### Key URLs
- App Store Connect: https://appstoreconnect.apple.com
- Resolution Center: App Store Connect → Your App → Resolution Center
- Analytics: App Store Connect → Your App → App Analytics
- TestFlight: App Store Connect → Your App → TestFlight

### Status Meanings

| Status | Meaning |
|--------|---------|
| Prepare for Submission | Not yet submitted |
| Waiting for Review | In queue |
| In Review | Being reviewed (usually < 24h) |
| Pending Developer Release | Approved, waiting for you |
| Ready for Sale | Live in App Store |
| Rejected | Issues need to be fixed |
| Developer Rejected | You withdrew submission |

### Important Contacts

- App Review: Via Resolution Center
- Developer Support: https://developer.apple.com/contact/
- Legal: appstorenotices@apple.com

---

## Launch Day Checklist

**Before Release:**
- [ ] Marketing materials ready
- [ ] Website updated with App Store link
- [ ] Social media posts scheduled
- [ ] Press release ready (if applicable)
- [ ] Support team briefed

**At Release:**
- [ ] Click "Release This Version"
- [ ] Post to social media
- [ ] Send announcement email
- [ ] Monitor for issues

**After Release (Day 1):**
- [ ] Verify app is in App Store
- [ ] Test download on clean device
- [ ] Check crash reports
- [ ] Respond to first reviews

---

## Resources

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Common App Rejections](https://developer.apple.com/app-store/review/rejections/)
- [Apple Developer Support](https://developer.apple.com/support/)

---

*Document Version: 1.0*  
*Last Updated: February 2026*
