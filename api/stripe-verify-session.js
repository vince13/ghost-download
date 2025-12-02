/**
 * Verify Stripe Checkout Session
 * GET /api/stripe-verify-session?session_id=xxx
 *
 * This endpoint is hit by the payment-success page after Stripe redirects back.
 * In addition to verifying the session, we also update the user's plan in Firestore
 * as a fallback in case the webhook did not run.
 */
import Stripe from 'stripe';
import { getAdminDb } from './lib/firebaseAdmin.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan; // don't default to founders to avoid wrong upgrades
      let updateStatus = 'skipped';

      if (userId && plan) {
        const db = getAdminDb();
        if (db) {
          try {
            const userRef = db.collection('users').doc(userId);
            await userRef.set(
              {
                plan,
                planUpgradedAt: new Date(),
                stripeCustomerId: session.customer,
                stripeSessionId: session.id,
                paymentStatus: 'completed',
              },
              { merge: true }
            );

            const paymentRef = userRef.collection('payments').doc(session.id);
            await paymentRef.set(
              {
                sessionId: session.id,
                plan,
                amount: (session.amount_total || 0) / 100,
                currency: session.currency,
                status: 'completed',
                createdAt: new Date(),
                customerEmail: session.customer_email,
                source: 'checkout-verify',
              },
              { merge: true }
            );
            updateStatus = 'ok';
          } catch (err) {
            console.error('[stripe-verify-session] Failed to update user plan:', err);
            updateStatus = 'failed';
          }
        } else {
          console.error('[stripe-verify-session] Admin DB not available');
          updateStatus = 'no-admin';
        }
      } else {
        console.error('[stripe-verify-session] Missing userId or plan in session metadata', {
          userId,
          plan,
          metadata: session.metadata,
        });
        updateStatus = 'no-user-or-plan';
      }

      return res.status(200).json({
        success: true,
        session: {
          id: session.id,
          paymentStatus: session.payment_status,
          plan,
        },
        updateStatus,
      });
    } else {
      return res.status(400).json({
        success: false,
        paymentStatus: session.payment_status,
      });
    }
  } catch (error) {
    console.error('[stripe-verify-session] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to verify session',
    });
  }
}

