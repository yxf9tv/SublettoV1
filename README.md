# Subletto – The Lease Marketplace

This repo is a **Cursor bootstrap kit** for building Subletto, a mobile app for sublets, lease takeovers, and mid‑term room rentals.

You'll use:
- **Expo React Native** for the mobile app UI
- **Supabase** for database, auth, storage, and (optionally) edge functions

Everything else (actual app code, schemas, functions) will be generated and iterated on inside Cursor using the docs in the `docs/` folder.

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
