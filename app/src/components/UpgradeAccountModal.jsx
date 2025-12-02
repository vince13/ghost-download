import { useEffect, useState } from 'react';
import { Modal } from './Modal.jsx';
import { Badge, Button } from './ui.jsx';
import { LogOut, Mail, ShieldCheck, UserCheck, BarChart3, Sparkles, CreditCard } from 'lucide-react';

const benefits = [
  'Sync transcripts & cues across devices',
  'Unlock Concierge onboarding + Founders Club perks',
  'Persist KB uploads, parameters, and headset tuning',
  'Track subscription tier for billing + entitlements'
];

export const UpgradeAccountModal = ({
  isOpen,
  onClose,
  user,
  profile,
  planDetails,
  onGoogleUpgrade,
  onEmailUpgrade,
  onSignOut,
  authError,
  isProcessing,
  onOpenAnalytics,
  canAccessAnalytics = false,
  onUpgradeToFounders,
  onViewPricing
}) => {
  const [formState, setFormState] = useState({
    displayName: '',
    email: '',
    password: ''
  });
  const [localStatus, setLocalStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLocalStatus(null);
      setFormState({
        displayName: user?.displayName || '',
        email: user?.email || '',
        password: ''
      });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleInputChange = (event) => {
    setFormState({ ...formState, [event.target.name]: event.target.value });
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setLocalStatus(null);
    if (!onEmailUpgrade) return;
    try {
      await onEmailUpgrade(formState);
      setLocalStatus('Account saved! You can now close this dialog.');
    } catch (error) {
      // error surface handled via authError prop
    }
  };

  const planLabel = planDetails?.label || profile?.plan || (user?.isAnonymous ? 'guest' : 'trial');
  const isGuest = user?.isAnonymous;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isGuest ? 'Save your Ghost session' : 'Account preferences'}
      description={
        isGuest
          ? 'Link this anonymous session to a real account so we can sync your cues, KB, and subscription perks.'
          : 'Manage your subscription state, Linked logins, and advanced preferences.'
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            End-to-end secured via Firebase Auth
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wide">Current Plan</p>
            <p className="text-lg font-semibold text-white capitalize">{planLabel}</p>
            {planDetails?.headline && (
              <p className="text-xs text-gray-500 mt-1">{planDetails.headline}</p>
            )}
          </div>
          <Badge color={planDetails?.badgeColor ?? (planLabel === 'guest' ? 'yellow' : 'green')}>
            {isGuest ? 'Guest Session' : 'Synced'}
          </Badge>
        </div>
        {user?.uid && (
          <p className="text-xs font-mono text-gray-500">
            UID: {user.uid}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <p className="text-sm font-semibold text-white">Why link your account?</p>
        <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
          {benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      </section>

      {authError && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-sm text-red-200">
          {authError.message || 'Something went wrong while updating your account.'}
        </div>
      )}
      {localStatus && (
        <div className="p-3 rounded-lg bg-green-900/30 border border-green-700 text-sm text-green-200">
          {localStatus}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2">
        <CardOption
          title="Link Google"
          description="Fastest way to sync Ghost across devices. Uses Google OAuth."
          icon={<UserCheck className="w-5 h-5 text-blue-400" />}
          actionLabel={isGuest ? 'Link Google Account' : 'Reconnect Google'}
          disabled={isProcessing}
          onAction={onGoogleUpgrade}
        />
        {!isGuest && canAccessAnalytics && onOpenAnalytics && (
          <CardOption
            title="View Analytics"
            description="Track your usage, sessions, and feature adoption."
            icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
            actionLabel="Open Dashboard"
            disabled={isProcessing}
            onAction={onOpenAnalytics}
          />
        )}
        {onViewPricing && (
          <CardOption
            title="View Plans & Pricing"
            description="Compare all plans and see what's included."
            icon={<CreditCard className="w-5 h-5 text-blue-400" />}
            actionLabel="View Pricing"
            disabled={isProcessing}
            onAction={onViewPricing}
          />
        )}
        {!isGuest && (
          <CardOption
            title="Sign Out"
            description="Switch accounts or clear this device."
            icon={<LogOut className="w-5 h-5 text-red-400" />}
            actionLabel="Sign Out"
            variant="danger"
            disabled={isProcessing}
            onAction={onSignOut}
          />
        )}
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold text-white">Prefer email + password?</p>
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-gray-400 uppercase tracking-wide flex flex-col gap-1">
              Display Name
              <input
                type="text"
                name="displayName"
                value={formState.displayName}
                onChange={handleInputChange}
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="Ghost Operator"
              />
            </label>
            <label className="text-xs text-gray-400 uppercase tracking-wide flex flex-col gap-1">
              Email
              <input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleInputChange}
                required
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="you@company.com"
              />
            </label>
          </div>
          <label className="text-xs text-gray-400 uppercase tracking-wide flex flex-col gap-1">
            Password
            <input
              type="password"
              name="password"
              value={formState.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="At least 6 characters"
            />
          </label>
          <Button
            type="submit"
            variant="primary"
            disabled={isProcessing}
            className="w-full justify-center"
          >
            <Mail className="w-4 h-4" />
            {isGuest ? 'Create login & save session' : 'Update email login'}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            We’ll link this login to your current session so transcripts, KB docs, and subscription data stay intact.
          </p>
        </form>
      </section>
    </Modal>
  );
};

const CardOption = ({ title, description, icon, actionLabel, onAction, disabled, variant = 'secondary' }) => (
  <div className="border border-gray-800 rounded-xl p-4 bg-gray-900/40 flex flex-col gap-3">
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
    <Button onClick={onAction} disabled={disabled} variant={variant === 'danger' ? 'danger' : 'secondary'}>
      {actionLabel}
    </Button>
  </div>
);


