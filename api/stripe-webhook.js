/**
 * Stripe Webhook Handler
 * POST /api/stripe-webhook
 * Handles payment success/failure events from Stripe
 */
import Stripe from 'stripe';
import { getAdminDb } from './lib/firebaseAdmin.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Stripe webhook secret for verifying webhook signatures
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];

  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Handle subscription events for Starter plan
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        await handleSubscriptionCancelled(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        console.log('[stripe-webhook] Payment succeeded:', event.data.object.id);
        break;
      
      case 'payment_intent.payment_failed':
        console.log('[stripe-webhook] Payment failed:', event.data.object.id);
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[stripe-webhook] Error processing event:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/**
 * Handle successful checkout completion
 * IMPORTANT: Only upgrade users if payment_status is 'paid'
 */
async function handleCheckoutCompleted(session) {
  const { userId, plan } = session.metadata || {};
  
  if (!userId || !plan) {
    console.error('[stripe-webhook] Missing userId or plan in session metadata');
    return;
  }

  // CRITICAL: Only upgrade if payment is actually paid
  if (session.payment_status !== 'paid') {
    console.log(`[stripe-webhook] Checkout session ${session.id} has payment_status '${session.payment_status}', not 'paid'. Not upgrading user.`);
    return;
  }

  console.log(`[stripe-webhook] Upgrading user ${userId} to plan: ${plan} (payment_status: ${session.payment_status})`);

  const db = getAdminDb();
  if (!db) {
    console.error('[stripe-webhook] Firebase Admin not initialized');
    return;
  }

  try {
    // Update user profile with new plan
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      plan,
      planUpgradedAt: new Date(),
      stripeCustomerId: session.customer,
      stripeSessionId: session.id,
      paymentStatus: 'completed'
    });

    // Create payment record
    const paymentRef = db.collection('users').doc(userId).collection('payments').doc(session.id);
    await paymentRef.set({
      sessionId: session.id,
      plan,
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      status: 'completed',
      createdAt: new Date(),
      customerEmail: session.customer_email,
    });

    console.log(`[stripe-webhook] Successfully upgraded user ${userId} to ${plan}`);
  } catch (error) {
    console.error('[stripe-webhook] Error updating user plan:', error);
    throw error;
  }
}

/**
 * Handle subscription created/updated (for Starter plan)
 * IMPORTANT: Only upgrade users if subscription is active and paid
 */
async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata?.userId;
  const plan = subscription.metadata?.plan;
  
  // CRITICAL: Don't default to 'starter' - require explicit plan in metadata
  if (!plan) {
    console.error('[stripe-webhook] Missing plan in subscription metadata. Not upgrading user.');
    return;
  }
  
  // CRITICAL: Only upgrade if subscription is active/paid
  // Status can be: active, past_due, canceled, unpaid, incomplete, incomplete_expired, trialing, paused
  const validStatuses = ['active', 'trialing'];
  if (!validStatuses.includes(subscription.status)) {
    console.log(`[stripe-webhook] Subscription ${subscription.id} has status '${subscription.status}', not upgrading user. Only 'active' or 'trialing' subscriptions upgrade users.`);
    return;
  }
  
  if (!userId) {
    console.error('[stripe-webhook] Missing userId in subscription metadata');
    return;
  }

  const db = getAdminDb();
  if (!db) {
    console.error('[stripe-webhook] Firebase Admin not initialized');
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      plan,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
      subscriptionStatus: subscription.status,
      planUpgradedAt: new Date(),
    });

    console.log(`[stripe-webhook] Updated subscription for user ${userId} to ${plan} (status: ${subscription.status})`);
  } catch (error) {
    console.error('[stripe-webhook] Error updating subscription:', error);
    throw error;
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) return;

  const db = getAdminDb();
  if (!db) {
    console.error('[stripe-webhook] Firebase Admin not initialized');
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      plan: 'free', // Downgrade to free plan
      subscriptionStatus: 'cancelled',
      subscriptionCancelledAt: new Date(),
    });

    console.log(`[stripe-webhook] Cancelled subscription for user ${userId}`);
  } catch (error) {
    console.error('[stripe-webhook] Error cancelling subscription:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  const userId = paymentIntent.metadata?.userId;
  
  if (!userId) return;

  const db = getAdminDb();
  if (!db) {
    console.error('[stripe-webhook] Firebase Admin not initialized');
    return;
  }

  try {
    const paymentRef = db.collection('users').doc(userId).collection('payments').doc(paymentIntent.id);
    await paymentRef.set({
      paymentIntentId: paymentIntent.id,
      status: 'failed',
      error: paymentIntent.last_payment_error?.message,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('[stripe-webhook] Error recording failed payment:', error);
  }
}
