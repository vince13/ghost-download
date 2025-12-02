# Stripe Payment Integration Setup

## Overview
Payment integration is now implemented for Founders Club purchases. This guide will help you set it up.

## Prerequisites
1. Stripe account (sign up at https://stripe.com)
2. Firebase Admin SDK configured (for webhook handling)

## Setup Steps

### 1. Install Stripe Package

```bash
npm install stripe
```

### 2. Get Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret Key** (starts with `sk_`)
3. Copy your **Publishable Key** (starts with `pk_`) - you'll need this for client-side if you add it later

### 3. Configure Environment Variables

Add these to your Vercel environment variables (or `.env.local` for local dev):

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe Secret Key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret (see step 5)

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
# Or for Vercel, you can use:
# VERCEL_URL will be automatically set by Vercel
```

### 4. Set Up Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter your webhook URL:
   - Production: `https://your-domain.vercel.app/api/stripe-webhook`
   - Local testing: Use Stripe CLI (see below)
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`) and add it to `STRIPE_WEBHOOK_SECRET`

### 5. Test Webhook Locally (Optional)

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
# or
npm install -g stripe-cli
```

Login:
```bash
stripe login
```

Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:5173/api/stripe-webhook
```

This will give you a webhook signing secret for local testing.

### 6. Test the Integration

1. Start your app: `npm run dev`
2. Sign in with Google/Email
3. Go to Account → Click "Upgrade to Founders Club"
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify your plan is upgraded in Firebase

## Test Cards

Use these Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)

## Pricing Configuration

Current Founders Club price: **$299** (one-time payment)

To change the price, edit:
- `api/stripe-create-checkout.js` - line with `amount: 29900` (in cents)
- `src/components/PaymentModal.jsx` - line with `const price = 299`

## How It Works

1. **User clicks "Upgrade to Founders Club"**
   - Opens PaymentModal
   - Shows plan details and pricing

2. **User clicks "Continue to Checkout"**
   - Frontend calls `/api/stripe-create-checkout`
   - Server creates Stripe Checkout Session
   - User is redirected to Stripe Checkout

3. **User completes payment**
   - Stripe processes payment
   - User is redirected to `/payment-success`

4. **Webhook processes payment**
   - Stripe sends `checkout.session.completed` event
   - `/api/stripe-webhook` receives event
   - Updates user plan in Firestore to `founders`
   - Creates payment record

5. **User sees updated plan**
   - App refreshes user profile
   - Plan badge updates to "Founders Club"
   - All Founders Club features unlocked

## Troubleshooting

### "Stripe not configured" error
- Check that `STRIPE_SECRET_KEY` is set in environment variables
- Restart your dev server after adding env vars

### Webhook not receiving events
- Verify webhook URL is correct in Stripe dashboard
- Check that `STRIPE_WEBHOOK_SECRET` matches the signing secret
- Use Stripe CLI to test webhooks locally

### Payment succeeds but plan doesn't update
- Check Firebase Admin SDK is configured correctly
- Verify webhook is receiving events (check Stripe dashboard logs)
- Check server logs for webhook errors

### "Missing or insufficient permissions" in webhook
- Ensure Firebase Admin SDK has proper service account credentials
- Check Firestore security rules allow Admin SDK writes

## Next Steps

- Add payment history to Account modal
- Add invoice/receipt generation
- Add subscription support for Concierge tier
- Add promo code support (already enabled in checkout)

