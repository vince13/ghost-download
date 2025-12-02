/**
 * Create Stripe Checkout Session
 * POST /api/stripe-create-checkout
 */
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, userEmail, plan } = req.body;

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
      priceId: process.env.STRIPE_STARTER_PRICE_ID, // Stripe Price ID for Starter (monthly subscription)
      amount: 9900, // $99.00 in cents (fallback if priceId not set)
      name: 'Starter',
      description: 'For individual professionals'
    },
    founders: {
      key: 'founders',
      priceId: process.env.STRIPE_FOUNDERS_PRICE_ID, // Stripe Price ID for Founders Club (optional)
      amount: 29900, // $299.00 in cents
      name: 'Founders Club',
      description: 'Lifetime access for early believers'
    }
  };

  const selectedPlan = planPrices[plan];
  if (!selectedPlan) {
    return res.status(400).json({ error: 'Invalid plan selected' });
  }

  // Determine payment mode based on plan
  const isSubscription = selectedPlan.key === 'starter';
  
  try {
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: isSubscription ? 'subscription' : 'payment', // Subscription for Starter, one-time for Founders
      customer_email: userEmail,
      line_items: isSubscription && selectedPlan.priceId
        ? [
            // Use Stripe Price ID for subscription
            {
              price: selectedPlan.priceId,
              quantity: 1,
            },
          ]
        : [
            // Use price_data for one-time payments
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
