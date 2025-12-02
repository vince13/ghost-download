export const PLAN_ORDER = ['free', 'starter', 'founders', 'enterprise'];

const infinity = Number.POSITIVE_INFINITY;

// KB size limits in bytes
const KB_SIZE_LIMITS = {
  FREE: 5 * 1024,        // 5 KB = 5,120 bytes
  STARTER: 5 * 1024 * 1024,  // 5 MB = 5,242,880 bytes
  FOUNDERS: 10 * 1024 * 1024, // 10 MB = 10,485,760 bytes
};

export const PLAN_DETAILS = {
  free: {
    label: 'Free',
    headline: 'Try Ghost with essential features',
    description: 'Perfect for testing and getting started. No credit card required.',
    badgeColor: 'blue',
    upgradeCta: 'Upgrade to unlock more features',
    entitlements: {
      kbSizeLimit: KB_SIZE_LIMITS.FREE, // 5 KB total
      playbackLimit: 5,
      analyticsAccess: true,
      conciergeAccess: false,
      desktopStealth: false,
      apiAccess: false
    }
  },
  starter: {
    label: 'Starter',
    headline: 'For individual professionals',
    description: 'Everything you need for regular use with more capacity.',
    badgeColor: 'green',
    upgradeCta: 'Upgrade to Founders Club for lifetime access',
    entitlements: {
      kbSizeLimit: KB_SIZE_LIMITS.STARTER, // 5 MB total
      playbackLimit: 50,
      analyticsAccess: true,
      conciergeAccess: false,
      desktopStealth: false,
      apiAccess: false
    }
  },
  founders: {
    label: 'Founders Club',
    headline: 'Lifetime access for early believers',
    description: 'Unlimited everything, one-time payment, lifetime access.',
    badgeColor: 'green',
    upgradeCta: 'Contact us for enterprise solutions',
    entitlements: {
      kbSizeLimit: KB_SIZE_LIMITS.FOUNDERS, // 10 MB total
      playbackLimit: infinity,
      analyticsAccess: true,
      conciergeAccess: true,
      desktopStealth: true,
      apiAccess: false
    }
  },
  enterprise: {
    label: 'Enterprise',
    headline: 'Custom solutions for teams',
    description: 'SAML/SCIM, SOC2 compliance, API access, dedicated support, and more.',
    badgeColor: 'green',
    upgradeCta: 'Contact sales for custom pricing',
    entitlements: {
      kbSizeLimit: infinity, // Unlimited
      playbackLimit: infinity,
      analyticsAccess: true,
      conciergeAccess: true,
      desktopStealth: true,
      apiAccess: true
    }
  }
};

export const getPlanDetails = (plan) => {
  // Map old plan names to new ones for backward compatibility
  const planMapping = {
    'guest': 'free',
    'trial': 'free',
    'concierge': 'enterprise'
  };
  
  const mappedPlan = planMapping[plan] || plan;
  const key = PLAN_DETAILS[mappedPlan] ? mappedPlan : 'free';
  return PLAN_DETAILS[key];
};


