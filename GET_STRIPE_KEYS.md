# Quick Guide: Get Your Stripe API Keys

## Step 1: Create Stripe Account (2 minutes)

1. Go to **https://stripe.com**
2. Click **"Start now"** or **"Sign in"**
3. Enter your email and create a password
4. Verify your email (check inbox)
5. **You don't need a bank account yet!** You can add it later when you're ready to receive payments.

## Step 2: Get Your API Keys (1 minute)

### For Testing (Test Mode - Recommended First)

1. Make sure you're in **Test mode** (toggle in top right of Stripe dashboard)
2. Go to **https://dashboard.stripe.com/test/apikeys**
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - Not needed for Ghost, but good to have
   - **Secret key** (starts with `sk_test_...`) - **This is what you need!**
4. Click **"Reveal test key"** next to the Secret key
5. Copy the entire key (it's long, starts with `sk_test_`)

### For Production (Live Mode - When Ready)

1. Toggle to **Live mode** (top right of Stripe dashboard)
2. Go to **https://dashboard.stripe.com/apikeys**
3. Click **"Reveal live key"** next to the Secret key
4. Copy the entire key (starts with `sk_live_`)

## Step 3: Set Up Webhook (3 minutes)

### For Production (Vercel)

1. Stay in **Live mode** in Stripe dashboard
2. Go to **https://dashboard.stripe.com/webhooks**
3. Click **"Add endpoint"** or **"Create event destination"**

**Step 1: Select Events** (You're here!)
- Make sure **"Your account"** is selected (purple border)
- Click the **"Selected events"** tab (top right)
- In the search bar, type: `checkout.session.completed`
- Check the box next to `checkout.session.completed`
- (Optional: Also select `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` if you plan to add subscriptions later)
- Click **"Continue →"** (bottom right)

**Step 2: Choose Destination Type**
- Select **"Webhook endpoint"**
- Click **"Continue →"**

**Step 3: Configure Your Destination**
- Enter your webhook URL:
  ```
  https://ghost-green.vercel.app/api/stripe-webhook
  ```
- Click **"Create destination"** or **"Add endpoint"**

4. After creation, click on the newly created webhook endpoint
5. Copy the **"Signing secret"** (starts with `whsec_...`) - you'll see it in the endpoint details

### For Testing (Local Development)

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```
   Or download from: https://stripe.com/docs/stripe-cli

2. Login:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5173/api/stripe-webhook
   ```

4. Copy the webhook signing secret it gives you (starts with `whsec_...`)

## Step 4: Add Keys to Vercel (2 minutes)

1. Go to your Vercel project: **https://vercel.com/your-project/settings/environment-variables**
2. Add these environment variables:

   **For Production:**
   ```
   STRIPE_SECRET_KEY = sk_live_... (your live secret key)
   STRIPE_WEBHOOK_SECRET = whsec_... (your production webhook secret)
   ```

   **For Preview/Development (optional):**
   ```
   STRIPE_SECRET_KEY = sk_test_... (your test secret key)
   STRIPE_WEBHOOK_SECRET = whsec_... (your test webhook secret from Stripe CLI)
   ```

3. Make sure to select the correct **Environment** (Production, Preview, Development)
4. Click **"Save"**

## Step 5: Redeploy (1 minute)

1. Go to your Vercel project dashboard
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger a deployment

## Step 6: Test It! (2 minutes)

1. Go to your app: `https://ghost-green.vercel.app/app`
2. Sign in with Google/Email
3. Click **"Account"** → **"Upgrade to Founders Club"**
4. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
5. Complete checkout
6. Verify your plan updates to "Founders Club"

## What You Need (Summary)

✅ **Stripe Account** - Created (no bank account needed yet)
✅ **STRIPE_SECRET_KEY** - From Stripe dashboard (test or live)
✅ **STRIPE_WEBHOOK_SECRET** - From Stripe webhook endpoint
✅ **Keys added to Vercel** - Environment variables configured
✅ **App redeployed** - So new env vars are active

## When to Add Bank Account

- **Now:** You can test everything with test mode
- **Before launch:** Add bank account + complete identity verification
- **To receive money:** Bank account is required for payouts

## Troubleshooting

**"Stripe not configured" error:**
- Check keys are in Vercel environment variables
- Make sure you redeployed after adding keys
- Verify key starts with `sk_test_` or `sk_live_`

**Webhook not working:**
- Verify webhook URL is correct: `https://ghost-green.vercel.app/api/stripe-webhook`
- Check webhook secret matches in Vercel
- Look at Stripe dashboard → Webhooks → Click endpoint → See event logs

**Payment succeeds but plan doesn't update:**
- Check Vercel function logs for webhook errors
- Verify Firebase Admin SDK is configured
- Check Stripe webhook event logs in dashboard

---

**Total time: ~10 minutes** ⚡

Once you have these keys, Ghost's payment system is fully functional!

