# Ghost Protocol — User Guide

Welcome to Ghost, your real-time negotiation wingman. This guide walks you through setup, core workflows, and best practices so you can get value in minutes.

---

## 1. Quick Start

1. **Visit the app**  
   - Landing: `https://ghost-green.vercel.app`  
   - App: `https://ghost-green.vercel.app/app`

2. **Sign in**  
   - Start as Guest instantly  
   - Link Google or Email (recommended) to persist sessions and unlock plan upgrades

3. **Run a session**  
   - Pick a mode (Sales, Interview, Negotiation)  
   - Click **START**  
   - Keep Ghost visible (desktop HUD or mobile bottom sheet)  
   - Mention “price, budget, competition, timeline” to trigger cues

4. **Review afterwards**  
   - Open Session Replay to rewatch transcripts, cues, and analytics  
   - Export PDF/CSV if your plan allows

---

## 2. Dashboard Overview

| Area                   | What it does                                                                                     |
|-----------------------|---------------------------------------------------------------------------------------------------|
| Floating HUD          | Minimal overlay with live intel, focus mode, whisper controls, hotkeys                           |
| Live Intel Board      | Full list of coaching cues with KB indicator (green “KB” badge when RAG context is used)         |
| Live Transcript       | Scrollable log of “You” vs “Them” speech                                                          |
| Quick Actions (mobile)| Bottom sheet with latest cue + Focus / Whisper toggles                                           |
| Analytics             | Usage stats, cue generation, feature usage (Founders+ plans)                                      |

---

## 3. Key Workflows

### 3.1 Running a Session
1. Select a mode in the top bar  
2. Adjust parameters (optional)  
3. Hit **START** (Ctrl+Shift+S on desktop)  
4. Mention key triggers during the call to surface cues  
5. Use hotkeys or HUD buttons to toggle Focus Mode, pin HUD, mute whispers

### 3.2 Knowledge Base (RAG)
1. Open **Knowledge Base** modal  
2. Upload text/markdown files (PDF support coming soon)  
3. Ghost splits, embeds, and stores content in Pinecone  
4. When cues reference KB content, a green “KB” badge appears

### 3.3 Custom Playbooks
1. Open **Playbooks**  
2. Create playbook → name, description, scenario, system prompt, sample cues  
3. Select a playbook to activate it (stored per user + localStorage)  
4. Activated playbook customizes the LLM prompt for all sessions

### 3.4 Session Replay & Export
1. Open **Session Replay**  
2. Browse session list (limited by plan entitlements)  
3. View transcript timeline, cues, analytics  
4. Export CSV/PDF if allowed

### 3.5 Payments & Upgrades
1. Open **Pricing** (nav) or **Account** modal  
2. Choose Starter (subscription) or Founders (one-time lifetime)  
3. Stripe checkout handles payment → plan upgrades automatically applied via webhook  
4. Use `/app/payment-success?session_id=...` for post-checkout confirmation

---

## 4. Hotkeys & Controls

| Action                    | Hotkey (Desktop)          |
|--------------------------|---------------------------|
| Toggle HUD               | Ctrl + Shift + G          |
| Pin / Unpin HUD          | Ctrl + Shift + H          |
| Next cue                 | Ctrl + Shift + I          |
| Open intel board         | Ctrl + Shift + L          |
| Toggle Focus Mode        | Ctrl + Shift + F          |
| Mute / Unmute whispers   | Ctrl + Shift + M          |
| Start / Stop session     | Ctrl + Shift + S          |

---

## 5. Plans & Entitlements

| Plan        | KB Docs | Session Replay | Analytics | TTS Whispers | Notes                              |
|-------------|---------|----------------|-----------|--------------|------------------------------------|
| Free        | 3       | 5 sessions     | Basic     | No           | Guest testing                      |
| Starter $99 | 10      | 50 sessions    | Full      | Yes          | For individual reps                |
| Founders $299 (LTD) | 20 | Unlimited   | Full      | Yes          | Lifetime access + future features  |
| Enterprise  | Unlimited| Unlimited    | Full      | Yes          | API, SAML/SCIM, dedicated support  |

---

## 6. Best Practices

- **Use Focus Mode** for high-stakes moments to reduce distractions  
- **Upload fresh KB docs** (battle cards, pricing sheets) before big calls  
- **Monitor analytics** after each session to understand cue frequency and trigger patterns  
- **Record your own “Inception Method” video** (landing page uses it for social proof)  
- **Pair Ghost with headphones** for whisper cues—keeps everything silent to the customer  
- **Experiment with Playbooks** to tailor coaching to different personas or industries

---

## 7. Support

- **Email:** support@ghostprotocol.ai  
- **Sales / Enterprise:** sales@ghostprotocol.ai  
- **Status / logs:** See `HOW_TO_CHECK_LOGS.md` / Vercel dash  
- **Docs:**  
  - `LANDING_PAGE_SETUP.md`  
  - `SAMPLE_PLAYBOOK.md`  
  - `TESTING_RAG.md` & `QUICK_TEST_RAG.md`  
  - `VERCEL_ENV_SETUP.md`, `FIRESTORE_RULES_DEPLOY.md`

Use this guide as your reference when onboarding new teammates or customers. Happy negotiating!

