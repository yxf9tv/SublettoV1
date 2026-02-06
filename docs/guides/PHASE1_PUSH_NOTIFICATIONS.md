# Phase 1: Push Notifications Implementation Guide

This guide covers the complete implementation of push notifications for the Room app using Expo and Supabase.

---

## Overview

| Task ID | Task Name | Estimated Hours | Dependencies |
|---------|-----------|-----------------|--------------|
| PUSH-001 | Set up Expo Push Notifications | 8 | None |
| PUSH-002 | Create Edge Function for push delivery | 6 | PUSH-001 |
| PUSH-003 | Message notification triggers | 4 | PUSH-002 |
| PUSH-004 | Booking notification triggers | 4 | PUSH-002 |
| PUSH-005 | In-app notification handling | 4 | PUSH-001 |

**Total Estimated Hours:** 26

---

## Prerequisites

- Expo SDK 54+ project set up
- Physical iOS/Android device (simulators don't support push)
- Supabase project with Edge Functions enabled
- Apple Developer account (for iOS production push)

---

## PUSH-001: Set up Expo Push Notifications

### Step 1: Install Required Packages

```bash
cd subletto-app
npx expo install expo-notifications expo-device expo-constants
```

### Step 2: Update app.json

Add the notifications plugin configuration:

```json
{
  "expo": {
    "name": "Room",
    "slug": "room",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#111827",
          "sounds": [],
          "mode": "production"
        }
      ]
    ],
    "android": {
      "useNextNotificationsApi": true
    }
  }
}
```

### Step 3: Create Notification Service

Create `src/lib/notificationService.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabaseClient';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers the device for push notifications and returns the Expo Push Token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  // Get the Expo Push Token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    console.log('Expo Push Token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Saves the push token to the user's profile in Supabase
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);

  if (error) {
    console.error('Error saving push token:', error);
    throw error;
  }
}

/**
 * Configures Android notification channel (required for Android 8+)
 */
export async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#111827',
    });

    // Create channel for messages
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      description: 'Notifications for new messages',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    // Create channel for bookings
    await Notifications.setNotificationChannelAsync('bookings', {
      name: 'Bookings',
      description: 'Notifications for booking updates',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}

/**
 * Clears the push token from the user's profile (call on logout)
 */
export async function clearPushToken(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: null })
    .eq('id', userId);

  if (error) {
    console.error('Error clearing push token:', error);
  }
}
```

### Step 4: Add push_token Column to profiles Table

Run this migration in Supabase:

```sql
-- Add push_token column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token) WHERE push_token IS NOT NULL;
```

### Step 5: Initialize in App.tsx

Update your `App.tsx` to register for push notifications on startup:

```typescript
import { useEffect } from 'react';
import { 
  registerForPushNotifications, 
  savePushToken,
  configureAndroidChannel 
} from './src/lib/notificationService';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const { user } = useAuthStore();

  useEffect(() => {
    // Configure Android channels on startup
    configureAndroidChannel();
  }, []);

  useEffect(() => {
    // Register for push when user is authenticated
    async function setupPushNotifications() {
      if (user) {
        const token = await registerForPushNotifications();
        if (token) {
          await savePushToken(user.id, token);
        }
      }
    }

    setupPushNotifications();
  }, [user]);

  // ... rest of App.tsx
}
```

### Testing

1. Run on physical device: `npx expo run:ios` or `npx expo run:android`
2. Check console for "Expo Push Token: ExponentPushToken[...]"
3. Verify token saved in profiles table
4. Test with Expo Push Tool: https://expo.dev/notifications

---

## PUSH-002: Create Edge Function for Push Delivery

### Step 1: Create the Edge Function

Create file `supabase/functions/send-push-notification/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
  badge?: number;
  sound?: string;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const payload: PushPayload = await req.json();

    // Validate required fields
    if (!payload.pushToken || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: pushToken, title, body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate Expo push token format
    if (!payload.pushToken.startsWith('ExponentPushToken[')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Expo push token format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build Expo push message
    const message: ExpoPushMessage = {
      to: payload.pushToken,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      sound: payload.sound || 'default',
      badge: payload.badge,
      channelId: payload.channelId || 'default',
      priority: 'high',
      ttl: 86400, // 24 hours
    };

    // Send to Expo Push API
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    // Check for errors in Expo response
    if (result.data?.[0]?.status === 'error') {
      console.error('Expo push error:', result.data[0]);
      return new Response(
        JSON.stringify({ 
          error: 'Push delivery failed', 
          details: result.data[0].message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, ticketId: result.data?.[0]?.id }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Step 2: Deploy the Edge Function

```bash
# Login to Supabase CLI if not already
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy send-push-notification
```

### Step 3: Test the Edge Function

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "pushToken": "ExponentPushToken[xxxxxx]",
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

---

## PUSH-003: Message Notification Triggers

### Step 1: Enable pg_net Extension

Run in Supabase SQL editor:

```sql
-- Enable pg_net for HTTP requests from Postgres
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

### Step 2: Create the Notification Function

```sql
-- Function to send push notification for new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipient_id UUID;
  v_recipient_token TEXT;
  v_sender_name TEXT;
  v_chat_listing_id UUID;
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Get the recipient (other participant in the chat)
  SELECT cp.user_id INTO v_recipient_id
  FROM chat_participants cp
  WHERE cp.chat_id = NEW.chat_id
    AND cp.user_id != NEW.sender_id
  LIMIT 1;

  -- Get recipient's push token
  SELECT push_token INTO v_recipient_token
  FROM profiles
  WHERE id = v_recipient_id;

  -- Skip if no push token
  IF v_recipient_token IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender's name
  SELECT COALESCE(name, email, 'Someone') INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Get listing ID from chat
  SELECT listing_id INTO v_chat_listing_id
  FROM chats
  WHERE id = NEW.chat_id;

  -- Get Supabase URL and key from vault or environment
  -- Note: In production, use Supabase Vault for secrets
  v_supabase_url := current_setting('app.supabase_url', true);
  v_service_role_key := current_setting('app.service_role_key', true);

  -- Send push notification via Edge Function
  PERFORM extensions.http_post(
    url := v_supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := jsonb_build_object(
      'pushToken', v_recipient_token,
      'title', v_sender_name,
      'body', LEFT(NEW.content, 100),
      'data', jsonb_build_object(
        'type', 'NEW_MESSAGE',
        'chatId', NEW.chat_id,
        'listingId', v_chat_listing_id
      ),
      'channelId', 'messages'
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS on_new_message_notify ON messages;
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();
```

### Step 3: Configure Database Settings

You need to set the Supabase URL and service role key for the trigger to use:

```sql
-- Set these in your Supabase project settings or via migration
-- WARNING: Be careful with service role key - it bypasses RLS
ALTER DATABASE postgres SET app.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

**Security Note:** For production, consider using Supabase Vault or calling the Edge Function from your app instead of database triggers with service role key.

---

## PUSH-004: Booking Notification Triggers

### Step 1: Create Booking Notification Function

```sql
-- Function to send push notification for booking updates
CREATE OR REPLACE FUNCTION notify_booking_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipient_id UUID;
  v_recipient_token TEXT;
  v_notification_title TEXT;
  v_notification_body TEXT;
  v_listing_title TEXT;
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Get listing title
  SELECT title INTO v_listing_title
  FROM listings
  WHERE id = NEW.listing_id;

  -- Determine notification based on status change
  IF TG_OP = 'INSERT' THEN
    -- New booking request - notify host
    v_recipient_id := NEW.host_id;
    v_notification_title := 'New Booking Request';
    v_notification_body := 'You have a new booking request for ' || v_listing_title;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Status changed
    IF NEW.status = 'CONFIRMED' THEN
      -- Booking confirmed - notify renter
      v_recipient_id := NEW.renter_id;
      v_notification_title := 'Booking Confirmed!';
      v_notification_body := 'Your booking for ' || v_listing_title || ' has been confirmed';
    ELSIF NEW.status = 'CANCELLED' THEN
      -- Determine who cancelled and notify the other party
      -- For simplicity, notify renter (host usually cancels)
      v_recipient_id := NEW.renter_id;
      v_notification_title := 'Booking Cancelled';
      v_notification_body := 'The booking for ' || v_listing_title || ' has been cancelled';
    ELSE
      -- Other status changes - skip notification
      RETURN NEW;
    END IF;
  ELSE
    -- No notification needed
    RETURN NEW;
  END IF;

  -- Get recipient's push token
  SELECT push_token INTO v_recipient_token
  FROM profiles
  WHERE id = v_recipient_id;

  -- Skip if no push token
  IF v_recipient_token IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get Supabase settings
  v_supabase_url := current_setting('app.supabase_url', true);
  v_service_role_key := current_setting('app.service_role_key', true);

  -- Send push notification
  PERFORM extensions.http_post(
    url := v_supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := jsonb_build_object(
      'pushToken', v_recipient_token,
      'title', v_notification_title,
      'body', v_notification_body,
      'data', jsonb_build_object(
        'type', 'BOOKING_UPDATE',
        'bookingId', NEW.id,
        'listingId', NEW.listing_id,
        'status', NEW.status
      ),
      'channelId', 'bookings'
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS on_booking_update_notify ON bookings;
CREATE TRIGGER on_booking_update_notify
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_update();
```

---

## PUSH-005: In-App Notification Handling

### Step 1: Create Notification Handler Hook

Create `src/hooks/useNotifications.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface NotificationData {
  type: 'NEW_MESSAGE' | 'BOOKING_UPDATE';
  chatId?: string;
  listingId?: string;
  bookingId?: string;
  status?: string;
}

export function useNotifications() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    // Handle notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
        setLastNotification(notification);
        
        // You could show a toast or in-app banner here
        // Example: showToast(notification.request.content.title)
      }
    );

    // Handle notification taps (when user taps the notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data as NotificationData;
        
        handleNotificationNavigation(data);
      }
    );

    // Cleanup
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const handleNotificationNavigation = (data: NotificationData) => {
    switch (data.type) {
      case 'NEW_MESSAGE':
        if (data.chatId) {
          navigation.navigate('Chat', { chatId: data.chatId });
        } else {
          navigation.navigate('Messages');
        }
        break;

      case 'BOOKING_UPDATE':
        if (data.bookingId) {
          navigation.navigate('BookingDetail', { bookingId: data.bookingId });
        } else {
          navigation.navigate('Profile');
        }
        break;

      default:
        console.log('Unknown notification type:', data.type);
    }
  };

  // Clear badge count when app becomes active
  useEffect(() => {
    Notifications.setBadgeCountAsync(0);
  }, []);

  return { lastNotification };
}
```

### Step 2: Add Hook to Main App

In your main tab navigator or App.tsx:

```typescript
import { useNotifications } from './src/hooks/useNotifications';

