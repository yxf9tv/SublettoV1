# Subletto – The Lease Marketplace

This repo is a **Cursor bootstrap kit** for building Subletto, a mobile app for sublets, lease takeovers, and mid‑term room rentals.

You'll use:
- **Expo SDK 54** with **React Native 0.81.5** and **React 19.1.0** for the mobile app UI
- **Supabase** for database, auth, storage, and (optionally) edge functions

Everything else (actual app code, schemas, functions) will be generated and iterated on inside Cursor using the docs in the `docs/` folder.

## Tech Stack Versions

### Mobile App (`subletto-app/`)
- **Expo SDK**: 54.0.25
- **React Native**: 0.81.5
- **React**: 19.1.0
- **TypeScript**: 5.3.3
- **React Navigation**: 6.x
- **Zustand**: 4.5.0
- **react-native-maps**: 1.20.1

See `subletto-app/package.json` for the complete list of dependencies.

## Quick Start

### Running the Mobile App

1. Navigate to the app directory:
```bash
cd subletto-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

Or use specific platform commands:
```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

4. Open the app:
   - Scan the QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

See `subletto-app/README.md` for more details.

## Project Structure

```
.
├── docs/              # Project documentation (PRD, Architecture, TODO)
├── subletto-app/      # Expo React Native mobile app
└── subletto-api/      # Optional custom backend (not used for MVP)
```

## Documentation

- `docs/PRD.md` - Product Requirements Document
- `docs/ARCHITECTURE.md` - Technical architecture and database schema
- `docs/TODO.md` - Implementation task list
- `docs/QA_CHECKLIST.md` - Testing checklist (to be filled in Phase 8)
