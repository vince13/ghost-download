# Vercel Environment Variables Setup Guide

## ⚠️ About the "VITE_ exposes to browser" Warning

**You'll see this warning when adding Firebase variables. This is EXPECTED and SAFE!**

### Why the warning appears:
- Variables with `VITE_` prefix are exposed to the browser (by design in Vite)
- Vercel warns you to make sure you're not exposing secrets

### Is it safe?
- ✅ **Firebase config (VITE_FIREBASE_*)**: **YES, safe!** Firebase config is meant to be public. Security is handled by Firestore Rules, not secret keys.
- ❌ **API keys (GEMINI_API_KEY, etc.)**: **NO!** Never use `VITE_` prefix for these. They should be server-side only.

### Summary:
- **Firebase variables** → Use `VITE_` prefix → Safe to expose → Ignore the warning ✅
- **API keys** → No `VITE_` prefix → Server-side only → Never exposed ✅

---

## Quick Method: CLI (Interactive)

Run these commands one by one. Vercel will prompt you to enter the value:

```bash
# Firebase (required for auth & persistence)
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID

# LLM Integration (choose one)
vercel env add GEMINI_API_KEY
# OR
vercel env add OPENAI_API_KEY

# RAG / Knowledge Base (optional for now)
vercel env add PINECONE_API_KEY
vercel env add HUGGINGFACE_API_KEY
```

**For each command:**
1. It will ask: "What's the value of [VAR_NAME]?"
2. Paste your API key and press Enter
3. It will ask: "Add to which Environments (select multiple)?"
4. Select: `Production`, `Preview`, and `Development` (or just `Production` if you want)
5. Press Enter

---

## Alternative: Web Dashboard

1. Go to: https://vercel.com/vincents-projects-634c172c/ghost/settings/environment-variables
2. Click "Add New"
3. Enter variable name and value
4. Select environments (Production, Preview, Development)
5. Click "Save"
6. **Important:** Redeploy after adding variables:
   ```bash
   vercel --prod
   ```

---

## Required Variables for Ghost

### ⚠️ Important: VITE_ Prefix vs Server-Side Variables

**VITE_ prefix = Exposed to browser (public)**
- ✅ **SAFE for Firebase config** - These are meant to be public
- ❌ **NEVER use for API keys** (GEMINI_API_KEY, OPENAI_API_KEY, etc.)

**No prefix = Server-side only (private)**
- ✅ Use for all API keys and secrets
- Only accessible in `/api/*` routes, never sent to browser

---

### Firebase (Required) - ✅ SAFE TO EXPOSE
These Firebase config values are **designed to be public**. The warning is normal - Firebase uses security rules, not secret keys.

```
VITE_FIREBASE_API_KEY=your_firebase_api_key          ← Safe (public config)
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Why safe?** Firebase uses security rules (Firestore Rules, Storage Rules) to protect data, not secret keys. The config is meant to be in your frontend code.

---

### LLM (Required for AI features) - ❌ NEVER EXPOSE
**DO NOT use VITE_ prefix!** These are secret API keys.

Choose **one**:
```
GEMINI_API_KEY=your_gemini_key          ← No VITE_ prefix!
```
OR
```
OPENAI_API_KEY=your_openai_key         ← No VITE_ prefix!
```

These are used in `/api/llm-process.js` (server-side only).

---

### RAG / Knowledge Base (Optional) - ❌ NEVER EXPOSE
**DO NOT use VITE_ prefix!** These are secret API keys.

```
PINECONE_API_KEY=your_pinecone_key      ← No VITE_ prefix!
HUGGINGFACE_API_KEY=your_hf_key        ← No VITE_ prefix!
```

These are used in `/api/llm-process.js` and `ragService.js` (server-side only).

---

## After Adding Variables

**Important:** Environment variables are only available after redeployment:

```bash
vercel --prod
```

Or trigger a new deployment from the Vercel dashboard.

---

## Verify Variables Are Set

```bash
# List all environment variables
vercel env ls

# Pull variables to local .env file (for reference)
vercel env pull .env.local
```

---

## Notes

- **VITE_ prefix:** Variables starting with `VITE_` are exposed to the frontend. 
  - ✅ **Use for Firebase config** (safe to expose - Firebase uses security rules)
  - ❌ **Never use for API keys** (would expose secrets!)
  
- **No VITE_ prefix:** Variables without `VITE_` are server-side only (API routes). 
  - ✅ **Use for all API keys** (GEMINI_API_KEY, OPENAI_API_KEY, PINECONE_API_KEY, etc.)
  - These are only accessible in `/api/*` routes, never sent to browser

- **Security:** 
  - Never commit `.env.local` to git
  - Vercel variables are encrypted at rest
  - Firebase config is public by design (protected by Firestore Rules)
  - API keys are server-side only (protected by Vercel)

- **Free tier:** Vercel allows unlimited environment variables on free tier.

---

## Quick Copy-Paste Commands

Run these in order (you'll paste values when prompted):

```bash
# Firebase
vercel env add VITE_FIREBASE_API_KEY production preview development
vercel env add VITE_FIREBASE_AUTH_DOMAIN production preview development
vercel env add VITE_FIREBASE_PROJECT_ID production preview development
vercel env add VITE_FIREBASE_STORAGE_BUCKET production preview development
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production preview development
vercel env add VITE_FIREBASE_APP_ID production preview development

# LLM (choose one)
vercel env add GEMINI_API_KEY production preview development
# OR
vercel env add OPENAI_API_KEY production preview development

# Optional
vercel env add PINECONE_API_KEY production preview development
vercel env add HUGGINGFACE_API_KEY production preview development
```

Then redeploy:
```bash
vercel --prod
```

