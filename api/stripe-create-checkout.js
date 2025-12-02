/**
 * Create Stripe Checkout Session
 * POST /api/stripe-create-checkout
 */
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  // Log for debugging
  console.log('[stripe-create-checkout] Method:', req.method);
  console.log('[stripe-create-checkout] URL:', req.url);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method not allowed. Received: ${req.method}, Expected: POST` });
  }

  const { userId, userEmail, plan, billingInterval = 'monthly' } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  // Plan pricing configuration
  const planPrices = {
    starter: {
      key: 'starter',
      priceIdMonthly: process.env.STRIPE_STARTER_PRICE_ID_MONTHLY,
      priceIdYearly: process.env.STRIPE_STARTER_PRICE_ID_YEARLY,
      amount: 9900, // $99.00 in cents (fallback if priceId not set)
      name: 'Starter',
      description: 'For individual professionals'
    },
    founders: {
      key: 'founders',
      priceId: process.env.STRIPE_FOUNDER_PRICE_ID, // Use Price ID if available
      amount: 29900, // $299.00 in cents (fallback if priceId not set)
      name: 'Founders Club',
      description: 'Lifetime access for early believers'
    }
  };

  const selectedPlan = planPrices[plan];
  if (!selectedPlan) {
    return res.status(400).json({ error: 'Invalid plan selected' });
  }

  // Determine payment mode and Price ID based on plan
  const isSubscription = selectedPlan.key === 'starter';
  let priceId = null;
  let envVarName = null;
  
  if (isSubscription) {
    // Starter: use monthly or yearly Price ID
    if (billingInterval === 'yearly') {
      priceId = selectedPlan.priceIdYearly;
      envVarName = 'STRIPE_STARTER_PRICE_ID_YEARLY';
    } else {
      priceId = selectedPlan.priceIdMonthly;
      envVarName = 'STRIPE_STARTER_PRICE_ID_MONTHLY';
    }
  } else {
    // Founders: use Price ID if available
    priceId = selectedPlan.priceId;
    envVarName = 'STRIPE_FOUNDER_PRICE_ID';
  }
  
  // Log Price IDs for debugging
  console.log('[stripe-create-checkout] Plan:', plan);
  console.log('[stripe-create-checkout] Billing interval:', billingInterval);
  console.log('[stripe-create-checkout] Environment variable:', envVarName);
  console.log('[stripe-create-checkout] Price ID from env:', priceId);
  console.log('[stripe-create-checkout] API key mode:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN');
  
  try {
    // For subscriptions, Price ID is required
    if (isSubscription && !priceId) {
      return res.status(400).json({ 
        error: `Missing Price ID for Starter plan (${billingInterval}). Please set ${envVarName} in Vercel environment variables.`
      });
    }
    
    // Validate Price ID exists if we're trying to use it
    if (priceId) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        console.log('[stripe-create-checkout] ✅ Price ID validated:', price.id, 'Product:', price.product);
      } catch (err) {
        console.error('[stripe-create-checkout] ❌ Price ID validation failed:', err.message);
        console.error('[stripe-create-checkout] Price ID attempted:', priceId);
        console.error('[stripe-create-checkout] Environment variable:', envVarName);
        
        // Check if it's a "No such price" error
        if (err.message?.includes('No such price')) {
          return res.status(400).json({ 
            error: `Price ID "${priceId}" does not exist in your Stripe account.`,
            details: `This usually means: (1) The Price ID is from a different Stripe account, (2) You're using Test mode Price ID with Live API key (or vice versa), or (3) The Price ID was deleted. Please check ${envVarName} in Vercel and ensure it matches a Price ID in your Stripe Dashboard (${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE'} mode).`,
            envVar: envVarName,
            priceId: priceId,
            stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE'
          });
        }
        
        return res.status(400).json({ 
          error: `Invalid Price ID: ${priceId}`,
          details: err.message,
          envVar: envVarName
        });
      }
    }
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: isSubscription ? 'subscription' : 'payment', // Subscription for Starter, one-time for Founders
      customer_email: userEmail,
      line_items: priceId
        ? [
            // Use Stripe Price ID (preferred - uses Product description from Stripe)
            {
              price: priceId,
              quantity: 1,
            },
          ]
        : [
            // Fallback: Use price_data for one-time payments if Price ID not set
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: selectedPlan.name,
                  description: selectedPlan.description,
                },
                unit_amount: selectedPlan.amount,
              },
              quantity: 1,
            },
          ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173')}/app/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173')}/app/payment-cancel`,
      metadata: {
        userId,
        plan,
        billingInterval: isSubscription ? billingInterval : undefined, // Only for subscriptions
      },
      // Allow promotion codes
      allow_promotion_codes: true,
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[stripe-create-checkout] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create checkout session',
    });
  }
}
