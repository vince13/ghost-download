# Entitlement System Review

## Overview
This document reviews the entitlement system to ensure all advertised perks are correctly enabled for each user tier.

## Plan Tiers & Advertised Features

### Free Tier
**Advertised in PricingModal:**
- ✅ Live coaching cues
- ✅ Real-time transcription
- ✅ 3 KB documents
- ✅ 5 session replays
- ✅ Analytics dashboard
- ✅ TTS whispers
- ✅ Session export

**Defined in planConfig.js:**
- `kbLimit: 3` ✅
- `playbackLimit: 5` ✅
- `analyticsAccess: true` ✅
- TTS whispers: ❌ **ISSUE** - Currently blocked for 'guest' plan
- Session export: ❌ **ISSUE** - Currently blocked for 'guest' plan

### Starter Tier ($99/month or $990/year)
**Advertised in PaymentModal:**
- ✅ Everything in Free
- ✅ 10 knowledge base documents
- ✅ 50 session replays per month
- ✅ Priority support
- ✅ Advanced analytics
- ✅ Email support

**Defined in planConfig.js:**
- `kbLimit: 10` ✅
- `playbackLimit: 50` ✅
- `analyticsAccess: true` ✅
- TTS whispers: ✅ (available for non-guest)
- Session export: ✅ (available for non-guest)

### Founders Club ($299 one-time)
**Advertised in PaymentModal:**
- ✅ Everything in Starter
- ✅ 20 knowledge base documents
- ✅ Unlimited session replays
- ✅ Lifetime access
- ✅ Priority support
- ✅ Concierge onboarding
- ✅ Founders Club badge
- ✅ No recurring fees

**Defined in planConfig.js:**
- `kbLimit: 20` ✅
- `playbackLimit: infinity` ✅
- `analyticsAccess: true` ✅
- `conciergeAccess: true` ✅
- `desktopStealth: true` ✅
- TTS whispers: ✅
- Session export: ✅

### Enterprise (Custom)
**Advertised in PricingModal:**
- ✅ Everything in Founders
- ✅ Unlimited KB documents
- ✅ SAML/SCIM SSO
- ✅ SOC2 compliance
- ✅ API access
- ✅ Dedicated TAM
- ✅ On-prem deployment
- ✅ Custom integrations

**Defined in planConfig.js:**
- `kbLimit: infinity` ✅
- `playbackLimit: infinity` ✅
- `analyticsAccess: true` ✅
- `conciergeAccess: true` ✅
- `desktopStealth: true` ✅
- `apiAccess: true` ✅

## Issues Found

### 1. TTS Whispers for Free Tier
**Problem:** `useEntitlements.js` blocks TTS whispers for 'guest' plan, but Free tier users should have access per PricingModal.

**Current Logic:**
```javascript
const canUseTTSWhispers = useMemo(() => {
  const plan = planDetails?.label?.toLowerCase() || 'guest';
  return plan !== 'guest'; // Blocks Free tier users!
}, [planDetails]);
```

**Fix:** TTS whispers should be available for all logged-in users (Free, Starter, Founders, Enterprise), but NOT for anonymous guests.

### 2. Session Export for Free Tier
**Problem:** `useEntitlements.js` blocks session export for 'guest' plan, but Free tier users should have access per PricingModal.

**Current Logic:**
```javascript
const canExportSessions = useMemo(() => {
  const plan = planDetails?.label?.toLowerCase() || 'guest';
  return plan !== 'guest'; // Blocks Free tier users!
}, [planDetails]);
```

**Fix:** Session export should be available for all logged-in users (Free, Starter, Founders, Enterprise), but NOT for anonymous guests.

### 3. Plan Assignment After Payment
**Status:** ✅ Verified - `stripe-verify-session.js` correctly updates user plan in Firestore.

## Recommendations

1. **Fix TTS Whispers & Session Export:** Update `useEntitlements.js` to allow these features for Free tier (logged-in users), but block for anonymous guests.

2. **Add Entitlement Flags:** Consider adding explicit flags in `planConfig.js` for TTS whispers and session export to make entitlements more explicit.

3. **Test Plan Assignment:** Verify that after successful payment, users immediately get access to all advertised features.

4. **Add Entitlement Tests:** Create unit tests to verify entitlements match advertised features.

## Action Items

- [x] Review planConfig.js entitlements
- [x] Review useEntitlements.js logic
- [x] Compare advertised features vs actual entitlements
- [ ] Fix TTS whispers for Free tier
- [ ] Fix Session export for Free tier
- [ ] Verify plan assignment after payment
- [ ] Test all entitlement gates

