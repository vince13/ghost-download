# Webhook URL Setup Guide

Since you don't have a custom domain yet, here are your options for getting a webhook URL that Vapi.ai can call:

## Option 1: Vercel (Recommended - Free & Fast)

**Best for:** Production-ready deployment, free SSL, automatic deployments

### Steps:

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```
   Follow the prompts. Vercel will give you a URL like:
   ```
   https://ghost-app-abc123.vercel.app
   ```

3. **Set Environment Variables:**
   ```bash
   vercel env add GEMINI_API_KEY
   vercel env add PINECONE_API_KEY
   vercel env add FIREBASE_API_KEY
   # ... etc
   ```

4. **Your Webhook URL:**
   ```
   https://ghost-app-abc123.vercel.app/api/v2v-webhook
   ```

5. **Configure in Vapi.ai Dashboard:**
   - Go to your Vapi agent settings
   - Set Webhook URL to the URL above
   - Save

**Pros:**
- ✅ Free forever (with limits)
- ✅ Automatic SSL/HTTPS
- ✅ Serverless (scales automatically)
- ✅ Can add custom domain later
- ✅ Already configured (`vercel.json` exists)

**Cons:**
- ⚠️ Cold starts on first request (usually <1s)
- ⚠️ Free tier has usage limits

---

## Option 2: ngrok (For Local Development)

**Best for:** Testing locally before deploying

### Steps:

1. **Install ngrok:**
   ```bash
   # Mac
   brew install ngrok
   
   # Or download from https://ngrok.com
   ```

2. **Start your local dev server:**
   ```bash
   npm run dev
   # Runs on http://localhost:5173
   ```

3. **Create tunnel:**
   ```bash
   ngrok http 5173
   ```

4. **You'll get a URL like:**
   ```
   https://abc123.ngrok.io
   ```

5. **Your Webhook URL:**
   ```
   https://abc123.ngrok.io/api/v2v-webhook
   ```

**Note:** You'll need to update Vapi's webhook URL each time you restart ngrok (URL changes on free tier).

**Pros:**
- ✅ Instant local testing
- ✅ Free tier available
- ✅ No deployment needed

**Cons:**
- ⚠️ URL changes on free tier (unless you pay)
- ⚠️ Not suitable for production
- ⚠️ Requires local machine to be running

---

## Option 3: Cloudflare Tunnel (Free, Persistent)

**Best for:** Free persistent tunnel without URL changes

### Steps:

1. **Install cloudflared:**
   ```bash
   brew install cloudflared
   ```

2. **Create tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```

3. **You'll get a persistent URL:**
   ```
   https://abc123.trycloudflare.com
   ```

**Pros:**
- ✅ Free
- ✅ Persistent URL (doesn't change)
- ✅ No account needed

**Cons:**
- ⚠️ Still requires local machine running
- ⚠️ Not for production

---

## Option 4: Railway / Render (Free Tier)

**Best for:** Full server deployment without custom domain

### Railway:

1. Sign up at [railway.app](https://railway.app)
2. Connect GitHub repo
3. Deploy automatically
4. Get URL: `https://ghost-app.up.railway.app`

### Render:

1. Sign up at [render.com](https://render.com)
2. Create new Web Service
3. Connect repo
4. Get URL: `https://ghost-app.onrender.com`

**Pros:**
- ✅ Free tier available
- ✅ Persistent URLs
- ✅ Can add custom domain later

**Cons:**
- ⚠️ Free tier has limitations (sleeps after inactivity)
- ⚠️ Slightly more setup than Vercel

---

## Recommended Workflow

### Phase 1: Local Testing (Now)
1. Use **ngrok** or **Cloudflare Tunnel** to test webhook locally
2. Verify Vapi.ai can reach your endpoint
3. Test the full flow (Vapi → webhook → LLM → response)

### Phase 2: Quick Deployment (This Week)
1. Deploy to **Vercel** (takes 5 minutes)
2. Get permanent webhook URL
3. Configure in Vapi.ai dashboard
4. Start beta testing

### Phase 3: Custom Domain (Later)
1. Buy domain (Namecheap, Cloudflare, etc.)
2. Add to Vercel project
3. Update Vapi webhook URL
4. Done!

---

## Testing Your Webhook

Once you have a URL, test it:

```bash
curl -X POST https://your-webhook-url.com/api/v2v-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "transcript",
    "text": "The price seems too high",
    "sessionId": "test-123",
    "userId": "test-user"
  }'
```

You should get a response like:
```json
{
  "action": "interrupt",
  "text": "Ask: What would make this a no-brainer?",
  "voice": "calm"
}
```

---

## Environment Variables for Production

When deploying to Vercel/Railway/etc., add these env vars:

```
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here (fallback)
PINECONE_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here
FIREBASE_API_KEY=your_key_here
FIREBASE_PROJECT_ID=your_project_id
# ... etc
```

**Never commit these to git!** Use the platform's environment variable settings.

---

## Quick Start: Deploy to Vercel Now

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Add env vars
vercel env add GEMINI_API_KEY
# (repeat for each env var)

# 5. Redeploy with env vars
vercel --prod
```

You'll have a webhook URL in under 5 minutes! 🚀

