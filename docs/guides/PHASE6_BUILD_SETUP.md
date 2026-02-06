# Phase 6: Build & Deploy Implementation Guide

This guide covers setting up EAS Build, configuring production environments, and creating App Store ready builds.

---

## Overview

| Task ID | Task Name | Estimated Hours | Dependencies |
|---------|-----------|-----------------|--------------|
| BUILD-001 | EAS Build configuration | 6 | None |
| BUILD-002 | iOS certificates & provisioning | 4 | BUILD-001 |
| BUILD-003 | Production environment variables | 3 | BUILD-001 |
| BUILD-004 | Production iOS build | 4 | BUILD-002, BUILD-003 |
| BUILD-005 | TestFlight distribution | 4 | BUILD-004 |

**Total Estimated Hours:** 21

---

## Prerequisites

- Apple Developer Program membership ($99/year)
- Expo account (free)
- Node.js 18+
- Completed app ready for production

---

## BUILD-001: EAS Build Configuration

### Step 1: Install EAS CLI

```bash
# Install globally
npm install -g eas-cli

# Verify installation
eas --version
```

### Step 2: Log In to Expo

```bash
# Log in (creates account if needed)
eas login

# Verify login
eas whoami
```

### Step 3: Initialize EAS in Project

```bash
cd subletto-app

# Configure EAS for your project
eas build:configure
```

This creates `eas.json` in your project root.

### Step 4: Configure eas.json

