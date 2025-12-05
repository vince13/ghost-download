import { Modal } from './Modal.jsx';
import { Badge, Button } from './ui.jsx';
import { CheckCircle, Sparkles, Crown, Building2, Zap } from 'lucide-react';
import { PLAN_DETAILS } from '../constants/planConfig.js';

export const PricingModal = ({
  isOpen,
  onClose,
  user,
  currentPlan,
  onUpgradeToFounders,
  onUpgradeToStarter
}) => {
  if (!isOpen) return null;

  const plans = [
    {
      key: 'free',
      ...PLAN_DETAILS.free,
      price: 'Free',
      priceSubtext: 'Forever',
      features: [
        'Live coaching cues',
        'Real-time transcription',
        '5 KB knowledge base storage',
        '5 session replays',
        'Analytics dashboard',
        'TTS whispers',
        'Session export'
      ],
      limitations: [
        'Limited to 5 replays',
        '5 KB storage max'
      ]
    },
    {
      key: 'starter',
      ...PLAN_DETAILS.starter,
      price: '$99',
      priceSubtext: 'Per month',
      features: [
        'Everything in Free',
        '5 MB knowledge base storage',
        '50 session replays',
        'Priority support',
        'Advanced analytics',
        'Email support'
      ],
      limitations: [
        'Monthly subscription',
        '50 replays per month'
      ],
      cta: 'Get Started'
    },
    {
      key: 'founders',
      ...PLAN_DETAILS.founders,
      price: '$299',
      priceSubtext: 'One-time',
      features: [
        'Everything in Starter',
        '10 MB knowledge base storage',
        'Unlimited replays',
        'Lifetime access',
        'Priority support',
        'Concierge onboarding',
        'Founders Club badge',
        'No recurring fees'
      ],
      limitations: [],
      cta: 'Get Founders Club',
      popular: true
    },
    {
      key: 'enterprise',
      ...PLAN_DETAILS.enterprise,
      price: 'Custom',
      priceSubtext: 'Contact sales',
      features: [
        'Everything in Founders',
        'Unlimited KB documents',
        'SAML/SCIM SSO',
        'SOC2 compliance',
        'API access',
        'Dedicated TAM',
        'On-prem deployment',
        'Custom integrations'
      ],
      limitations: [],
      cta: 'Contact Sales'
    }
  ];

  const getPlanIcon = (key) => {
    switch (key) {
      case 'founders':
        return <Sparkles className="w-5 h-5" />;
      case 'concierge':
        return <Crown className="w-5 h-5" />;
      case 'enterprise':
        return <Building2 className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Plans & Pricing"
      description="Choose the plan that fits your needs"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
      className="max-w-7xl w-full"
    >
      <div className="space-y-6">
        {/* Current Plan Badge */}
        {currentPlan && (
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-400">Your current plan</p>
            <p className="text-lg font-bold text-white capitalize">{currentPlan}</p>
          </div>
        )}

        {/* Plans Grid - Show all 4 tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.key;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.key}
                className={`relative bg-gray-900/60 border rounded-xl p-5 sm:p-6 flex flex-col min-w-[200px] ${
                  isPopular
                    ? 'border-green-500/50 ring-2 ring-green-500/20'
                    : 'border-gray-800'
                } ${isCurrentPlan ? 'ring-2 ring-blue-500/50' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge color="green" className="text-xs">POPULAR</Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-3">
                    <Badge color="blue" className="text-xs">CURRENT</Badge>
                  </div>
                )}

                <div className="mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`${plan.badgeColor === 'green' ? 'text-green-400' : plan.badgeColor === 'blue' ? 'text-blue-400' : 'text-yellow-400'}`}>
                      {getPlanIcon(plan.key)}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">{plan.label}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{plan.headline}</p>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-white">{plan.price}</span>
                    {plan.priceSubtext && (
                      <span className="text-xs sm:text-sm text-gray-400">/{plan.priceSubtext}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <div>
                    <p className="text-xs font-semibold text-gray-300 mb-2 uppercase">Features</p>
                    <ul className="space-y-1.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-300">
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Limitations</p>
                      <ul className="space-y-1.5">
                        {plan.limitations.map((limitation, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-500">
                            <span className="text-gray-600">•</span>
                            <span className="leading-tight">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {plan.cta && (
                  <Button
                    variant={isPopular ? 'primary' : 'secondary'}
                    className="w-full mt-auto flex-shrink-0 text-xs sm:text-sm"
                    onClick={() => {
                      if (plan.key === 'starter' && onUpgradeToStarter) {
                        onClose();
                        onUpgradeToStarter();
                      } else if (plan.key === 'founders' && onUpgradeToFounders) {
                        onClose();
                        onUpgradeToFounders();
                      } else if (plan.key === 'enterprise') {
                        // Open contact form or email
                        window.location.href = `mailto:sales@ghost.ai?subject=Interested in ${plan.label}`;
                      }
                    }}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.cta}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="border-t border-gray-800 pt-6 mt-6">
          <h4 className="text-sm font-semibold text-white mb-3">Frequently Asked Questions</h4>
          <div className="space-y-3 text-sm text-gray-400">
            <div>
              <p className="font-medium text-gray-300 mb-1">Can I upgrade later?</p>
              <p>Yes! You can upgrade from Trial to Founders Club at any time. Your data will be preserved.</p>
            </div>
            <div>
              <p className="font-medium text-gray-300 mb-1">What payment methods do you accept?</p>
              <p>We accept all major credit cards via Stripe. Founders Club is a one-time payment.</p>
            </div>
            <div>
              <p className="font-medium text-gray-300 mb-1">Is there a refund policy?</p>
              <p>Founders Club purchases are final. Contact support for exceptional circumstances.</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

