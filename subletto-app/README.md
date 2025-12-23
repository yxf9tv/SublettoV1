# subletto-app

Expo React Native app for Subletto – The Lease Marketplace.

## Tech Stack

- **Expo SDK 54** (`expo@^54.0.25`)
- **React Native 0.81.5** (`react-native@0.81.5`)
- **React 19.1.0** (`react@19.1.0`)
- **TypeScript 5.3.3** (`typescript@^5.3.3`)
- **React Navigation 6** for navigation
- **Zustand 4.5.0** for state management
- **react-native-maps 1.20.1** for map functionality

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo Go app on your mobile device (for testing)
- iOS Simulator (for macOS) or Android Emulator (optional)

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the App

Start the Expo development server:
```bash
npm start
```

Or use specific platform commands:
```bash
npm run ios      # iOS simulator (requires macOS and Xcode)
npm run android  # Android emulator
npm run web      # Web browser
```

### iOS Preview

The app is configured for iOS preview with:
- **Bundle Identifier**: `com.subletto.app`
- **Supports iPad**: Yes
- **Expo SDK 54** compatibility ensures proper iOS simulator support
- Requires **Xcode** (macOS only) for iOS simulator
- For physical devices, use **Expo Go** app to scan QR code

To run on iOS simulator:
1. Ensure Xcode is installed on macOS
2. Run `npm run ios` or `npx expo start --ios`
3. The iOS simulator will launch automatically

### Development

- The app uses TypeScript for type safety
- ESLint and Prettier are configured for code quality
- Main entry point: `App.tsx`
- Source code is organized in `src/` directory

### Key Dependencies

- **Navigation**: `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`
- **State Management**: `zustand@^4.5.0`
- **Maps**: `react-native-maps@^1.20.1`
- **Icons**: `@expo/vector-icons@^15.0.3`
- **Fonts**: `@expo-google-fonts/poppins@^0.2.3`
- **UI Components**: `react-native-safe-area-context@~5.6.0`, `react-native-screens@~4.16.0`

### Project Structure

```
subletto-app/
├── App.tsx           # Root component
├── app.json          # Expo configuration
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── babel.config.js   # Babel configuration
├── assets/           # Images, fonts, etc.
└── src/              # Source code (to be created)
```

For detailed project requirements, see `../docs/PRD.md` and `../docs/ARCHITECTURE.md`.
