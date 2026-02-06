# Phase 7: QA & Testing Implementation Guide

This guide covers comprehensive testing procedures to ensure the Room app is ready for production release.

---

## Overview

| Task ID | Task Name | Estimated Hours | Dependencies |
|---------|-----------|-----------------|--------------|
| QA-001 | Authentication flow testing | 4 | None |
| QA-002 | Listing CRUD testing | 4 | None |
| QA-003 | Checkout flow testing | 6 | None |
| QA-004 | Chat functionality testing | 3 | None |
| QA-005 | Performance & crash testing | 4 | None |
| QA-006 | iOS/Android parity testing | 4 | None |

**Total Estimated Hours:** 25

---

## Prerequisites

- App running on physical iOS device
- App running on physical Android device (or emulator)
- Test Supabase project with sample data
- Stripe test mode enabled
- Two test user accounts

---

## Testing Environment Setup

### Step 1: Create Test Users

Create at least 2 test accounts:

```
User 1 (Primary Tester):
Email: tester1@roomapp.test
Password: TestPassword123!

User 2 (Secondary Tester):
Email: tester2@roomapp.test
Password: TestPassword123!
```

### Step 2: Create Sample Data

Seed the database with test listings:

```sql
-- Create test profile
INSERT INTO profiles (id, email, name)
VALUES 
  ('test-user-1-uuid', 'tester1@roomapp.test', 'Test User 1'),
  ('test-user-2-uuid', 'tester2@roomapp.test', 'Test User 2');

-- Create test listings
INSERT INTO listings (user_id, title, description, type, status, price_monthly, bedrooms, bathrooms, city, state, latitude, longitude)
VALUES 
  ('test-user-1-uuid', 'Sunny Room in Brooklyn', 'Great room with lots of light', 'ROOM', 'AVAILABLE', 1200, 1, 1, 'Brooklyn', 'NY', 40.6782, -73.9442),
  ('test-user-1-uuid', 'Cozy Studio Share', 'Perfect for students', 'ROOM', 'AVAILABLE', 900, 0, 1, 'Manhattan', 'NY', 40.7831, -73.9712);
```

### Step 3: Test Environment Checklist

Before testing, verify:

- [ ] App connects to correct Supabase project
- [ ] Stripe is in test mode
- [ ] Push notifications configured (for real device)
- [ ] Location services enabled on device

---

## QA-001: Authentication Flow Testing

### Test Cases

#### AUTH-TC01: Email Sign Up - Success
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app (logged out) | Login screen displayed |
| 2 | Tap "Sign Up" link | Navigate to Sign Up screen |
| 3 | Enter valid email | Email accepted |
| 4 | Enter name | Name field populated |
| 5 | Enter password (8+ chars) | Password accepted |
| 6 | Enter matching confirm password | Confirm password accepted |
| 7 | Tap "Sign Up" button | Loading indicator shown |
| 8 | Wait for completion | Navigate to Home screen |
| 9 | Check profile | Name and email displayed |

#### AUTH-TC02: Email Sign Up - Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Leave all fields empty, tap Sign Up | Error: "Email is required" |
| 2 | Enter invalid email format | Error: "Invalid email address" |
| 3 | Enter password < 8 chars | Error: "Password must be at least 8 characters" |
| 4 | Enter non-matching confirm password | Error: "Passwords do not match" |
| 5 | Enter existing email | Error: "Email already registered" |

#### AUTH-TC03: Email Login - Success
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app (logged out) | Login screen displayed |
| 2 | Enter registered email | Email accepted |
| 3 | Enter correct password | Password accepted |
| 4 | Tap "Sign In" button | Loading indicator shown |
| 5 | Wait for completion | Navigate to Home screen |

#### AUTH-TC04: Email Login - Failure
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter registered email | Email accepted |
| 2 | Enter wrong password | Password accepted |
| 3 | Tap "Sign In" | Error: "Invalid login credentials" |

#### AUTH-TC05: Session Persistence
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in successfully | Home screen displayed |
| 2 | Close app completely | App closed |
| 3 | Reopen app | Home screen displayed (still logged in) |

#### AUTH-TC06: Logout
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Profile | Profile screen displayed |
| 2 | Tap "Sign Out" | Confirmation dialog shown |
| 3 | Confirm sign out | Navigate to Login screen |
| 4 | Close and reopen app | Login screen displayed |

