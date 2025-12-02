Here’s a tiering model that keeps Ghost’s “instant wow” intact while giving you clear upgrade paths, predictable margins, and concierge touchpoints for high-value clients.

---

## 1. Guest (default, anonymous)

- **Who:** First-touch visitors, demo testers, sales prospects on live calls.
- **Features:** Live listening, mock cues, limited STT, no KB persistence.
- **Limitations:** 1 concurrent session, no playback, no saved settings.
- **Purpose:** Showcase Ghost’s magic in under 60 seconds—no signup friction.

**Why keep it:** Drives viral demos and lets sellers show Ghost mid-call without gating.

---

## 2. Trial (signed-in, no payment yet)

- **Who:** Users who linked Google/email but haven’t paid.
- **Features:** 
  - Full real-time cues
  - 3 session replays
  - 3 KB documents
  - “Lite” coaching library
- **Limitations:** No concierge tuning, limited model choices, 7 or 14-day cap.
- **Purpose:** Convert serious prospects while capturing contact info and usage data.

---

## 3. Founders Club (early revenue / LTD)

- **Who:** Early adopters funding Vapi, Pinecone, Gemini costs.
- **Features:** 
  - Unlimited live sessions
  - 20 KB docs
  - Priority webhook tuning
  - Branding badge (“Founders Club”)
  - Concierge onboarding call (once)
- **Limitations:** No enterprise controls, limited seat count (e.g., 100 slots).
- **Business need:** Generate $20–$50K upfront cash, create evangelists, gather reference calls.

---

## 4. Concierge (flagship recurring tier)

- **Who:** High-ticket reps, boutique agencies, fractional CROs.
- **Features:** 
  - Everything in Founders +
  - Dedicated TAM (Telegram/Signal)
  - Custom playbooks + KB writing
  - Premium models (GPT-4o, Gemini Pro)
  - Stealth desktop mode (Electron auto-updates)
  - Unlimited session replays + TTS whisper mode
- **Pricing ideas:** $499–$999/mo/user or $3K/mo per team of 5.
- **Purpose:** White-glove experience where you can justify high ARPU, gather deep case studies, and fund engineering (retell/Vapi usage, Pinecone, etc.)

---

## 5. Enterprise (multi-seat + security)

- **Who:** Contact centers, SaaS orgs, telco escalation teams.
- **Features:** 
  - Concierge tier + SAML/SCIM, audit logs, SOC2-friendly controls
  - Usage-based billing (per seat or per minute)
  - On-prem audio routing (via Electron + policy controls)
  - API access for CRM embedding
  - Custom webhook logic and prioritized SLA
- **Pricing ideas:** $10K+/mo contracts with implementation fee.
- **Purpose:** Anchor deals, align with procurement, justify compliance investment.

---

### Implementation priorities

1. **Ship the tier flags now** (`plan` field) even before full features exist; toggled manually for early customers.
2. **Map entitlements** (KB limit, playback, concierge contact) to that plan field in the frontend.
3. **Make Founders Club a real SKU** (Stripe or Lemon Squeezy) to keep early supporters engaged and cash-positive.
4. **Use Concierge agreements** to learn the must-have enterprise features before investing in SOC2/desktop stealth.

With this structure you get:
- Zero-friction guest demos (viral growth)
- Structured upgrade path (trial → Founders/Concierge)
- High-touch tier you can upsell manually
- Enterprise-ready story for bigger logos once compliance is funded.

We can start wiring entitlements right away: plan badge already shows in the header, so gating KB uploads, session playback, or TTS cues is straightforward. Let me know which feature to gate first and I’ll implement the checks.






Here’s what I suggest:
1. Prioritize which layers to ship first (e.g. mini-panel + opacity controls + notification discipline).
2. Wireframe/confirm UX (where the floating panel sits, how it collapses, hotkey mapping).
3. Break into dev tasks (e.g. “Add overlay layout”, “Add hotkey service”, “Add opacity slider”, “Add notification throttle”, “Add focus mode”).


Great—layer 1 (floating HUD + transcript dedupe) is in place and stable. Next logical steps from the original “non-distracting” plan:

1. **Hotkeys / control layer**  
   - Global shortcuts to show/hide the HUD, cycle cues, and dismiss a cue.  
   - Quick toggle to mute/unmute whispering without touching the UI.  

2. **Notification discipline**  
   - Throttle cue popups (e.g., max one every 5 seconds) and queue extras in Live Intel.  
   - “Focus mode” toggle that only surfaces critical cues (pricing, timeline, competitor).  

3. **Panel presets & opacity profiles**  
   - Preset positions (left/right/top) users can select, with snap-to-edge behavior.  
   - Auto-collapse when screen sharing is detected (Electron/desktop only).  

4. **Micro-guidance / onboarding**  
   - “Where should Ghost live?” overlay that walks users through placement, opacity, and audio routings the first time.  

Let me know which slice you’d like to tackle next (hotkeys, notification discipline, or layout presets) and I’ll implement it while keeping the current core features untouched.



**===============================LEFT============================**

## First customer readiness analysis

Created `FIRST_CUSTOMER_READINESS.md` with:

### Completed (85% ready)
- ✅ Core functionality (real-time coaching, sessions, KB, playbooks)
- ✅ Payment integration (Stripe checkout, webhooks, entitlements)
- ✅ User experience (HUD, mobile, hotkeys, onboarding)
- ✅ Landing page (updated perks, checkout flow)

### Needs attention
❌ - Production testing (end-to-end verification)
❌ - Demo video (marketing asset)
❌ - Live Stripe configuration (when ready for real payments)
❌ - Error handling edge cases

### Recommendation
Ready for beta users with test mode Stripe. After 5–10 happy beta users, switch to live mode and launch publicly.

The landing page now correctly redirects to checkout, and all perk information matches the app.

clear && npm run dev

clear && vercel --prod