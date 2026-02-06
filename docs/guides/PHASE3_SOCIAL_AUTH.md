# Phase 3: Social Authentication Implementation Guide

This guide covers the implementation of Apple Sign-In and Google Sign-In for the Room app using Supabase Auth.

---

## Overview

| Task ID | Task Name | Estimated Hours | Dependencies |
|---------|-----------|-----------------|--------------|
| AUTH-001 | Apple Sign-In implementation | 8 | None |
| AUTH-002 | Google Sign-In implementation | 8 | None |
| AUTH-003 | Auth flow updates for social login | 4 | AUTH-001, AUTH-002 |

**Total Estimated Hours:** 20

---

## Prerequisites

- Apple Developer account ($99/year) for Apple Sign-In
- Google Cloud Console project for Google Sign-In
- Supabase project with Auth enabled
- Expo SDK 54+

---

## AUTH-001: Apple Sign-In Implementation

### Step 1: Configure Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Go to **Identifiers** → Select your App ID
4. Enable **Sign In with Apple** capability
5. Click **Edit** next to Sign In with Apple
6. Configure as **Primary App ID**

### Step 2: Configure Supabase for Apple Auth

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Apple**
3. You'll need:
   - **Service ID** (for web-based auth, optional for native)
   - For native iOS, no additional config needed

### Step 3: Install Dependencies

```bash
cd subletto-app
npx expo install expo-apple-authentication
```

### Step 4: Update app.json

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.room.app",
      "usesAppleSignIn": true
    }
  }
}
```

### Step 5: Create Apple Sign-In Hook

Create `src/hooks/useAppleAuth.ts`:

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';

export function useAppleAuth() {
  const { setUser, setSession } = useAuthStore();

  const isAvailable = Platform.OS === 'ios';

  const signInWithApple = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isAvailable) {
      return { success: false, error: 'Apple Sign-In is only available on iOS' };
    }

    try {
      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Get the identity token
      const { identityToken, fullName, email } = credential;

      if (!identityToken) {
        return { success: false, error: 'No identity token received from Apple' };
      }

      // Sign in with Supabase using the Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });

      if (error) {
        console.error('Supabase Apple auth error:', error);
        return { success: false, error: error.message };
      }

      // Update profile with Apple name (only available on first sign-in)
      if (data.user && fullName) {
        const displayName = [fullName.givenName, fullName.familyName]
          .filter(Boolean)
          .join(' ');

        if (displayName) {
          await supabase
            .from('profiles')
            .update({ 
              name: displayName,
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.user.id);
        }
      }

      // Update auth store
      setUser(data.user);
      setSession(data.session);

      return { success: true };
    } catch (error: any) {
      // Handle user cancellation
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: 'Sign-in cancelled' };
      }

      console.error('Apple Sign-In error:', error);
      return { success: false, error: error.message || 'Apple Sign-In failed' };
    }
  };

  return {
    signInWithApple,
    isAvailable,
  };
}
```

### Step 6: Create Apple Sign-In Button Component

Create `src/components/AppleSignInButton.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

export function AppleSignInButton({ onPress, disabled }: Props) {
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={12}
        style={styles.button}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
  },
  button: {
    width: '100%',
    height: 50,
  },
});
```

### Step 7: Ensure Profile Creation

Apple Sign-In may not always provide email (users can choose to hide it). Update your profile creation logic:

```typescript
// In your auth state listener or after successful sign-in
async function ensureProfileExists(user: User) {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!existingProfile) {
    // Create profile
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email || null, // May be null for Apple
      name: user.user_metadata?.full_name || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}
```

---

## AUTH-002: Google Sign-In Implementation

### Step 1: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure consent screen first if prompted

### Step 2: Create OAuth Client IDs

You need to create TWO client IDs:

**For iOS:**
1. Application type: **iOS**
2. Bundle ID: `com.room.app`
3. Save the **Client ID**

**For Web (required for Android and Supabase):**
1. Application type: **Web application**
2. Name: "Room Web Client"
3. Authorized redirect URIs: Add your Supabase callback URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
4. Save both **Client ID** and **Client Secret**

