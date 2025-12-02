import { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { Badge, Button } from './ui.jsx';
import { CreditCard, CheckCircle, XCircle, Loader, Sparkles } from 'lucide-react';

export const PaymentModal = ({
  isOpen,
  onClose,
  user,
  planDetails,
  onPaymentSuccess,
  targetPlan = 'founders' // 'starter' or 'founders'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [billingInterval, setBillingInterval] = useState('monthly'); // 'monthly' or 'yearly'

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCheckoutUrl(null);
      setIsProcessing(false);
      // Reset billing interval when modal opens
      setBillingInterval('monthly');
    }
  }, [isOpen]);

  const handleCheckout = async () => {
    if (!user?.uid) {
      setError('Please sign in to purchase Founders Club');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
        // Use the targetPlan prop (what they're trying to purchase)
        const planToPurchase = targetPlan || 'founders';
        
        // Use absolute path - Vercel routes /api/* to /app/api/*
        const apiUrl = import.meta.env.DEV 
          ? 'http://localhost:5173/api/stripe-create-checkout'
          : '/api/stripe-create-checkout';
        const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          plan: planToPurchase,
          billingInterval: planToPurchase === 'starter' ? billingInterval : undefined,
        }),
      });

        // Try to parse JSON but don't crash if the body is HTML/text (e.g. Vercel 404/405 page)
        let data = null;
        const rawText = await response.text();
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch {
          // Not JSON (likely an error HTML page)
          data = null;
        }

      if (!response.ok) {
          const message =
            (data && data.error) ||
            (rawText && rawText.slice(0, 200)) ||
            `Checkout failed with status ${response.status}`;
          throw new Error(message);
        }

        if (!data) {
          throw new Error('Unexpected empty response from checkout endpoint');
      }
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('[PaymentModal] Checkout error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // Check user's CURRENT plan (not targetPlan - that's what they want to upgrade TO)
  const currentPlan = planDetails?.label?.toLowerCase() || 'free';
  const isFounders = currentPlan === 'founders';
  const isStarter = currentPlan === 'starter';
  
  // Determine price based on targetPlan (what they're trying to purchase)
  const planToPurchase = targetPlan || 'founders'; // Default to founders if not specified
  const price = planToPurchase === 'starter' 
    ? (billingInterval === 'yearly' ? 990 : 99) // $990/year or $99/month
    : 299; // Founders: $299 one-time
  const currency = 'USD';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={planToPurchase === 'starter' ? 'Upgrade to Starter' : 'Upgrade to Founders Club'}
      description={planToPurchase === 'starter' ? 'For individual professionals' : 'Lifetime access for early believers'}
      footer={
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Secure payment via Stripe
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            {!(isFounders && planToPurchase === 'founders') && !(isStarter && planToPurchase === 'starter') && (
              <Button
                variant="primary"
                onClick={handleCheckout}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Continue to Checkout
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {((isFounders && planToPurchase === 'founders') || (isStarter && planToPurchase === 'starter')) ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {isFounders && planToPurchase === 'founders' ? "You're already a Founder!" : "You're already on Starter!"}
          </h3>
          <p className="text-gray-400">
            {isFounders && planToPurchase === 'founders'
              ? "You have lifetime access to Founders Club benefits."
              : "You're already subscribed to the Starter plan."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-green-900/20 to-green-950/10 border border-green-800/50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-white">{planToPurchase === 'starter' ? 'Starter' : 'Founders Club'}</h3>
              </div>
              <Badge color="green">{planToPurchase === 'starter' ? (billingInterval === 'yearly' ? 'YEARLY' : 'MONTHLY') : 'LIFETIME'}</Badge>
            </div>
            
            {/* Billing interval selector for Starter */}
            {planToPurchase === 'starter' && (
              <div className="mb-4">
                <div className="flex gap-2 p-1 bg-gray-800/50 rounded-lg border border-gray-700">
                  <button
                    type="button"
                    onClick={() => setBillingInterval('monthly')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      billingInterval === 'monthly'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval('yearly')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      billingInterval === 'yearly'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Yearly
                    <span className="ml-1 text-xs text-green-400">(Save 17%)</span>
                  </button>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-white">${price}</span>
                <span className="text-gray-400">
                  {planToPurchase === 'starter' 
                    ? (billingInterval === 'yearly' ? 'per year' : 'per month')
                    : 'one-time'}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {planToPurchase === 'starter' 
                  ? (billingInterval === 'yearly' ? 'Billed annually, cancel anytime' : 'Cancel anytime')
                  : 'No recurring fees, ever'}
              </p>
            </div>

            <ul className="space-y-2 text-sm text-gray-300">
              {planToPurchase === 'starter' ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>5 MB knowledge base storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>50 session replays per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>Email support</span>
                  </li>
                </>
              ) : (
                <>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>Everything in Starter</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <span>10 MB knowledge base storage</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <span>Unlimited session replays</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>Lifetime access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>Concierge onboarding</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <span>Founders Club badge</span>
              </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>No recurring fees</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-sm text-red-200 mb-4">
              {error}
            </div>
          )}

          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-xs text-gray-400 space-y-2">
            <p className="font-semibold text-gray-300">What happens next:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Complete secure checkout via Stripe</li>
              <li>Your account will be upgraded automatically</li>
              <li>You'll receive a confirmation email</li>
              <li>Start using Founders Club features immediately</li>
            </ol>
          </div>
        </>
      )}
    </Modal>
  );
};

