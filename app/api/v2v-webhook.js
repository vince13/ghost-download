/**
 * Webhook endpoint for Vapi.ai to call when audio events occur.
 * This receives transcribed text and triggers our LLM processing.
 * 
 * Vapi sends webhooks in this format:
 * {
 *   "message": {
 *     "type": "transcript",
 *     "transcript": "Customer said: The price seems too high",
 *     ...
 *   },
 *   "call": {
 *     "id": "call-id",
 *     ...
 *   }
 * }
 */
import { getAdminDb } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log incoming webhook for debugging
  console.log('Vapi webhook received:', JSON.stringify(req.body, null, 2));

  // CRITICAL: Always return empty response to prevent Vapi from speaking
  // This webhook is ONLY for saving transcripts and generating coaching cues
  // The assistant must remain completely silent
  const returnEmptyResponse = () => {
    // Return explicit empty response - this prevents Vapi from generating any speech
    return res.status(200).json({});
  };

  // Handle Vapi's webhook format
  const body = req.body;
  
  // CRITICAL: Check message type FIRST before processing anything
  // This prevents assistant speech at the source
  const messageType = body.message?.type || body.type;
  const role = body.message?.role || body.role;
  
  // Intercept ALL message types that could trigger assistant speech
  const assistantMessageTypes = [
    'assistant-message',
    'function-call',
    'model-output', // LLM generating text (will become speech) - CRITICAL
    'voice-input', // TTS input (will become speech) - CRITICAL
    'speech-update', // Speech start/stop events (especially when role is assistant)
    'conversation-update', // May contain assistant responses
    'assistant.started', // Assistant initialization
    'status-update' // May contain assistant status
  ];
  
  // Check if this is an assistant response attempt
  // CRITICAL: Also check speech-update events when role is assistant
  const isAssistantResponse = 
    role === 'assistant' || 
    role === 'bot' ||
    messageType === 'assistant-message' || 
    messageType === 'function-call' ||
    (messageType === 'speech-update' && (role === 'assistant' || body.role === 'assistant')) ||
    assistantMessageTypes.includes(messageType) ||
    (body.message && body.message.role === 'assistant') ||
    (body.conversation && Array.isArray(body.conversation) && body.conversation.some(msg => {
      // Check if conversation contains assistant messages with non-empty content
      const msgRole = msg.role || msg.message?.role;
      const msgContent = msg.content || msg.message || msg.text || '';
      return (msgRole === 'assistant' || msgRole === 'bot') && msgContent && msgContent.trim() !== '' && msgContent.trim() !== '""';
    })) ||
    (body.messages && Array.isArray(body.messages) && body.messages.some(msg => {
      // Check messages array for assistant speech
      const msgRole = msg.role || msg.message?.role;
      return msgRole === 'assistant' || msgRole === 'bot';
    })) ||
    (body.output && body.output !== '""' && body.output.trim() !== '') || // LLM generated non-empty output
    (body.input && body.input !== '""' && body.input.trim() !== ''); // Voice input is non-empty
  
  if (isAssistantResponse) {
    console.log('⚠️ Assistant response intercepted - returning empty to prevent speech:', { 
      role, 
      messageType, 
      status: body.status,
      hasConversation: !!body.conversation,
      conversationLength: body.conversation?.length,
      bodyKeys: Object.keys(body) 
    });
    return returnEmptyResponse();
  }
  
  // Now extract text and callId for user transcripts only
  let text, callId;
  
  // Vapi format 1: nested message object
  if (body.message) {
    text = body.message.transcript || body.message.text || body.message.content;
    callId = body.call?.id || body.callId;
  } 
  // Vapi format 2: flat structure
  else {
    text = body.transcript || body.text || body.content;
    callId = body.callId || body.call?.id;
  }

  console.log('Extracted:', { text, callId, role, messageType });

  if (!text || !callId) {
    // No transcript or callId - just acknowledge with empty response
    console.log('No transcript or callId found, returning empty response...');
    return returnEmptyResponse();
  }

  try {
    const db = getAdminDb();
    
    if (!db) {
      console.error('Firebase Admin DB not initialized. Check FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT env vars.');
      // Still return 200 to Vapi so it doesn't retry
      return res.status(200).json({ error: 'Firebase Admin not configured' });
    }
    
    // Save transcript to Firestore (always save, not just when triggers detected)
    // Save to calls/{callId}/transcripts so frontend can listen using the callId
    try {
      const transcriptRef = db.collection('calls').doc(callId).collection('transcripts');
      await transcriptRef.add({
        text,
        role,
        speaker: role === 'user' ? 'Them' : 'You', // 'Them' = customer, 'You' = Ghost user
        timestamp: new Date(),
        createdAt: new Date()
      });
      console.log('✅ Transcript saved to Firestore:', { callId, text: text.substring(0, 50) });
    } catch (firestoreError) {
      console.error('❌ Failed to save transcript to Firestore:', firestoreError);
      // Continue even if Firestore save fails
    }

    // Check for trigger keywords (objections, competitors, pricing)
    const triggers = detectTriggers(text);
    
    if (triggers.detected) {
      // Call LLM processing endpoint to generate coaching cue
      const baseUrl = req.headers.origin || 
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
      const llmResponse = await processWithLLM({
        text,
        triggers,
        callId
      }, baseUrl);

      // Save coaching cue to Firestore
      try {
        const suggestionsRef = db.collection('calls').doc(callId).collection('suggestions');
        await suggestionsRef.add({
          text: llmResponse.coachingCue || llmResponse.suggestion || 'Coaching cue generated',
          type: 'suggestion',
          trigger: triggers,
          originalText: text,
          timestamp: new Date(),
          createdAt: new Date()
        });
        console.log('Coaching cue saved to Firestore:', { callId, cue: llmResponse.coachingCue?.substring(0, 50) });
      } catch (firestoreError) {
        console.error('Failed to save coaching cue to Firestore:', firestoreError);
      }

      console.log('=== COACHING CUE (for user headphones only) ===');
      console.log('Call ID:', callId);
      console.log('Cue:', llmResponse.coachingCue);
      console.log('Original text:', text);
      console.log('===============================================');
    }
    
    // Return empty response - Vapi should NOT speak the coaching cue
    // The cue is for the user's headphones only, not for the customer to hear
    return returnEmptyResponse();
  } catch (error) {
    console.error('V2V webhook error:', error);
    // Even on error, return empty to prevent any speech
    return res.status(200).json({});
  }
}

