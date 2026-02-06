# Phase 2: Payments Implementation Guide

This guide covers the complete implementation of Stripe payments for the Room app, including checkout payments and host payouts.

---

## Overview

| Task ID | Task Name | Estimated Hours | Dependencies |
|---------|-----------|-----------------|--------------|
| PAY-001 | Stripe account & API keys setup | 4 | None |
| PAY-002 | Payment intent Edge Function | 8 | PAY-001 |
| PAY-003 | Stripe SDK integration | 6 | PAY-001 |
| PAY-004 | Payment UI in checkout flow | 8 | PAY-002, PAY-003 |
| PAY-005 | Webhook handler for payment events | 6 | PAY-002 |
| PAY-006 | Host payout system (Stripe Connect) | 12 | PAY-001, PAY-002 |

**Total Estimated Hours:** 44

---

## Prerequisites

- Supabase project with Edge Functions enabled
- Expo SDK 54+ project
- Apple Developer account (for Apple Pay on iOS)
- Business information for Stripe account

---

## PAY-001: Stripe Account & API Keys Setup

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete email verification
3. For testing, you can skip business verification initially

### Step 2: Get API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your keys:
   - **Publishable key** (pk_test_...): Safe to expose in frontend
   - **Secret key** (sk_test_...): Server-side only, never expose

### Step 3: Configure Environment Variables

**Local Development (.env in subletto-app/):**

```bash
# Stripe keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

**Supabase Secrets (for Edge Functions):**

```bash
# Store secret key securely
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### Step 4: Enable Test Mode Features

In Stripe Dashboard:
1. Ensure **Test mode** toggle is ON (top right)
2. Go to **Settings** → **Payment methods**
3. Enable: Cards, Apple Pay, Google Pay

### Step 5: Test Card Numbers

Save these for testing:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0025 0000 3155 | Requires 3D Secure |
| 4000 0000 0000 9995 | Insufficient funds |

---

## PAY-002: Payment Intent Edge Function

### Step 1: Create the Edge Function

Create `supabase/functions/create-payment-intent/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

interface PaymentRequest {
  amount: number; // in cents
  currency?: string;
  userId: string;
  bookingId: string;
  listingTitle: string;
  metadata?: Record<string, string>;
}

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: PaymentRequest = await req.json();

    // Validate required fields
    if (!payload.amount || !payload.userId || !payload.bookingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, userId, bookingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount (minimum $0.50 USD)
    if (payload.amount < 50) {
      return new Response(
        JSON.stringify({ error: 'Amount must be at least 50 cents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency || 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: payload.userId,
        bookingId: payload.bookingId,
        listingTitle: payload.listingTitle || '',
        ...payload.metadata,
      },
    });

    console.log('Created PaymentIntent:', paymentIntent.id);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to create payment intent' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Step 2: Deploy the Edge Function

```bash
supabase functions deploy create-payment-intent
```

### Step 3: Test the Edge Function

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-payment-intent' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "amount": 50000,
    "userId": "test-user-id",
    "bookingId": "test-booking-id",
    "listingTitle": "Cozy Room in Brooklyn"
  }'
```

Expected response:
```json
{
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  "paymentIntentId": "pi_xxxxx",
  "amount": 50000,
  "currency": "usd"
}
```

---

## PAY-003: Stripe SDK Integration

### Step 1: Install Stripe React Native SDK

```bash
cd subletto-app
npx expo install @stripe/stripe-react-native
```

### Step 2: Configure app.json

Add Stripe plugin configuration:

```json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.room.app",
          "enableGooglePay": true
        }
      ]
    ]
  }
}
```

### Step 3: Create Stripe Provider Wrapper

Update `App.tsx`:

```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function App() {
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.error('Missing Stripe publishable key');
    return null;
  }

  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.room.app"
      urlScheme="room" // For 3D Secure redirects
    >
      <NavigationContainer>
        {/* ... rest of app ... */}
      </NavigationContainer>
    </StripeProvider>
  );
}
```