#### AUTH-TC07: Apple Sign In (iOS only)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap Apple Sign In button | Apple auth sheet appears |
| 2 | Use Face ID/Touch ID | Authentication successful |
| 3 | Complete sign in | Navigate to Home screen |
| 4 | Check profile | Apple account info displayed |

#### AUTH-TC08: Google Sign In
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap Google Sign In button | Google auth sheet appears |
| 2 | Select Google account | Account selected |
| 3 | Complete sign in | Navigate to Home screen |
| 4 | Check profile | Google account info displayed |

### Test Results Template

| Test ID | Status | Notes | Tester | Date |
|---------|--------|-------|--------|------|
| AUTH-TC01 | ⬜ Pass / ⬜ Fail | | | |
| AUTH-TC02 | ⬜ Pass / ⬜ Fail | | | |
| AUTH-TC03 | ⬜ Pass / ⬜ Fail | | | |
| AUTH-TC04 | ⬜ Pass / ⬜ Fail | | | |
| AUTH-TC05 | ⬜ Pass / ⬜ Fail | | | |
| AUTH-TC06 | ⬜ Pass / ⬜ Fail | | | |
| AUTH-TC07 | ⬜ Pass / ⬜ Fail | | | |
| AUTH-TC08 | ⬜ Pass / ⬜ Fail | | | |

---

## QA-002: Listing CRUD Testing

### Test Cases

#### LIST-TC01: Create Listing - All Fields
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap "Post" tab | New Listing wizard starts |
| 2 | Enter monthly rent ($1500) | Amount accepted |
| 3 | Enter lease term (12 months) | Term accepted |
| 4 | Search address with autocomplete | Suggestions appear |
| 5 | Select address | Address populated |
| 6 | Enter unit number | Unit accepted |
| 7 | Tap Next | Move to Step 2 |
| 8 | Set bedrooms (2) | Counter shows 2 |
| 9 | Set bathrooms (1.5) | Counter shows 1.5 |
| 10 | Toggle Furnished ON | Toggle activated |
| 11 | Tap Next | Move to Step 3 |
| 12 | Select move-in date | Date picker works |
| 13 | Select amenities (WiFi, A/C) | Amenities selected |
| 14 | Tap Next | Move to Step 4 |
| 15 | Add 3 photos | Photos uploaded |
| 16 | Enter description | Description accepted |
| 17 | Tap Publish | Loading shown |
| 18 | Wait for completion | Success message, navigate to listing |

#### LIST-TC02: Create Listing - Minimum Fields
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter only required fields | Form accepts |
| 2 | Skip optional fields | No errors |
| 3 | Publish | Listing created successfully |

#### LIST-TC03: View Listing Detail
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap listing card on Home | Navigate to detail screen |
| 2 | View image carousel | Images display correctly |
| 3 | Swipe between images | Carousel works |
| 4 | Scroll down | All details visible |
| 5 | View map preview | Map shows location |

#### LIST-TC04: Edit Listing (Owner)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Profile | Profile displayed |
| 2 | Tap "My Listings" tab | User's listings shown |
| 3 | Tap own listing | Detail screen opens |
| 4 | Tap "Edit Listing" | Edit wizard opens with pre-filled data |
| 5 | Change price | Price updated |
| 6 | Save changes | Changes saved |
| 7 | View listing again | New price displayed |

#### LIST-TC05: Delete Listing Image
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Edit listing | Wizard opens |
| 2 | Navigate to photos step | Current photos shown |
| 3 | Tap delete on image | Confirmation shown |
| 4 | Confirm delete | Image removed |
| 5 | Save listing | Image deleted from storage |

#### LIST-TC06: View Others' Listing
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find listing not owned by you | Listing displayed |
| 2 | Open listing detail | Detail screen opens |
| 3 | Look for Edit button | "Edit" button NOT visible |
| 4 | "Book Room" button visible | Yes, visible for available |

#### LIST-TC07: Save Listing
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View listing detail | Detail screen displayed |
| 2 | Tap heart/save icon | Icon fills/changes |
| 3 | Navigate to Profile → Saved | Listing appears in saved |
| 4 | Tap save again | Listing unsaved |
| 5 | Check Saved tab | Listing removed |

### Test Results Template

