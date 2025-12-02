### Build Plan: Cheapest Viable Ghost

- **Frontend + Desktop Wrapper**
  - Start with the existing React/Tailwind UI.
  - Wrap it in Electron only when you need headphone-only audio; until then, use plain web for demos.
  - For stealth audio routing without paid SDKs, script against OS-level defaults plus free virtual audio drivers (VB-Cable on Windows, BlackHole on macOS). Budget $0, just added setup instructions.

- **Auth, Storage, Payments**
  - Auth: Firebase Authentication (email/password + magic link) on the free Spark tier.
  - Data: Firebase Firestore (Spark tier) for user configs, transcripts, payment flags.
  - Payments: Stripe Checkout (no monthly fee, only per-transaction). Keep concierge onboarding via manually issued Payment Links.

- **Real-Time Engine**
  - Use Vapi.ai’s free trial minutes to prototype full-duplex audio; switch to paid only after LTD cash arrives. Alternative: Retell AI free tier for small usage.
  - For cases when trial minutes run out, add a fallback text-only guidance mode (cheaper OpenAI/GPT-4o mini text completions) so beta testers keep experiencing something.
  - WebSocket proxy: tiny Next.js API route (Vercel free tier) or a single Fly.io/Render free instance to fan out events to the frontend.

- **LLM + RAG**
  - Start with Gemini Flash 2.0 API free quota (Google gives monthly credits); when exhausted, use GPT-4o-mini or Claude Haiku pay-as-you-go.
  - Knowledge base: Pinecone Starter (free 1 pod) or Weaviate Cloud free tier for 5–10MB of vectors. Limit uploads to a single battlecard per user until revenue grows.
  - Chunk + embed via open-source sentence-transformers run locally or via Hugging Face Inference free API (rate-limited but $0).

- **Dev/Distribution**
  - Hosting: Vercel (web app + marketing site), Cloudflare Pages for landing pages; both free at low volume.
  - Desktop builds: distribute unsigned Electron builds at first with clear instructions; after first LTD payments, reinvest $99 into Apple Developer ID and a cheap code-signing cert for Windows.
  - Version control + CI: GitHub free, GitHub Actions free tier for builds.

### Execution Steps

1. **Week 1 – Sell First**
   - Finish marketing assets (`ghost-copy.md`, “Comcast Challenge” video).
   - Launch Carrd/Notion mini-site + Stripe Payment Link (LTD).
   - Concierge onboarding promise to justify manual setup.

2. **Week 2 – Prototype Stack**
   - Connect React app to a Next.js API route running on Vercel.
   - Integrate Vapi/Retell using free minutes; pipe responses into the existing suggestions panel.
   - Hook Firebase auth + Firestore for transcripts and user settings.

3. **Week 3 – KB + Stealth Layer**
   - Build minimal upload UI; chunk locally with open-source embeddings → push to Pinecone starter pod.
   - Swap to Electron shell, integrate free virtual audio cable instructions, test headphone-only playback.

4. **Week 4 – Hardening**
   - Implement fallback text mode when Vapi minutes exhausted.
   - Polish onboarding wizard, email receipts (Stripe webhooks on Vercel).
   - As LTD revenue lands, pay for Apple Developer, notarize builds, and top up Vapi minutes.

### Ongoing Cost Control

- Monitor API usage; cap per-user minutes until they upgrade to paid tiers.
- Cache KB search results per objection to reduce vector queries.
- Keep infra stateless on free platforms; only move to paid services once ARR justifies it.

This plan keeps tooling mostly free while still delivering the core Ghost experience; every upgrade (signed builds, more V2V minutes, larger vector stores) is tied to LTD cash flow so you never overextend before revenue.