### Step 4: Create Payment Service

Create `src/lib/paymentService.ts`:

```typescript
import { Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from './supabaseClient';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

interface CreatePaymentParams {
  amount: number; // in dollars
  userId: string;
  bookingId: string;
  listingTitle: string;
}

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

/**
 * Creates a payment intent on the server
 */
export async function createPaymentIntent(params: CreatePaymentParams): Promise<{
  clientSecret: string;
  paymentIntentId: string;
} | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/create-payment-intent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: Math.round(params.amount * 100), // Convert to cents
          userId: params.userId,
          bookingId: params.bookingId,
          listingTitle: params.listingTitle,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return null;
  }
}

/**
 * Hook for handling payments
 */
export function usePayment() {
  const { confirmPayment, presentPaymentSheet, initPaymentSheet } = useStripe();

  const processPayment = async (params: CreatePaymentParams): Promise<PaymentResult> => {
    try {
      // Step 1: Create payment intent on server
      const paymentData = await createPaymentIntent(params);
      
      if (!paymentData) {
        return { success: false, error: 'Failed to create payment' };
      }

      // Step 2: Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentData.clientSecret,
        merchantDisplayName: 'Room',
        style: 'automatic', // Matches device theme
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: true, // Set to false for production
        },
        applePay: {
          merchantCountryCode: 'US',
        },
        defaultBillingDetails: {
          // Pre-fill user's billing info if available
        },
      });

      if (initError) {
        console.error('Payment sheet init error:', initError);
        return { success: false, error: initError.message };
      }

      // Step 3: Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          return { success: false, error: 'Payment cancelled' };
        }
        return { success: false, error: presentError.message };
      }

      // Payment successful
      return { 
        success: true, 
        paymentIntentId: paymentData.paymentIntentId 
      };
    } catch (error) {
      console.error('Payment error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment failed' 
      };
    }
  };

  return { processPayment };
}
```

---

## PAY-004: Payment UI in Checkout Flow

### Step 1: Update Checkout Screen

Add payment step to `src/screens/CheckoutScreen.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { usePayment } from '../lib/paymentService';
import { colors } from '../theme/colors';

// Add to existing checkout steps
const CHECKOUT_STEPS = [
  'Details',
  'Verification', 
  'Agreement',
  'Payment',  // New step
  'Confirm',
];

export function CheckoutScreen({ route, navigation }) {
  const { listing, session } = route.params;
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const { processPayment } = usePayment();

  // ... existing checkout logic ...

  const handlePayment = async () => {
    setIsProcessingPayment(true);

    const result = await processPayment({
      amount: listing.price_monthly, // First month's rent
      userId: session.user_id,
      bookingId: session.id, // Using checkout session ID temporarily
      listingTitle: listing.title,
    });

    setIsProcessingPayment(false);

    if (result.success) {
      setPaymentComplete(true);
      setCurrentStep(currentStep + 1); // Move to confirmation
    } else if (result.error !== 'Payment cancelled') {
      Alert.alert('Payment Failed', result.error || 'Please try again');
    }
  };

  const renderPaymentStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Payment</Text>
      
      <View style={styles.priceBreakdown}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>First month's rent</Text>
          <Text style={styles.priceValue}>${listing.price_monthly}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Security deposit</Text>
          <Text style={styles.priceValue}>${listing.deposit || 0}</Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total due today</Text>
          <Text style={styles.totalValue}>
            ${listing.price_monthly + (listing.deposit || 0)}
          </Text>
        </View>
      </View>

      <Text style={styles.secureText}>
        🔒 Payments are processed securely by Stripe
      </Text>

      <TouchableOpacity
        style={[styles.payButton, isProcessingPayment && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={isProcessingPayment}
      >
        <Text style={styles.payButtonText}>
          {isProcessingPayment ? 'Processing...' : 'Pay Now'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By proceeding, you authorize this charge and agree to the booking terms.
      </Text>
    </View>
  );

  // Add to step rendering switch
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderDetailsStep();
      case 1: return renderVerificationStep();
      case 2: return renderAgreementStep();
      case 3: return renderPaymentStep();
      case 4: return renderConfirmStep();
      default: return null;
    }
  };

  // ... rest of component ...
}

const styles = StyleSheet.create({
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  priceBreakdown: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: colors.gray[600],
  },
  priceValue: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  secureText: {
    textAlign: 'center',
    color: colors.gray[500],
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    textAlign: 'center',
    color: colors.gray[500],
    fontSize: 12,
  },
});
```