| Test ID | Status | Notes | Tester | Date |
|---------|--------|-------|--------|------|
| LIST-TC01 | ⬜ Pass / ⬜ Fail | | | |
| LIST-TC02 | ⬜ Pass / ⬜ Fail | | | |
| LIST-TC03 | ⬜ Pass / ⬜ Fail | | | |
| LIST-TC04 | ⬜ Pass / ⬜ Fail | | | |
| LIST-TC05 | ⬜ Pass / ⬜ Fail | | | |
| LIST-TC06 | ⬜ Pass / ⬜ Fail | | | |
| LIST-TC07 | ⬜ Pass / ⬜ Fail | | | |

---

## QA-003: Checkout Flow Testing

### Test Cards (Stripe Test Mode)

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0025 0000 3155 | 3D Secure required |
| 4000 0000 0000 9995 | Insufficient funds |

### Test Cases

#### CHECKOUT-TC01: Start Checkout
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open available listing | Detail screen shown |
| 2 | Verify status is "Available" | Status badge correct |
| 3 | Tap "Book Room" | Checkout screen opens |
| 4 | Verify timer starts (15 min) | Timer visible, counting down |
| 5 | Verify listing info displayed | Price, dates correct |

#### CHECKOUT-TC02: Timer Expiration
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start checkout | Timer starts at 15:00 |
| 2 | Wait until timer reaches 00:00 | Timer expires |
| 3 | Observe behavior | Alert shown, return to listing |
| 4 | Check listing status | Back to "Available" |

#### CHECKOUT-TC03: Cancel Checkout
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start checkout | Checkout screen opens |
| 2 | Tap back/cancel button | Confirmation shown |
| 3 | Confirm cancel | Return to listing detail |
| 4 | Check listing status | "Available" again |

#### CHECKOUT-TC04: Complete Steps (No Payment)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start checkout | Step 1 displayed |
| 2 | Review details, tap Next | Step 2 displayed |
| 3 | Check verification boxes | Boxes checked |
| 4 | Tap Next | Step 3 displayed |
| 5 | Check agreement box | Box checked |
| 6 | Tap Next | Step 4 (Payment) or Confirm |

#### CHECKOUT-TC05: Payment - Success
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reach payment step | Payment form displayed |
| 2 | Tap "Pay Now" | Stripe sheet opens |
| 3 | Enter 4242 4242 4242 4242 | Card accepted |
| 4 | Enter any future date, any CVC | Data accepted |
| 5 | Tap "Pay" | Processing shown |
| 6 | Wait for completion | Confirmation screen shown |
| 7 | View booking details | Correct info displayed |

#### CHECKOUT-TC06: Payment - Declined
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reach payment step | Payment form displayed |
| 2 | Enter 4000 0000 0000 0002 | Card accepted |
| 3 | Attempt payment | Error: "Card declined" |
| 4 | Stay on payment step | Can retry with different card |

#### CHECKOUT-TC07: 3D Secure Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter 4000 0025 0000 3155 | Card requires 3DS |
| 2 | Complete payment | 3DS challenge appears |
| 3 | Complete 3DS | Return to app |
| 4 | Payment completes | Confirmation shown |

#### CHECKOUT-TC08: Booking Confirmation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete checkout | Confirmation screen shown |
| 2 | View booking summary | All details correct |
| 3 | Tap "Message Host" | Navigate to chat |
| 4 | Tap "Done" | Return to Home |
| 5 | View listing again | Status shows "Booked" |

#### CHECKOUT-TC09: Concurrent Checkout Prevention
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A starts checkout | Checkout begins |
| 2 | User B opens same listing | Status shows "In Checkout" |
| 3 | User B taps "Book Room" | Error: "Listing unavailable" |
| 4 | User A cancels | Listing available again |
| 5 | User B can now start checkout | Checkout begins |

### Test Results Template

| Test ID | Status | Notes | Tester | Date |
|---------|--------|-------|--------|------|
| CHECKOUT-TC01 | ⬜ Pass / ⬜ Fail | | | |
| CHECKOUT-TC02 | ⬜ Pass / ⬜ Fail | | | |
| CHECKOUT-TC03 | ⬜ Pass / ⬜ Fail | | | |
| CHECKOUT-TC04 | ⬜ Pass / ⬜ Fail | | | |
| CHECKOUT-TC05 | ⬜ Pass / ⬜ Fail | | | |
| CHECKOUT-TC06 | ⬜ Pass / ⬜ Fail | | | |
| CHECKOUT-TC07 | ⬜ Pass / ⬜ Fail | | | |
| CHECKOUT-TC08 | ⬜ Pass / ⬜ Fail | | | |
| CHECKOUT-TC09 | ⬜ Pass / ⬜ Fail | | | |