Update `eas.json` with proper build profiles:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "env": {
        "APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "env": {
        "APP_ENV": "preview"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### Step 5: Update app.json for EAS

Add EAS project ID and owner:

```json
{
  "expo": {
    "name": "Room",
    "slug": "room",
    "version": "1.0.0",
    "owner": "your-expo-username",
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    },
    "ios": {
      "bundleIdentifier": "com.room.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.room.app",
      "versionCode": 1
    }
  }
}
```

### Step 6: Link to EAS Project

```bash
# Create/link EAS project
eas init

# This will output your project ID
# Add it to app.json under extra.eas.projectId
```

### Step 7: Test Development Build

```bash
# Create a development build for simulator
eas build --profile development --platform ios
```

---

## BUILD-002: iOS Certificates & Provisioning

### Step 1: Understand Certificate Types

**Distribution Certificate:**
- Signs your app for App Store
- 3-year validity
- Max 3 per account

**Provisioning Profile:**
- Links certificate to app and devices
- App Store profile for production

### Step 2: Let EAS Manage Credentials (Recommended)

EAS can automatically create and manage certificates:

```bash
# View current credentials
eas credentials

# Select iOS
# Choose "Production" or "Distribution"
# Let EAS create new credentials when prompted
```

### Step 3: Manual Certificate Setup (Alternative)

If you need to manage certificates manually:

**Step 3a: Create Certificate in Apple Developer Portal**

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. **Certificates, Identifiers & Profiles** → **Certificates**
3. Click **+** to create new certificate
4. Select **Apple Distribution**
5. Upload CSR (Certificate Signing Request)
6. Download and install certificate

**Step 3b: Create CSR on Mac**

```bash
# Open Keychain Access
# Certificate Assistant → Request a Certificate from a Certificate Authority
# Enter email, select "Saved to disk"
# This creates a .certSigningRequest file
```

**Step 3c: Create Provisioning Profile**

1. **Certificates, Identifiers & Profiles** → **Profiles**
2. Click **+** to create new profile
3. Select **App Store** under Distribution
4. Select your App ID
5. Select your Distribution Certificate
6. Name: "Room App Store"
7. Download

**Step 3d: Upload to EAS**

```bash
# Import existing credentials
eas credentials

# Select "Upload credentials"
# Provide certificate (.p12) and profile (.mobileprovision)
```

### Step 4: Verify Credentials

```bash
# Check credentials are configured
eas credentials

# Should show:
# ✓ Distribution Certificate
# ✓ App Store Provisioning Profile
```

---

## BUILD-003: Production Environment Variables

### Step 1: Identify Production Variables

Create a checklist of environment variables needed:

```
Required for production:
✓ EXPO_PUBLIC_SUPABASE_URL (production project)
✓ EXPO_PUBLIC_SUPABASE_ANON_KEY (production project)
✓ EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY (live key: pk_live_...)
✓ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
✓ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
✓ EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
```

### Step 2: Set Up Production Supabase Project

If using separate production project:

1. Create new Supabase project
2. Run all migrations
3. Configure RLS policies
4. Set up Edge Functions
5. Get production URL and anon key

### Step 3: Get Production Stripe Keys

1. In Stripe Dashboard, toggle OFF "Test mode"
2. Go to **Developers** → **API keys**
3. Copy the **Publishable key** (pk_live_...)
4. Update webhook endpoints to production

### Step 4: Add Secrets to EAS

```bash
# Add each secret to EAS
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://yourproject.supabase.co"

eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-production-anon-key"

eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_live_xxxxx"

eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "your-google-maps-key"
```

### Step 5: List Secrets

```bash
# Verify all secrets are set
eas secret:list
```

### Step 6: Configure Build Profiles to Use Secrets

Update `eas.json`:

```json
{
  "build": {
    "production": {
      "distribution": "store",
      "env": {
        "APP_ENV": "production"
      }
    }
  }
}
```

Secrets are automatically available in production builds.

### Step 7: Local Testing with Production Keys

Create `.env.production` for local testing:

```bash
# .env.production (DO NOT COMMIT)
EXPO_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-key
```

Add to `.gitignore`:
```
.env.production
```

---

## BUILD-004: Production iOS Build

### Step 1: Pre-Build Checklist

Before building, verify:

- [ ] Version number updated in app.json
- [ ] Build number incremented
- [ ] All features tested locally
- [ ] No console.log statements (or acceptable)
- [ ] App icon is set
- [ ] Splash screen is configured
- [ ] All credentials configured in EAS

### Step 2: Update Version Numbers

In `app.json`:

```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.room.app",
      "buildNumber": "1"
    }
  }
}
```

**Version numbering:**
- `version`: User-facing version (1.0.0, 1.0.1, 1.1.0)
- `buildNumber`: Incremented for each upload (1, 2, 3...)

### Step 3: Run Production Build

```bash
# Start the production build
eas build --profile production --platform ios
```

### Step 4: Monitor Build

The build runs in the cloud. Monitor progress:

1. Build starts (queued)
2. Installing dependencies
3. Building native code
4. Signing app
5. Uploading artifact

**Build time:** Usually 15-30 minutes

### Step 5: View Build in Dashboard

1. Go to [expo.dev](https://expo.dev)
2. Select your project
3. View **Builds** tab
4. Monitor progress and logs

### Step 6: Download Build Artifact

Once complete:

```bash
# List recent builds
eas build:list

# Download specific build
# The build page provides a direct download link
```

### Step 7: Handle Build Failures

Common issues and solutions:

**Certificate issues:**
```bash
# Regenerate credentials
eas credentials
# Delete and recreate if needed
```

**Dependency issues:**
```bash
# Clear cache and rebuild
rm -rf node_modules
npm install
npx expo prebuild --clean
eas build --profile production --platform ios
```

**Native module issues:**
- Check expo-doctor for compatibility
```bash
npx expo-doctor
```

---

## BUILD-005: TestFlight Distribution

### Step 1: Submit to App Store Connect

Use EAS Submit to upload directly:

```bash
# Submit the latest production build
eas submit --platform ios
```

Or submit a specific build:

```bash
# Get build ID from eas build:list
eas submit --platform ios --id BUILD_ID
```

### Step 2: Configure Submission

First time setup prompts for:

- **Apple ID:** Your developer account email
- **App-specific password:** Generate at appleid.apple.com
- **App Store Connect API Key:** (Optional, for CI/CD)
- **ASC App ID:** Find in App Store Connect

### Step 3: App Store Connect API Key (Recommended)

For smoother submissions:

1. App Store Connect → **Users and Access** → **Keys**
2. Click **+** to generate API key
3. Download .p8 file (only downloads once!)
4. Note: Key ID, Issuer ID

Configure in EAS:
```bash
eas credentials
# Select "App Store Connect API Key"
# Upload .p8 file and enter IDs
```

### Step 4: Wait for Processing

After upload:
- Processing takes 10-60 minutes
- You'll receive email when complete
- Build appears in TestFlight tab

### Step 5: Configure TestFlight

In App Store Connect:

1. Go to **TestFlight** tab
2. Select your build
3. Fill in **Test Information:**
   - What to Test (describe features)
   - Beta App Description
   - Feedback Email
4. Export Compliance: Mark as appropriate

### Step 6: Internal Testing

Add internal testers (your team):

1. **App Store Connect Users** tab
2. Add users with Apple IDs
3. They receive TestFlight invitation

Internal testing:
- No review required
- Up to 100 testers
- Access to all builds

### Step 7: External Testing

For broader testing:

1. Create **External Testing** group
2. Add testers by email
3. Submit build for **Beta App Review**
4. Review takes 24-48 hours
5. Once approved, testers get access

External testing:
- Requires Beta App Review
- Up to 10,000 testers
- Good for public beta

### Step 8: TestFlight App for Testers

Testers need to:

1. Download TestFlight from App Store
2. Open invitation email/link
3. Accept the invitation
4. Install your app

### Step 9: Gather Feedback

TestFlight provides:
- Crash reports
- Screenshots from testers
- In-app feedback (optional)

Monitor in App Store Connect:
- **TestFlight** → **Crashes**
- **TestFlight** → **Feedback**

### Step 10: Iterate

Based on feedback:

1. Fix issues
2. Increment buildNumber in app.json
3. Create new build
4. Submit to TestFlight
5. Testers automatically get update option

---

## Quick Reference

### Common EAS Commands

```bash
# Build commands
eas build --profile development --platform ios    # Development build
eas build --profile preview --platform ios        # Preview build
eas build --profile production --platform ios     # Production build
eas build:list                                    # List recent builds
eas build:cancel                                  # Cancel running build

# Submit commands
eas submit --platform ios                         # Submit latest build
eas submit --platform ios --latest               # Submit latest build

# Credentials
eas credentials                                   # Manage credentials
eas secret:create                                 # Add secret
eas secret:list                                   # List secrets
eas secret:delete                                 # Remove secret

# Project
eas init                                          # Initialize EAS project
eas update                                        # OTA update (EAS Update)
eas whoami                                        # Check login
```

### Version Increment Script

Create `scripts/bump-version.js`:

```javascript
const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '../app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));

// Increment build number
const currentBuild = parseInt(appJson.expo.ios.buildNumber, 10);
appJson.expo.ios.buildNumber = String(currentBuild + 1);

// Also increment Android if present
if (appJson.expo.android?.versionCode) {
  appJson.expo.android.versionCode = currentBuild + 1;
}

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log(`Build number incremented to ${currentBuild + 1}`);
```

Add npm script:
```json
{
  "scripts": {
    "bump": "node scripts/bump-version.js"
  }
}
```

Usage:
```bash
npm run bump
eas build --profile production --platform ios
```

---

## Troubleshooting

### Build stuck in queue
- Check EAS status: https://status.expo.dev
- Consider upgrading plan for priority builds

### "No matching provisioning profile"
```bash
eas credentials
# Delete and recreate provisioning profile
```

### "Invalid certificate"
- Check certificate hasn't expired
- Regenerate via eas credentials

### App rejected from TestFlight
- Check Beta App Review guidelines
- Common issues: missing permissions justification, payment issues

### Testers can't install
- Verify UDID is registered (for ad-hoc builds)
- For TestFlight, ensure invitation was accepted

---

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Apple TestFlight](https://developer.apple.com/testflight/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)

---

*Document Version: 1.0*  
*Last Updated: February 2026*