---

## PAY-005: Webhook Handler for Payment Events

### Step 1: Create Webhook Edge Function

Create `supabase/functions/stripe-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { bookingId, userId } = paymentIntent.metadata;

  if (!bookingId) {
    console.error('No bookingId in payment intent metadata');
    return;
  }

  // Update booking with payment info
  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'PAID',
      payment_intent_id: paymentIntent.id,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error updating booking:', error);
    throw error;
  }

  console.log(`Payment successful for booking ${bookingId}`);

  // TODO: Send confirmation email/notification
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const { bookingId } = paymentIntent.metadata;

  if (!bookingId) return;

  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'FAILED',
      payment_error: paymentIntent.last_payment_error?.message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error updating booking:', error);
  }

  console.log(`Payment failed for booking ${bookingId}`);
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'REFUNDED',
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('payment_intent_id', paymentIntentId);

  if (error) {
    console.error('Error updating booking for refund:', error);
  }

  console.log(`Refund processed for payment ${paymentIntentId}`);
}
```

### Step 2: Add Payment Fields to Bookings Table

Run this migration:

```sql
-- Add payment tracking fields to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING' 
  CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_error TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Index for payment lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent 
ON bookings(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
```

### Step 3: Deploy and Configure Webhook

```bash
# Deploy the webhook function
supabase functions deploy stripe-webhook

# Get your webhook endpoint URL
echo "https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook"
```

In Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your Edge Function URL
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
5. Copy the **Signing secret**

```bash
# Save webhook signing secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret
```

### Step 4: Test with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local function
stripe listen --forward-to https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook

# Trigger test event
stripe trigger payment_intent.succeeded
```

---

## PAY-006: Host Payout System (Stripe Connect)

### Step 1: Enable Stripe Connect

1. In Stripe Dashboard, go to **Connect** → **Get started**
2. Choose **Express** accounts (easiest for hosts)
3. Configure platform settings

### Step 2: Create Connect Account Edge Function

Create `supabase/functions/create-connect-account/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, email, returnUrl } = await req.json();

    // Check if user already has a Connect account
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    let accountId = profile?.stripe_account_id;

    // Create account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          userId,
        },
      });

      accountId = account.id;

      // Save to profile
      await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', userId);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: `${returnUrl}?success=true`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        accountId,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create account' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Step 3: Add Stripe Account to Profiles

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
```

### Step 4: Create Transfer Function

Create `supabase/functions/create-transfer/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Platform fee percentage (e.g., 10%)
const PLATFORM_FEE_PERCENT = 10;

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        host:profiles!bookings_host_id_fkey(stripe_account_id)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    if (booking.payment_status !== 'PAID') {
      throw new Error('Booking is not paid');
    }

    const hostStripeAccount = booking.host?.stripe_account_id;
    if (!hostStripeAccount) {
      throw new Error('Host has not set up payouts');
    }

    // Calculate amounts
    const totalAmount = Math.round(booking.monthly_rent * 100); // in cents
    const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT / 100);
    const hostAmount = totalAmount - platformFee;

    // Create transfer to host
    const transfer = await stripe.transfers.create({
      amount: hostAmount,
      currency: 'usd',
      destination: hostStripeAccount,
      metadata: {
        bookingId,
        hostId: booking.host_id,
      },
    });

    // Record payout in database
    await supabase
      .from('bookings')
      .update({
        payout_status: 'COMPLETED',
        payout_amount: hostAmount / 100,
        platform_fee: platformFee / 100,
        transfer_id: transfer.id,
        payout_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    return new Response(
      JSON.stringify({ 
        success: true,
        transferId: transfer.id,
        hostAmount: hostAmount / 100,
        platformFee: platformFee / 100,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error creating transfer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Step 5: Add Payout Fields to Bookings

```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'PENDING'
  CHECK (payout_status IN ('PENDING', 'COMPLETED', 'FAILED')),
ADD COLUMN IF NOT EXISTS payout_amount NUMERIC,
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC,
ADD COLUMN IF NOT EXISTS transfer_id TEXT,
ADD COLUMN IF NOT EXISTS payout_at TIMESTAMPTZ;
```

### Step 6: Create Host Onboarding UI

Create `src/screens/PayoutSetupScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function PayoutSetupScreen({ navigation }) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupPayouts = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/create-connect-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            returnUrl: 'room://payout-setup', // Deep link
          }),
        }
      );

      const data = await response.json();

      if (data.url) {
        // Open Stripe onboarding in browser
        await Linking.openURL(data.url);
      } else {
        throw new Error(data.error || 'Failed to create account');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set up payouts. Please try again.');
      console.error('Payout setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Up Payouts</Text>
      
      <Text style={styles.description}>
        To receive payments from renters, you need to connect your bank account 
        through Stripe. This is a one-time setup.
      </Text>

      <View style={styles.benefits}>
        <Text style={styles.benefitItem}>✓ Secure bank transfers</Text>
        <Text style={styles.benefitItem}>✓ Automatic monthly payouts</Text>
        <Text style={styles.benefitItem}>✓ 90% of rent goes to you</Text>
        <Text style={styles.benefitItem}>✓ Track earnings in app</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSetupPayouts}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : 'Connect Bank Account'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.secureText}>
        🔒 Powered by Stripe. Your banking details are never stored on our servers.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.gray[600],
    lineHeight: 24,
    marginBottom: 32,
  },
  benefits: {
    marginBottom: 40,
  },
  benefitItem: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secureText: {
    textAlign: 'center',
    color: colors.gray[500],
    fontSize: 14,
  },
});
```

---

## Testing Checklist

- [ ] Stripe test keys configured in environment
- [ ] Payment intent Edge Function returns clientSecret
- [ ] StripeProvider wraps app correctly
- [ ] Payment sheet opens with card input
- [ ] Test card 4242... completes successfully
- [ ] Decline card 4000...0002 shows error
- [ ] Webhook receives payment_intent.succeeded
- [ ] Booking payment_status updates to PAID
- [ ] Host can complete Stripe Connect onboarding
- [ ] Transfers work to connected accounts

---

## Troubleshooting

### Payment sheet doesn't open
1. Check StripeProvider has valid publishable key
2. Verify merchant identifier in app.json
3. Check initPaymentSheet is called before presentPaymentSheet

### Webhook not receiving events
1. Verify webhook URL in Stripe Dashboard
2. Check webhook signing secret is correct
3. Look at Stripe Dashboard webhook logs

### Connect account issues
1. Ensure account type is 'express' for simplest setup
2. Check account has required capabilities
3. Verify onboarding completed (check account status)

### "No such payment_intent"
1. Ensure test keys match between frontend and backend
2. Don't mix test and live keys

---

## Resources

- [Stripe React Native SDK](https://github.com/stripe/stripe-react-native)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Connect](https://stripe.com/docs/connect)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Expo + Stripe Setup](https://docs.expo.dev/guides/using-stripe/)

---

*Document Version: 1.0*  
*Last Updated: February 2026*
