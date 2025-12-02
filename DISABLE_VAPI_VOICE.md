# How to Disable Voice in Vapi Assistant

## Method 1: Via Vapi Dashboard (UI)

### Step 1: Access Your Assistant
1. Go to [Vapi Dashboard](https://dashboard.vapi.ai)
2. Navigate to **Assistants** (left sidebar)
3. Click on **"Ghost Protocol Assistant"** (or your assistant name)

### Step 2: Find Voice Settings
The voice setting can be in different places depending on Vapi's UI version:

**Option A: Voice Tab/Section**
- Look for a **"Voice"** tab or section
- You should see voice provider settings (e.g., "Vapi", "ElevenLabs", "PlayHT")
- **Action**: Click **"Remove"** or **"Disable"** button
- OR set the voice provider dropdown to **"None"** or **"Disabled"**

**Option B: Settings Tab**
- Click on **"Settings"** tab
- Scroll down to find **"Voice"** or **"Speech"** section
- Look for voice configuration options
- **Action**: Remove the voice configuration or set to disabled

**Option C: Advanced/Configuration Tab**
- Click on **"Advanced"** or **"Configuration"** tab
- Look for voice-related settings
- **Action**: Remove or disable voice settings

**Option D: JSON Editor (Most Reliable)**
- Look for a **"JSON"**, **"Code"**, or **"Raw Config"** button/tab
- Click it to see the raw assistant configuration
- Find the `"voice"` block in the JSON
- **Action**: Either:
  - Delete the entire `"voice": { ... }` block
  - OR change it to: `"voice": null`
  - OR comment it out: `// "voice": { ... }`

### Step 3: Save Changes
- Click **"Save"** or **"Update"** button
- Wait for confirmation that changes are saved

---

## Method 2: Via Vapi API (Recommended if UI doesn't work)

If you can't find the voice setting in the UI, use the API directly:

### Step 1: Get Your Assistant ID
1. In Vapi Dashboard → Assistants → Click your assistant
2. The Assistant ID is in the URL: `https://dashboard.vapi.ai/assistant/abc123xyz`
   - The ID is `abc123xyz` (the part after `/assistant/`)
3. Or check the assistant details page for the ID

### Step 2: Get Your Private API Key
1. Go to **Settings** → **API Keys**
2. Copy your **Private API Key** (not Public)
3. This is the key that starts with something like `sk-...` or `pk-...`

### Step 3: Update Assistant via API

Run this command in your terminal (replace with your actual values):

```bash
curl -X PATCH https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID \
  -H "Authorization: Bearer YOUR_PRIVATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "voice": null
  }'
```

**Example:**
```bash
curl -X PATCH https://api.vapi.ai/assistant/fe755d37-3f00-49f8-8627-9c5d713e0aa9 \
  -H "Authorization: Bearer sk-abc123xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "voice": null
  }'
```

### Step 4: Verify the Change

Check if the voice was removed:

```bash
curl -X GET https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID \
  -H "Authorization: Bearer YOUR_PRIVATE_API_KEY"
```

Look for `"voice": null` in the response.

---

## Method 3: Complete Assistant Update (Full JSON)

If you want to update multiple settings at once, send the full assistant config:

```bash
curl -X PATCH https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID \
  -H "Authorization: Bearer YOUR_PRIVATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ghost Protocol Assistant",
    "model": {
      "provider": "google",
      "model": "gemini-2.5-flash",
      "messages": [
        {
          "role": "system",
          "content": "You are a SILENT transcription assistant. Your ONLY job is to listen and transcribe. Return empty string \"\" for ALL responses, ALWAYS."
        }
      ]
    },
    "transcriber": {
      "provider": "deepgram",
      "model": "nova-2",
      "language": "en"
    },
    "voice": null,
    "firstMessage": "",
    "voicemailMessage": "",
    "endCallMessage": ""
  }'
```

---

## Method 4: Using Node.js Script

Create a file `disable-voice.js`:

```javascript
const fetch = require('node-fetch'); // or use native fetch in Node 18+

const ASSISTANT_ID = 'YOUR_ASSISTANT_ID'; // Replace with your assistant ID
const PRIVATE_API_KEY = 'YOUR_PRIVATE_API_KEY'; // Replace with your private key

async function disableVoice() {
  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        voice: null
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Voice disabled successfully!');
      console.log('Assistant config:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Error:', data);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

disableVoice();
```

Run it:
```bash
node disable-voice.js
```

---

## Verification Checklist

After disabling voice, verify:

1. ✅ **Check Assistant Config**: The `voice` field should be `null` or missing
2. ✅ **Test a Call**: Start a Vapi call - the assistant should NOT speak
3. ✅ **Check Logs**: In Vapi Dashboard → Calls → View a call
   - You should see transcripts but NO audio output from assistant
4. ✅ **Check Webhook Logs**: Your webhook should receive events but assistant should remain silent

---

## Troubleshooting

**Problem: "voice field is required" error**
- Some Vapi versions require `voice` to be present
- Try setting it to an empty object: `"voice": {}`
- Or use a minimal voice config: `"voice": { "provider": "vapi", "voiceId": "" }`

**Problem: Assistant still speaks after removing voice**
- Clear browser cache and refresh
- Wait a few minutes for changes to propagate
- Check if there's a cached assistant config
- Verify the webhook is returning empty responses

**Problem: Can't find voice setting in UI**
- Vapi's UI may have changed
- Use Method 2 (API) instead - it's more reliable
- Check Vapi's latest docs: https://docs.vapi.ai/customization/speech-configuration

**Problem: API returns 401/403 error**
- Make sure you're using the **Private API Key** (not Public)
- Check that the API key has permission to update assistants
- Verify the Assistant ID is correct

---

## Quick Reference

**Your Assistant ID**: Check Vapi Dashboard → Assistants → Your Assistant → URL or details page

**Your Private API Key**: Vapi Dashboard → Settings → API Keys → Private Keys section

**API Endpoint**: `PATCH https://api.vapi.ai/assistant/{ASSISTANT_ID}`

**Request Body**: `{ "voice": null }`

