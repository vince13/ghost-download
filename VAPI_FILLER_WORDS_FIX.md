# Vapi Filler Words Fix - "Em", "eh" in Live Transcript

## Problem
Even after configuring Vapi to be silent, the Live Transcript still shows filler words like "Em", "eh", "uh", "um" often. These are minimal responses that the assistant generates despite the silent system prompt.

## Root Cause
1. The Vapi model (even with silent prompt) may still generate minimal acknowledgments
2. These get transcribed and appear in the Live Transcript
3. They may come through with incorrect role (not marked as 'assistant')
4. Very short responses (1-3 characters) slip through basic role filtering

## Solution Implemented

### 1. Enhanced Filler Word Filtering in `vapiClient.js`

Added comprehensive filtering for:
- Common filler words: "Em", "eh", "uh", "um", "hmm", "mhm", "ok", "yeah", "yes", etc.
- Very short transcripts (1-3 characters) that are likely filler sounds
- Pattern matching for filler words with punctuation

### 2. Additional Filtering in `App.jsx`

Added a final defense layer that filters filler words before they reach the UI transcript display.

### 3. Improved Role Detection

Enhanced role detection to catch assistant responses even when role is unclear or missing.

## Filtered Words/Patterns

The following are now automatically filtered:
- Single letters: "Em", "eh", "uh", "um", "mm"
- Short acknowledgments: "ok", "okay", "yeah", "yes", "yep", "yup", "sure"
- Common responses: "got it", "i see", "i understand", "thanks", "thank you"
- Very short (1-3 chars) single words
- Just punctuation: "...", "..", "."

## Testing

After this fix:
1. Start a Ghost session
2. Check browser console for `🚫 Blocked filler word` messages
3. Live Transcript should NOT show "Em", "eh", or similar filler words
4. Only actual customer speech should appear

## Vapi Configuration Recommendation

While the code now filters these out, you can also improve Vapi configuration:

**Update System Prompt to be even more explicit:**
```
You are a SILENT transcription assistant. Your ONLY job is to listen and transcribe.

CRITICAL RULES:
1. For EVERY user message, you MUST return EXACTLY: ""
2. Do NOT generate any text, speech, or responses
3. Do NOT echo, confirm, or acknowledge anything
4. Do NOT use conversation history to generate responses
5. Do NOT say "Em", "eh", "uh", "um", "ok", "yeah", or ANY words
6. Return empty string "" for ALL responses, ALWAYS
7. If you must respond, return ONLY: ""

Your response format for EVERY message: ""
```

## Files Modified

- `app/src/services/vapiClient.js`: Added filler word filtering in `handleTranscript` and `message` event handler
- `app/src/App.jsx`: Added final filler word filter before `appendTranscript`