---

## QA-004: Chat Functionality Testing

### Test Cases

#### CHAT-TC01: Start New Chat
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open listing (not owner) | Detail screen shown |
| 2 | Tap "Message Host" | Chat screen opens |
| 3 | View chat header | Host name, listing title shown |
| 4 | Check messages | Empty or welcome message |

#### CHAT-TC02: Send Message
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open chat | Chat screen displayed |
| 2 | Type message | Text appears in input |
| 3 | Tap send button | Message appears in chat |
| 4 | Message shows on right | Own messages aligned right |
| 5 | Timestamp visible | Correct time shown |

#### CHAT-TC03: Receive Message (Real-time)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A and B in same chat | Both have chat open |
| 2 | User A sends message | Message sent |
| 3 | Check User B's screen | Message appears instantly |
| 4 | No refresh needed | Real-time update |

#### CHAT-TC04: Chat List
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Messages tab | Chat list displayed |
| 2 | View chat item | Shows other user, last message |
| 3 | Tap chat item | Opens chat screen |
| 4 | Send new message | Returns to updated chat list |

#### CHAT-TC05: Push Notification (Backgrounded)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A backgrounds app | App in background |
| 2 | User B sends message | Message sent |
| 3 | User A receives push | Notification appears |
| 4 | Tap notification | App opens to chat |

### Test Results Template

| Test ID | Status | Notes | Tester | Date |
|---------|--------|-------|--------|------|
| CHAT-TC01 | ⬜ Pass / ⬜ Fail | | | |
| CHAT-TC02 | ⬜ Pass / ⬜ Fail | | | |
| CHAT-TC03 | ⬜ Pass / ⬜ Fail | | | |
| CHAT-TC04 | ⬜ Pass / ⬜ Fail | | | |
| CHAT-TC05 | ⬜ Pass / ⬜ Fail | | | |

---

## QA-005: Performance & Crash Testing

### Test Cases

#### PERF-TC01: Home Screen Load Time
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in fresh | Home screen loads |
| 2 | Measure time to display listings | < 2 seconds |
| 3 | Images load smoothly | No flickering |

#### PERF-TC02: Scroll Performance
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load 50+ listings | Listings displayed |
| 2 | Scroll quickly | No lag or stutter |
| 3 | Images lazy load | Placeholders then images |

#### PERF-TC03: Memory Usage
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Xcode/Android Studio profiler | Monitoring started |
| 2 | Use app normally for 10 minutes | Usage recorded |
| 3 | Check memory graph | No continuous increase (leak) |

#### PERF-TC04: Network Failure
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable airplane mode | Network disabled |
| 2 | Try to load listings | Error message shown |
| 3 | Try to send message | Error message shown |
| 4 | Disable airplane mode | App recovers, data loads |

#### PERF-TC05: Slow Network
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use Network Link Conditioner | Slow 3G simulated |
| 2 | Load Home screen | Loading indicator shown |
| 3 | Complete loading | Data eventually loads |
| 4 | Check for timeouts | Reasonable timeout behavior |

#### PERF-TC06: Older Device
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Install on iPhone 8 or older Android | App installs |
| 2 | Navigate all screens | App functions normally |
| 3 | Performance acceptable | No severe lag |

### Crash Scenarios

#### CRASH-TC01: Rapid Navigation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap rapidly between tabs | Navigation handled |
| 2 | No crash occurs | App stable |

#### CRASH-TC02: Background/Foreground
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app, start action | Action in progress |
| 2 | Press home button | App backgrounds |
| 3 | Return to app | App resumes correctly |
| 4 | No crash | Session maintained |

#### CRASH-TC03: Low Memory
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open many apps | Memory pressure |
| 2 | Use Room app | App functions |
| 3 | System may kill background apps | Room handles gracefully |

### Test Results Template