function MainTabNavigator() {
  // This enables notification handling throughout the app
  useNotifications();

  return (
    <Tab.Navigator>
      {/* ... tabs ... */}
    </Tab.Navigator>
  );
}
```

### Step 3: Create Toast Component (Optional)

Create `src/components/NotificationToast.tsx`:

```typescript
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  title: string;
  body: string;
  visible: boolean;
  onPress: () => void;
  onDismiss: () => void;
}

export function NotificationToast({ title, body, visible, onPress, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        dismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.9}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.body} numberOfLines={2}>{body}</Text>
        </View>
        <TouchableOpacity onPress={dismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  content: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: colors.gray[600],
  },
  dismissButton: {
    marginLeft: 12,
    padding: 4,
  },
  dismissText: {
    fontSize: 24,
    color: colors.gray[400],
    fontWeight: '300',
  },
});
```

---

## Testing Checklist

- [ ] Push token is generated on physical device
- [ ] Push token is saved to profiles table
- [ ] Edge Function deploys successfully
- [ ] Edge Function responds to test curl request
- [ ] New message triggers push notification to recipient
- [ ] New booking request triggers push to host
- [ ] Booking confirmation triggers push to renter
- [ ] Tapping notification navigates to correct screen
- [ ] Foreground notifications show toast/banner
- [ ] Android notification channels are configured
- [ ] Badge count updates and clears

---

## Troubleshooting

### "Not a device" error
Push notifications only work on physical devices. Use `expo run:ios` or `expo run:android` to build and run on a real device.

### No push token received
1. Check that permissions are granted in device settings
2. Verify expo-notifications is properly configured in app.json
3. Check that projectId is set in eas.json

### Notifications not received
1. Verify push token format: `ExponentPushToken[...]`
2. Check Edge Function logs in Supabase dashboard
3. Verify the token hasn't expired (they can be invalidated)
4. Test directly with Expo Push Tool

### Database trigger not firing
1. Check pg_net extension is enabled
2. Verify database settings for supabase_url and service_role_key
3. Check Postgres logs for function errors

---

## Resources

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_net Extension](https://supabase.com/docs/guides/database/extensions/pg_net)

---

*Document Version: 1.0*  
*Last Updated: February 2026*