### Step 3: Configure Supabase for Google Auth

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Google**
3. Enter the **Web Client ID** and **Client Secret**

### Step 4: Install Dependencies

```bash
cd subletto-app
npx expo install @react-native-google-signin/google-signin
```

### Step 5: Update app.json

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.room.app",
      "config": {
        "googleSignIn": {
          "reservedClientId": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
        }
      }
    },
    "android": {
      "package": "com.room.app"
    },
    "plugins": [
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

### Step 6: Create Google Sign-In Hook

Create `src/hooks/useGoogleAuth.ts`:

```typescript
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';

// Web Client ID (same one used in Supabase)
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
// iOS Client ID (specific to iOS app)
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export function useGoogleAuth() {
  const { setUser, setSession } = useAuthStore();

  // Initialize Google Sign-In on mount
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        return { success: false, error: 'No ID token received from Google' };
      }

      // Sign in with Supabase using the Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('Supabase Google auth error:', error);
        return { success: false, error: error.message };
      }

      // Update profile with Google info
      if (data.user) {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            name: userInfo.user.name,
            avatar_url: userInfo.user.photo,
            updated_at: new Date().toISOString(),
          });
      }

      // Update auth store
      setUser(data.user);
      setSession(data.session);

      return { success: true };
    } catch (error: any) {
      // Handle specific Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: 'Sign-in cancelled' };
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        return { success: false, error: 'Sign-in already in progress' };
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { success: false, error: 'Google Play Services not available' };
      }

      console.error('Google Sign-In error:', error);
      return { success: false, error: error.message || 'Google Sign-In failed' };
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google sign out error:', error);
    }
  };

  return {
    signInWithGoogle,
    signOut,
  };
}
```

### Step 7: Create Google Sign-In Button Component

Create `src/components/GoogleSignInButton.tsx`:

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function GoogleSignInButton({ onPress, disabled, isLoading }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Google Logo */}
        <View style={styles.iconContainer}>
          <Image
            source={require('../assets/google-logo.png')}
            style={styles.icon}
          />
        </View>
        <Text style={styles.text}>
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Alternative using GoogleSigninButton from the library
// import { GoogleSigninButton } from '@react-native-google-signin/google-signin';

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    width: 20,
    height: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
```

### Step 8: Add Environment Variables

Add to your `.env`:

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
```

---

## AUTH-003: Auth Flow Updates for Social Login

### Step 1: Update Login Screen

Update `src/screens/Auth/LoginScreen.tsx`:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppleAuth } from '../../hooks/useAppleAuth';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { colors } from '../../theme/colors';

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);

  const { signInWithApple, isAvailable: appleAvailable } = useAppleAuth();
  const { signInWithGoogle } = useGoogleAuth();

  const handleEmailLogin = async () => {
    // ... existing email login logic ...
  };

  const handleAppleSignIn = async () => {
    setSocialLoading('apple');
    const result = await signInWithApple();
    setSocialLoading(null);

    if (!result.success && result.error !== 'Sign-in cancelled') {
      Alert.alert('Sign-In Failed', result.error);
    }
    // On success, auth state listener will handle navigation
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    const result = await signInWithGoogle();
    setSocialLoading(null);

    if (!result.success && result.error !== 'Sign-in cancelled') {
      Alert.alert('Sign-In Failed', result.error);
    }
    // On success, auth state listener will handle navigation
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Email/Password Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialButtons}>
          {/* Apple Sign-In (iOS only) */}
          {appleAvailable && (
            <View style={styles.socialButtonWrapper}>
              <AppleSignInButton
                onPress={handleAppleSignIn}
                disabled={socialLoading !== null}
              />
            </View>
          )}

          {/* Google Sign-In */}
          <View style={styles.socialButtonWrapper}>
            <GoogleSignInButton
              onPress={handleGoogleSignIn}
              disabled={socialLoading !== null}
              isLoading={socialLoading === 'google'}
            />
          </View>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.gray[500],
    fontSize: 14,
  },
  socialButtons: {
    marginBottom: 32,
  },
  socialButtonWrapper: {
    marginBottom: 12,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signUpText: {
    color: colors.gray[600],
    fontSize: 14,
  },
  signUpLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
```

### Step 2: Update Sign Up Screen

Update `src/screens/Auth/SignUpScreen.tsx` with similar social login buttons:

```typescript
// Add the same social login section as LoginScreen
// The hooks work the same way for sign-up (Supabase creates the user if new)

const handleAppleSignIn = async () => {
  setSocialLoading('apple');
  const result = await signInWithApple();
  setSocialLoading(null);

  if (!result.success && result.error !== 'Sign-in cancelled') {
    Alert.alert('Sign-Up Failed', result.error);
  }
  // User is automatically created in Supabase if new
};
```

### Step 3: Update Auth State Listener

Ensure your auth state listener in `App.tsx` handles all auth methods:

```typescript
import { useEffect } from 'react';
import { supabase } from './src/lib/supabaseClient';
import { useAuthStore } from './src/store/authStore';

function App() {
  const { setUser, setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        setSession(session);
        setUser(session?.user || null);

        // Ensure profile exists for any auth method
        if (session?.user && event === 'SIGNED_IN') {
          await ensureProfileExists(session.user);
        }

        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ... rest of app
}

async function ensureProfileExists(user: User) {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!existingProfile) {
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}
```

### Step 4: Handle Sign Out for Social Providers

Update your sign out function to also sign out from social providers:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export async function signOut() {
  try {
    // Sign out from Google if signed in
    const isGoogleSignedIn = await GoogleSignin.isSignedIn();
    if (isGoogleSignedIn) {
      await GoogleSignin.signOut();
    }

    // Sign out from Supabase (handles all providers)
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}
```

---

## Testing Checklist

### Apple Sign-In
- [ ] Button only appears on iOS
- [ ] Sign-in sheet opens correctly
- [ ] User can complete sign-in
- [ ] Session is created in Supabase
- [ ] Profile is created/updated with Apple info
- [ ] User can sign in again (name not shown on subsequent sign-ins)
- [ ] Cancellation is handled gracefully

### Google Sign-In
- [ ] Configuration is loaded on app start
- [ ] Sign-in works on iOS
- [ ] Sign-in works on Android
- [ ] Session is created in Supabase
- [ ] Profile includes Google name and photo
- [ ] Cancellation is handled gracefully
- [ ] Play Services error handled on Android

### Integration
- [ ] Both social buttons appear on Login screen
- [ ] Both social buttons appear on SignUp screen
- [ ] Auth state updates after social sign-in
- [ ] User is navigated to main app
- [ ] Sign out works for social users
- [ ] Profile screen shows correct info

---

## Troubleshooting

### Apple Sign-In Issues

**"Invalid client_id"**
- Ensure Bundle ID matches Apple Developer Portal
- Check usesAppleSignIn is true in app.json
- Rebuild the native app after changing config

**Name not received**
- Apple only provides name on FIRST sign-in
- Subsequent sign-ins don't include name
- Store name when first received

**Only works on device**
- Apple Sign-In requires real iOS device
- Does not work in Simulator

### Google Sign-In Issues

**"DEVELOPER_ERROR"**
- Most common error
- Check SHA-1 fingerprint is added to Google Cloud Console (Android)
- Verify Bundle ID matches (iOS)
- Ensure Web Client ID is correct

**Play Services not available**
- Only affects Android
- Prompt user to install/update Google Play Services

**Token expired**
- Tokens from Google are short-lived
- Supabase handles refresh automatically
- If issues persist, have user sign out and back in

### General Issues

**Profile not created**
- Check ensureProfileExists is called
- Verify profiles table RLS allows insert
- Check for database errors in logs

**Session not persisting**
- Verify Supabase client is configured correctly
- Check AsyncStorage is working (for session persistence)
- Ensure auth state listener is set up

---

## Resources

- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Supabase Auth with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Apple Sign In Guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)

---

*Document Version: 1.0*  
*Last Updated: February 2026*
