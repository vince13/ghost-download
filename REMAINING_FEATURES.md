# Ghost MVP - Remaining Features

## ✅ Completed Features
- [x] React/Tailwind UI with live transcript and suggestions panel
- [x] Firebase Authentication (anonymous sign-in)
- [x] Firestore persistence for sessions and KB metadata
- [x] Real-time Firestore listener for session playback
- [x] Mock backend stream (`/api/ghost-sim`) for development
- [x] Knowledge Base upload UI (frontend only)
- [x] Parameters modal (settings UI)
- [x] Audio visualization (Web Audio API meter)
- [x] Session management (start/stop, session IDs)

---

## 🔴 Critical MVP Features (Must-Have for Launch)

### 1. Real-Time Voice-to-Voice (V2V) Integration
**Priority: CRITICAL** | **Status: Not Started**

- [ ] Replace mock `/api/ghost-sim` with Vapi.ai or Retell AI integration
- [ ] Set up V2V agent endpoint with sub-500ms latency target
- [ ] Configure webhook/server to receive transcribed audio chunks
- [ ] Implement full-duplex audio streaming (user mic → AI → user headphones)
- [ ] Handle interruption logic (when user talks over AI)
- [ ] Voice Activity Detection (VAD) to avoid unnecessary processing

**Dependencies:** Vapi/Retell API key, backend server for webhooks

---

### 2. LLM Integration (Gemini/OpenAI)
**Priority: CRITICAL** | **Status: Not Started**

- [ ] Create backend API route to receive transcript chunks from V2V service
- [ ] Integrate Google Gemini 2.5 Flash API (or GPT-4o-mini fallback)
- [ ] Implement the Ghost system prompt (from CursorInstruction.md Section IV)
- [ ] Add keyword trigger detection (objections, competitors, pricing mentions)
- [ ] Generate concise 10-word coaching cues
- [ ] Return generated text to V2V service for TTS conversion
- [ ] Handle rate limiting and error fallbacks

**Dependencies:** Gemini API key (or OpenAI API key), backend server

---

### 3. Knowledge Base RAG Pipeline
**Priority: HIGH** | **Status: UI Only (No Backend)**

- [ ] Document chunking service (split PDFs/Markdown into semantic chunks)
- [ ] Embedding generation (use Hugging Face Inference API or local sentence-transformers)
- [ ] Pinecone integration (store vectors with user namespace)
- [ ] RAG retrieval logic (search Pinecone on incoming transcript)
- [ ] Inject retrieved context into Gemini prompt
- [ ] Update KB upload flow to trigger actual processing (not just metadata)

**Dependencies:** Pinecone API key, embedding model access

---

### 4. Electron Desktop Wrapper
**Priority: HIGH** | **Status: Not Started**

- [ ] Initialize Electron app shell (main process + renderer)
- [ ] Bundle React app into Electron window
- [ ] Configure build scripts for Mac/Windows
- [ ] Add auto-updater mechanism
- [ ] Handle app lifecycle (quit, minimize, tray icon)

**Dependencies:** Electron, electron-builder

---

### 5. Stealth Audio Routing (Headphone-Only Playback)
**Priority: CRITICAL** | **Status: Not Started**

- [ ] Implement OS-level audio device selection in Electron
- [ ] Capture user microphone input
- [ ] Route AI TTS output ONLY to headphones (not system output)
- [ ] Test with Zoom/Meet/Teams to ensure customer can't hear AI
- [ ] Add virtual audio cable setup instructions (BlackHole for Mac, VB-Cable for Windows)
- [ ] Fallback handling if audio routing fails

**Dependencies:** Electron native modules, OS audio APIs

---

## 🟡 Important Features (Post-MVP)

### 6. Enhanced Authentication
**Priority: MEDIUM** | **Status: Anonymous Only**

- [ ] Email/password authentication
- [ ] Magic link sign-in
- [ ] Invite code system for beta users
- [ ] User profile management
- [ ] Session history UI (list past sessions)

---

### 7. Payment Integration
**Priority: MEDIUM** | **Status: Not Started**

- [ ] Stripe Checkout integration
- [ ] Payment link generation for LTD offers
- [ ] Subscription management (monthly/annual)
- [ ] Usage quota enforcement (per user/plan)
- [ ] Payment webhook handlers

**Dependencies:** Stripe account

---

### 8. Session History & Replay
**Priority: MEDIUM** | **Status: Data Exists, No UI**

- [ ] Session list view (all past sessions)
- [ ] Session detail/replay page
- [ ] Search/filter sessions by date, mode, keywords
- [ ] Export transcripts (PDF, text)
- [ ] Analytics dashboard (objections detected, suggestions given)

---

### 9. Settings Persistence
**Priority: LOW** | **Status: UI Only**

- [ ] Save parameter settings to Firestore
- [ ] Load user preferences on app start
- [ ] Per-mode configurations
- [ ] Custom trigger keywords
- [ ] Voice persona selection

---

### 10. Error Handling & Resilience
**Priority: MEDIUM** | **Status: Basic**

- [ ] Network reconnection logic (if V2V stream drops)
- [ ] Graceful degradation (fallback to text-only mode if audio fails)
- [ ] Error boundaries in React components
- [ ] User-friendly error messages
- [ ] Retry logic for failed API calls
- [ ] Offline mode indicators

---

### 11. Production Readiness
**Priority: HIGH** | **Status: Not Started**

- [ ] Environment variable management (production vs dev)
- [ ] Code signing for Electron builds (Mac Developer ID, Windows cert)
- [ ] App notarization (macOS)
- [ ] Analytics integration (optional: PostHog, Mixpanel)
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Logging infrastructure
- [ ] Rate limiting on backend APIs
- [ ] Security audit (API key handling, data encryption)

---

## 🟢 Nice-to-Have Features

### 12. Advanced Features
- [ ] Multi-language support
- [ ] Custom voice selection for TTS
- [ ] Real-time sentiment analysis
- [ ] Call recording (with user consent)
- [ ] Team collaboration (shared KB, session sharing)
- [ ] Integration with CRM (Salesforce, HubSpot)
- [ ] Mobile app (React Native)
- [ ] Browser extension (for web-based calls)

---

## 📋 Implementation Priority Order

### Phase 1: Core MVP (Week 1-2)
1. Real-Time V2V Integration (#1)
2. LLM Integration (#2)
3. Stealth Audio Routing (#5) - if Electron is ready
4. Basic RAG Pipeline (#3) - simplified version

### Phase 2: Polish (Week 3)
5. Electron Desktop Wrapper (#4)
6. Enhanced Error Handling (#10)
7. Settings Persistence (#9)

### Phase 3: Launch Prep (Week 4)
8. Payment Integration (#7)
9. Session History UI (#8)
10. Production Readiness (#11)

### Phase 4: Growth (Post-Launch)
11. Enhanced Authentication (#6)
12. Advanced Features (#12)

---

## 🔧 Technical Debt / Code Quality

- [ ] Add TypeScript (currently all JS)
- [ ] Unit tests for critical hooks/services
- [ ] E2E tests for session flow
- [ ] Performance optimization (bundle size, render optimization)
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Documentation (API docs, deployment guide)

---

## 📝 Notes

- **Current State:** Frontend is ~80% complete, backend is ~10% complete
- **Biggest Gaps:** V2V integration, LLM backend, RAG pipeline, Electron wrapper
- **Estimated Time to MVP:** 2-3 weeks with focused development
- **Cost Considerations:** Vapi/Retell minutes, Gemini API calls, Pinecone storage will incur costs once integrated

