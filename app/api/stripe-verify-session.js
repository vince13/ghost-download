/**
 * Verify Stripe Checkout Session
 * GET /api/stripe-verify-session?session_id=xxx
 */
import Stripe from 'stripe';

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
      return res.status(200).json({
        success: true,
        session: {
          id: session.id,
          paymentStatus: session.payment_status,
          plan: session.metadata?.plan,
        }
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