function detectTriggers(text) {
  const lowerText = text.toLowerCase();
  
  // More lenient trigger detection for testing
  const objectionKeywords = ['expensive', 'price', 'cost', 'budget', 'afford', 'cheaper', 'high', 'pricing'];
  const competitorKeywords = ['competitor', 'alternative', 'other vendor', 'pendo', 'gong', 'chorus', 'competition'];
  const timelineKeywords = ['timeline', 'when', 'deadline', 'urgent', 'asap', 'time', 'soon'];
  
  const detected = {
    objection: objectionKeywords.some(kw => lowerText.includes(kw)),
    competitor: competitorKeywords.some(kw => lowerText.includes(kw)),
    timeline: timelineKeywords.some(kw => lowerText.includes(kw))
  };

  const hasTrigger = detected.objection || detected.competitor || detected.timeline;
  
  console.log('Trigger detection:', { text: text.substring(0, 50), detected, hasTrigger });
  
  return {
    detected: hasTrigger,
    ...detected
  };
}

async function processWithLLM({ text, triggers, callId }, baseUrl) {
  // Use process-transcript endpoint instead of deprecated llm-process
  // In Vercel: use VERCEL_URL env var, otherwise use provided baseUrl or localhost
  const llmUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/process-transcript`
    : baseUrl 
    ? `${baseUrl}/api/process-transcript`
    : 'http://localhost:5173/api/process-transcript';
  
  console.log('Calling LLM endpoint:', llmUrl);
  console.log('LLM request payload:', { text, triggers, callId });
  
  const response = await fetch(llmUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, triggers, callId })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LLM processing failed:', response.status, errorText);
    throw new Error(`LLM processing failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('LLM response:', result);
  return result;
}

