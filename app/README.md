# Ghost Auditory Co-Pilot (MVP Scaffold)

## What is Ghost?

Ghost is an AI-powered sales co-pilot that provides real-time coaching during live calls. It listens to conversations and delivers instant, whispered audio cues through headphones—undetectable to the customer. Sales reps get immediate guidance on objection handling, pricing strategies, and conversation pacing without breaking eye contact or losing focus.

**Key Features:**
- **Real-time coaching** - Sub-500ms response time for instant guidance
- **Undetectable** - Audio cues delivered only to the rep's headphones
- **Custom knowledge base** - Upload your playbooks, battlecards, and pricing guides
- **Works with any platform** - Zoom, Meet, Teams, and more
- **Session replay** - Review and analyze past coaching sessions

---

Low-cost implementation plan using React + Vite, Firebase (free tier), and a mock realtime pipeline. This repo currently includes:

1. **Frontend Shell** – React/Tailwind UI from the original prototype, now bootstrapped with Vite. Hooks (`useAudioMeter`, `useFirebaseAuth`, etc.) isolate platform logic.
2. **Service Layer** – Firebase Auth + Firestore scaffolding, plus a pluggable `GhostClient` that talks to the mock `/api/ghost-sim` stream (local middleware + Vercel API compatible).
3. **Data Persistence** – Knowledge Base uploader persists to Firestore (or falls back to local state if auth is unavailable). Session transcripts/suggestions write to `users/{uid}/sessions/{sessionId}` for later review.
4. **Real-Time Playback** – `useSessionPlayback` hook subscribes to Firestore collections via `onSnapshot`, making Firestore the source of truth. UI updates automatically as events stream in, enabling session replay and multi-device sync.
5. **Settings Persistence** – `useSettings` hook automatically saves/loads user preferences (mode, triggers, persona) to Firestore, syncing across devices.
6. **Enhanced Error Handling** – `GhostClient` includes automatic reconnection logic (exponential backoff, max 5 attempts), error callbacks, and graceful degradation.
7. **Electron Wrapper** – Desktop app structure ready (`electron/main.js`, `electron/preload.js`) for headphone-only audio routing. Run with `npm run electron:dev`.
8. **Backend API Scaffolding** – V2V webhook (`api/v2v-webhook.js`) and LLM processing (`api/llm-process.js`) endpoints ready for Vapi/Retell and Gemini/OpenAI integration.
9. **RAG Service Stub** – `ragService.js` provides embedding generation and Pinecone integration structure (ready for API keys).
10. **Operator Tools** – Knowledge Base modal, Realtime Parameters modal, and concierge-ready UI for beta onboarding.

## Getting Started

```bash
pnpm install      # or npm install
pnpm dev          # starts Vite on http://localhost:5173
pnpm build        # production build
pnpm electron:dev # run Electron app (dev mode)
pnpm electron     # run Electron app (production build)
pnpm electron:build # build distributable Electron app
```

### Environment Variables

Create `.env.local` with your service API keys:

**Required for MVP:**
```
# Firebase (for auth & persistence)
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
```

**Optional (for full features):**
```
# LLM Integration (backend - add to Vercel env vars)
GEMINI_API_KEY=""          # or OPENAI_API_KEY=""
PINECONE_API_KEY=""         # for RAG
HUGGINGFACE_API_KEY=""      # for embeddings (free tier available)

# V2V Integration (configure in Vapi/Retell dashboard)
VAPI_API_KEY=""             # or RETELL_API_KEY=""
```

### Mock Realtime Stream

- During local development the Vite dev server serves `/api/ghost-sim?mode=sales|interview|dating`, streaming newline-delimited JSON events to `GhostClient`.
- Deploying to Vercel (or any Node server) automatically picks up `api/ghost-sim.js`, so the same mock works in preview builds until you wire Vapi/Retell.

## Next Steps

1. **Wire V2V Integration** – Replace `/api/ghost-sim` with Vapi/Retell websocket. The webhook endpoint (`api/v2v-webhook.js`) is ready.
   - **Need a webhook URL?** See [`WEBHOOK_SETUP.md`](./WEBHOOK_SETUP.md) for options (Vercel, ngrok, etc.)
2. **Add LLM API Keys** – Configure `GEMINI_API_KEY` or `OPENAI_API_KEY` in Vercel env vars. The LLM endpoint (`api/llm-process.js`) is ready.
3. **Connect Pinecone** – Add `PINECONE_API_KEY` and implement vector storage in `ragService.js` (structure is ready).
4. **Implement Audio Routing** – Complete OS-level audio device selection in Electron (`electron/main.js` IPC handlers).
5. **Expand Auth** – Add email/password, magic links, invite codes beyond anonymous sessions.
6. **Payment Integration** – Add Stripe Checkout for LTD/subscription management.

## Architecture Notes

- **Frontend**: React + Vite (works in browser and Electron)
- **Backend**: Vercel serverless functions (`api/*.js`) or any Node.js server
- **Database**: Firebase Firestore (free tier sufficient for MVP)
- **Desktop**: Electron wrapper ready, audio routing TODO
- **Real-time**: Firestore listeners for session sync, V2V for audio streaming

This scaffold keeps infrastructure spend near zero while allowing rapid iteration toward the full Ghost MSP.

