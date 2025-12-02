# Vapi.ai Integration Guide

## Step 1: Sign Up for Vapi.ai

1. Go to [vapi.ai](https://vapi.ai)
2. Sign up for an account (free tier available)
3. Verify your email if required

## Step 2: Get Your API Keys and Assistant ID

Vapi has **two types of API keys** - you'll need both:

1. **Get Private API Key (for backend/webhook):**
   - Go to your Vapi.ai dashboard
   - Navigate to **Settings** → **API Keys**
   - In the **"Private API Keys"** section, click **"Add Key"** or copy your existing private key
   - Click the eye icon to reveal the key, then copy it
   - **This is for server-side use** (your webhook endpoint)
   - Save this key - you'll add it to Vercel as `VAPI_API_KEY` (no VITE_ prefix)

2. **Get Public API Key (for frontend/WebSocket):**
   - In the same **API Keys** page
   - In the **"Public API Keys"** section, click **"Add Key"** or copy your existing public key
   - Click the eye icon to reveal the key, then copy it
   - **This is for client-side use** (your Ghost app WebSocket connection)
   - Save this key - you'll add it to Vercel as `VITE_VAPI_API_KEY` (with VITE_ prefix)

3. **Get Assistant ID:**
   - After creating your assistant (Step 4), go to **Assistants** in the dashboard
   - Click on your assistant
   - The Assistant ID is in the URL or in the assistant details
   - Example: `https://dashboard.vapi.ai/assistant/abc123xyz` → ID is `abc123xyz`
   - Save this ID - you'll add it to Vercel as `VITE_VAPI_ASSISTANT_ID` (with VITE_ prefix)

## Step 3: Create a Phone Number (Optional)

If you want to test with phone calls:
1. Go to **Phone Numbers** in the dashboard
2. Purchase a number (or use the free trial number if available)
3. Note the phone number

## Step 4: Create Your Agent

1. Go to **Agents** in the dashboard
2. Click **"Create Agent"** or **"New Agent"**

### Agent Configuration:

**Basic Settings:**
- **Name**: "Ghost Protocol Assistant"
- **First Message**: "Hello, how can I help you today?" (or customize)
- **Model**: Choose GPT-4 or GPT-3.5 (GPT-4 recommended for better quality)

**⚠️ CRITICAL: System Prompt Configuration**
To prevent Vapi from generating long responses, set a minimal system prompt:

```
You are a silent transcription assistant. Your only job is to listen and transcribe the conversation. Do not generate responses. Keep all responses to a maximum of 5 words. Only acknowledge with "I understand" or "Got it" when necessary.
```

**OR** set the system prompt to:
```
You are a passive listener. Transcribe what you hear. Do not provide advice or explanations. Keep responses extremely brief (1-3 words maximum).
```

This prevents Vapi from speaking long responses - Ghost will handle the coaching cues separately.

**Voice Settings:**
- **Voice**: Choose a voice (e.g., "Sarah", "Michael", "Nova")
- **Voice Speed**: 1.0 (normal)
- **Voice Temperature**: 0.7

**Advanced Settings:**
- **Interruption Threshold**: 0.5 (allows natural conversation flow)
- **Max Duration**: 600 seconds (10 minutes)
- **Language**: English (US)

## Step 5: Configure the Webhook

This is the critical part - connecting Vapi to your Ghost backend.

1. In your **Assistant** settings (not Agent - Vapi uses "Assistant" terminology):
   - Click on the **Advanced** tab
   - Scroll down to the **Server** section
   - Find the **Server URL** field

2. Enter your Ghost webhook URL:
   ```
   https://ghost-m5zoa97be-vincents-projects-634c172c.vercel.app/api/v2v-webhook
   ```
   *(Replace with your latest Vercel URL if it changed - run `vercel --prod` to get current URL)*

3. **Enable Server Messages** (optional but recommended):
   - Enable `end-of-call-report` if you want call summaries
   - Enable `function-call` if using function calling
   - Enable `status-update` for call status changes

4. **Save Changes** - Click the save button

**Alternative Methods if Server URL field is missing:**

**Option A: Via Functions (Function Calling)**
1. Go to **Functions** tab in your assistant
2. Create a new function (e.g., "provideCoaching")
3. Set the function's server URL to your webhook
4. Vapi will call this function when triggered

**Option B: Via API (Programmatic Setup)**
If the UI doesn't show the field, you can set it via API:
```bash
curl -X PATCH https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "serverUrl": "https://ghost-m5zoa97be-vincents-projects-634c172c.vercel.app/api/v2v-webhook"
  }'
```

**Option C: Check Different Sections**
- Look in **Settings** → **Integrations**
- Check **Workflows** tab
- Look for **"External API"** or **"Custom Endpoint"**

**Still can't find it?**
- Vapi's UI may have changed - check their latest docs: https://docs.vapi.ai/server-url
- Contact Vapi support or check their Discord community
- The feature might be in beta - check if you need to enable it in account settings

## Step 6: Add Environment Variables to Vercel

Your webhook endpoint needs API keys to process requests, and your frontend needs Vapi credentials to connect:

### Backend Environment Variables (for webhook - server-side):
```bash
# LLM API Key (for generating coaching cues)
vercel env add GEMINI_API_KEY production
# OR
vercel env add OPENAI_API_KEY production

# Optional (for RAG)
vercel env add PINECONE_API_KEY production

# Optional: Vapi Private API Key (only needed if you want to create calls programmatically)
# vercel env add VAPI_API_KEY production
# When prompted, paste your PRIVATE API KEY
```

**Note:** The webhook endpoint doesn't need the Vapi private key - it just receives webhooks from Vapi. You only need the private key if you want to make API calls TO Vapi (e.g., creating calls from your backend).

### Frontend Environment Variables (for Vapi WebSocket - client-side):
```bash
# Vapi Public API Key (from Step 2 - Public API Keys section)
vercel env add VITE_VAPI_API_KEY production
# When prompted, paste your PUBLIC API KEY

# Vapi Assistant ID (from Step 2)
vercel env add VITE_VAPI_ASSISTANT_ID production
# When prompted, paste your Assistant ID
```

**Important Notes:**
- **Private Key** (`VAPI_API_KEY`): Only needed if you want to create calls programmatically from your backend (optional)
- **Public Key** (`VITE_VAPI_API_KEY`): Used in Ghost app WebSocket connection (exposed to browser) - **REQUIRED for WebSocket**
- The `VITE_` prefix makes variables available to the browser
- Public keys are safe to expose - they're designed for client-side use
- The webhook endpoint doesn't need Vapi keys - it just receives webhooks from Vapi

Then redeploy:
```bash
vercel --prod
```

## Step 7: Test the Integration

### Option A: Test via Phone Call
1. In Vapi dashboard, go to your agent
2. Click **"Call"** or use the test phone number
3. Make a call and speak
4. Check your Ghost app - you should see transcriptions and suggestions

### Option B: Test via API
1. In Vapi dashboard, go to **API** or **Testing**
2. Use the test interface to send a message
3. Watch your Ghost app for events

### Option C: Test the Webhook Directly
```bash
curl -X POST https://ghost-qhuru71e6-vincents-projects-634c172c.vercel.app/api/v2v-webhook \
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

## Step 8: Replace Mock Stream with Real Vapi Connection

The Ghost app now automatically uses Vapi when environment variables are set!

### Two Integration Approaches:

**Option A: Webhook + Firestore (Recommended - Already Working!)**
- ✅ **Simplest and most reliable**
- Vapi webhook → Your backend → Firestore → Ghost app (real-time listener)
- Already implemented via `useSessionPlayback` hook
- Works for phone calls and any Vapi call type
- **No additional setup needed** - just configure the webhook (Step 5)

**Option B: Direct WebSocket (Lower Latency)**
- Ghost app connects directly to Vapi WebSocket
- Real-time events without Firestore round-trip
- Requires `VITE_VAPI_API_KEY` and `VITE_VAPI_ASSISTANT_ID` environment variables
- May need adjustment based on Vapi's actual WebSocket API format

### How It Works:

**Automatic Detection:**
- If `VITE_VAPI_API_KEY` and `VITE_VAPI_ASSISTANT_ID` are set, Ghost will try WebSocket
- If not set, Ghost uses webhook + Firestore (Option A)
- If WebSocket fails, Ghost falls back to mock stream

### Setup:

1. **Add environment variables** (from Step 6):
   ```bash
   vercel env add VITE_VAPI_API_KEY production
   vercel env add VITE_VAPI_ASSISTANT_ID production
   ```

2. **Redeploy:**
   ```bash
   vercel --prod
   ```

3. **Test:**
   - Open your Ghost app
   - Start a session
   - The app will automatically use Vapi if credentials are available
   - Check browser console for "Vapi WebSocket connected" message

### Code Structure:

- `src/services/vapiClient.js` - Vapi WebSocket client
- `src/services/ghostClient.js` - Smart client that auto-detects Vapi or mock
- `App.jsx` - Uses `GhostClient` which handles both modes

### Switching Between Modes:

- **Use Vapi:** Set `VITE_VAPI_API_KEY` and `VITE_VAPI_ASSISTANT_ID`
- **Use Mock:** Remove or don't set those variables

The app will automatically choose the right mode!

## Step 9: Configure Vapi Payload Format

Vapi sends webhook events in a specific format. You may need to update `api/v2v-webhook.js` to match Vapi's actual payload structure.

**Common Vapi Webhook Events:**
- `function-call` - When a function is called
- `status-update` - Call status changes
- `transcript` - Speech transcription
- `hang` - Call ended

Check Vapi's webhook documentation for the exact format: https://docs.vapi.ai/api-reference/webhooks

## Step 10: Monitor and Debug

1. **Vapi Dashboard**: Check call logs and webhook responses
2. **Vercel Logs**: 
   ```bash
   vercel logs --follow
   ```
3. **Browser Console**: Check for errors in your Ghost app

## Troubleshooting

### Webhook Not Receiving Events
- Check Vercel deployment is live
- Verify webhook URL in Vapi dashboard
- Check Vercel function logs: `vercel logs`

### No AI Responses
- Verify `GEMINI_API_KEY` or `OPENAI_API_KEY` is set in Vercel
- Check `api/llm-process.js` logs
- Test LLM endpoint directly

### Transcription Not Working
- Vapi handles transcription automatically
- Check Vapi dashboard for transcript quality
- Verify webhook is receiving transcript events

### Vapi Speaking Long Responses (Not Using Coaching Cues)
**Problem:** Vapi generates its own long responses instead of using your short coaching cues.

**Solution:**
1. **Update System Prompt** (in Assistant settings):
   - Set to: "You are a silent transcription assistant. Transcribe conversations only. Keep all responses to 1-3 words maximum. Do not provide advice or explanations."
   
2. **Disable Response Generation**:
   - In Advanced settings, look for "Response Mode" or "Response Generation"
   - Set to "Minimal" or "Transcription Only"
   
3. **Check Webhook Response**:
   - Your webhook returns empty `{}` - this is correct
   - Vapi should continue with minimal responses
   - Coaching cues are logged in Vercel logs (for now)
   
4. **Future Enhancement**:
   - Set up real-time delivery of coaching cues to Ghost app
   - Use WebSocket or Firestore real-time listeners
   - Deliver cues to user's headphones via Electron TTS

## Cost Considerations

- **Vapi**: ~$0.05/min + external API costs
- **Gemini API**: Free tier available, then pay-as-you-go
- **OpenAI**: Pay-as-you-go (GPT-4o-mini is cheaper)

For testing, Vapi's free tier should be sufficient.

## Next Steps

1. ✅ Sign up for Vapi.ai
2. ✅ Create agent and configure webhook
3. ✅ Add API keys to Vercel
4. ✅ Test with a phone call
5. ✅ Monitor logs and refine

Once working, you'll have:
- Real-time transcription from Vapi
- AI coaching cues from your LLM
- Full conversation flow in Ghost app

---

## Quick Reference

**Your Webhook URL:**
```
https://ghost-qhuru71e6-vincents-projects-634c172c.vercel.app/api/v2v-webhook
```

**Vapi Dashboard:**
- https://dashboard.vapi.ai

**Vapi Docs:**
- https://docs.vapi.ai

**Update Vercel URL if needed:**
```bash
vercel --prod
# Copy the new URL and update in Vapi dashboard
```
STRIPE_STARTER_PRICE_ID_MONTHLY="price_1SZ2nrJ7zMV3hdhRcO0gZtZl"
STRIPE_STARTER_PRICE_ID_YEARLY="price_1SZ2nrJ7zMV3hdhRwzSPzTv9"
STRIPE_FOUNDER_PRICE_ID=price_1SZ2k3J7zMV3hdhRjPPGsc2R