| Test ID | Status | Notes | Tester | Date |
|---------|--------|-------|--------|------|
| PERF-TC01 | ⬜ Pass / ⬜ Fail | Load time: ___s | | |
| PERF-TC02 | ⬜ Pass / ⬜ Fail | | | |
| PERF-TC03 | ⬜ Pass / ⬜ Fail | | | |
| PERF-TC04 | ⬜ Pass / ⬜ Fail | | | |
| PERF-TC05 | ⬜ Pass / ⬜ Fail | | | |
| PERF-TC06 | ⬜ Pass / ⬜ Fail | Device: _____ | | |
| CRASH-TC01 | ⬜ Pass / ⬜ Fail | | | |
| CRASH-TC02 | ⬜ Pass / ⬜ Fail | | | |
| CRASH-TC03 | ⬜ Pass / ⬜ Fail | | | |

---

## QA-006: iOS/Android Parity Testing

### Test Cases

Run each test on BOTH platforms and compare:

#### PARITY-TC01: Visual Consistency
| Aspect | iOS | Android | Match? |
|--------|-----|---------|--------|
| Home screen layout | ⬜ | ⬜ | ⬜ |
| Listing card design | ⬜ | ⬜ | ⬜ |
| Colors and fonts | ⬜ | ⬜ | ⬜ |
| Icons | ⬜ | ⬜ | ⬜ |
| Bottom navigation | ⬜ | ⬜ | ⬜ |

#### PARITY-TC02: Platform-Specific UI
| Component | iOS Expectation | Android Expectation |
|-----------|-----------------|---------------------|
| Date picker | iOS wheel picker | Android calendar |
| Action sheets | iOS action sheet | Android bottom sheet |
| Alerts | iOS alert style | Android dialog |
| Keyboard | iOS keyboard | Android keyboard |
| Back gesture | Swipe from left | Hardware/software back |

#### PARITY-TC03: Feature Parity
| Feature | iOS | Android |
|---------|-----|---------|
| Email auth | ⬜ Works | ⬜ Works |
| Google auth | ⬜ Works | ⬜ Works |
| Apple auth | ⬜ Works | N/A |
| Photo picker | ⬜ Works | ⬜ Works |
| Push notifications | ⬜ Works | ⬜ Works |
| Map view | ⬜ Works | ⬜ Works |
| Payments | ⬜ Works | ⬜ Works |

#### PARITY-TC04: Screen Size Testing
Test on multiple screen sizes:

| Device Type | iOS | Android |
|-------------|-----|---------|
| Small phone | iPhone SE | Pixel 4a |
| Standard phone | iPhone 14 | Pixel 7 |
| Large phone | iPhone 14 Pro Max | Pixel 7 Pro |
| Tablet (if supported) | iPad | Android tablet |

### Test Results Template

| Test ID | iOS Status | Android Status | Notes |
|---------|------------|----------------|-------|
| PARITY-TC01 | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |
| PARITY-TC02 | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |
| PARITY-TC03 | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |
| PARITY-TC04 | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | |

---

## Bug Reporting Template

When a test fails, document the bug:

```markdown
## Bug Report

**ID:** BUG-001
**Severity:** Critical / High / Medium / Low
**Component:** Authentication / Listings / Checkout / Chat / UI

### Summary
[One line description]

### Environment
- Device: iPhone 14 Pro, iOS 17.2
- App Version: 1.0.0 (build 5)
- Network: WiFi

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Screenshots/Videos
[Attach if available]

### Logs
[Include relevant console output]

### Additional Notes
[Any other context]
```

---

## Pre-Release Checklist

Before submitting to App Store:

### Critical (Must Pass)
- [ ] All AUTH tests pass
- [ ] All CHECKOUT tests pass
- [ ] No crashes in normal usage
- [ ] Payment flow works end-to-end

### Important (Should Pass)
- [ ] All LIST tests pass
- [ ] All CHAT tests pass
- [ ] Performance acceptable
- [ ] iOS/Android parity confirmed

### Nice to Have
- [ ] Edge cases handled gracefully
- [ ] Error messages are user-friendly
- [ ] Loading states are smooth

---

## Resources

- [Xcode Instruments](https://help.apple.com/instruments/mac/current/)
- [Android Profiler](https://developer.android.com/studio/profile)
- [Network Link Conditioner](https://nshipster.com/network-link-conditioner/)
- [Stripe Test Cards](https://stripe.com/docs/testing)

---

*Document Version: 1.0*  
*Last Updated: February 2026*
