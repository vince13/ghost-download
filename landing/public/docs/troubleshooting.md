# Ghost Protocol — Troubleshooting Guide

Use this quick reference to resolve the most common launch or runtime issues.

---

## 1. Blank Page or 404 at `/app`
**Cause:** Serving the Vite bundle from root paths  
**Fix:** Ensure `base: '/app/'` is set in `app/vite.config.js` (already done). Rebuild + redeploy.

---

## 2. Landing Page deploy fails (“src has to be package.json or next.config.js”)
**Cause:** Vercel build spec pointed to `next.config.ts`  
**Fix:** Set `src: "landing/package.json"` for the `@vercel/next` build in `vercel.json`.

---

## 3. `/app` loads but assets 404
**Symptoms:** Console shows `/assets/...` 404s  
**Fix:** After adding `base: '/app/'`, run `npm run build` inside `/app` and redeploy so the new relative paths are in `dist`.

---

## 4. Stripe checkout works locally but not on prod
**Checklist**
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` set in Vercel  
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (or equivalent) set for landing page if needed  
- `/api/stripe-webhook` deployed in `app/api` (serverless protected by Vercel secret)  
- Inspect logs via `vercel logs ghost --since 1h` for webhook errors

---

## 5. “Missing or insufficient permissions” (Firestore)
**Cause:** Rules not deployed or user doc missing  
**Fix:** `firebase deploy --only firestore:rules` using `FIRESTORE_RULES_DEPLOY.md` instructions.

---

## 6. Auth keeps reverting to Guest after refresh
- Ensure `browserLocalPersistence` is enabled (already in `services/firebase.js`)  
- Confirm Google sign-in domain is authorized in Firebase console  
- Check console for `auth/credential-already-in-use`; user guide explains fallback flow

---

## 7. KB uploads stuck at “chunking”
**Checklist**
- `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` configured  
- Embedding service keys (Jina, HuggingFace, OpenAI) set  
- Check Vercel logs for `/api/store-document` errors (`HOW_TO_CHECK_LOGS.md`)

---

## 8. LLM cues not appearing
- Verify `/api/process-transcript` returning `success:true`  
- Ensure `GROQ_API_KEY` or `GEMINI_API_KEY` (fallback OpenAI) set  
- Check `console` logs for `[App] Processing transcript` errors  
- Confirm callId is saved (via Firestore `calls/{callId}`)

---

## 9. Vapi assistant speaking aloud
- Webhook `/api/v2v-webhook` must return empty object for assistant messages  
- Frontend `vapiClient` should call `stopAssistantSpeech()` on assistant transcripts  
- If still talking, check Vapi dashboard to ensure `assistant_response=false`

---

## 10. Microphone access denied
- Browser must allow mic; if on Mac, enable under System Settings → Privacy & Security → Microphone  
- If no mic (e.g., Safari iOS restrictions), Ghost runs in “read-only” mode (transcripts from Vapi only)

---

## 11. Session replay empty
- Confirm user plan allows replays (entitlement gating)  
- Firestore path: `users/{uid}/sessions/{sessionId}` should exist with subcollections  
- If empty, check `sessionStore` logs for permission errors

---

## 12. “No embedding service available”
- Means neither Jina nor Hugging Face nor OpenAI keys are set / working  
- Add `JINA_API_KEY` (recommended) or `OPENAI_API_KEY`  
- Deploy again, re-upload doc to re-trigger indexing

---

## 13. Demo video placeholder remains
**Reminder:** Replace the placeholder in `landing/app/page.tsx` with an actual `<iframe>` once the “Inception Method” video is recorded.

---

## 14. Need logs fast
- `vercel logs ghost-green --since 10m`  
- Or open Vercel dashboard → Functions tab → pick the failing function

---

Still stuck?  
**Support:** support@ghostprotocol.ai  
**Sales/Enterprise:** sales@ghostprotocol.ai

