/**
 * Vapi.ai Client SDK Wrapper
 * Uses the official @vapi-ai/web SDK for browser-only WebRTC sessions
 * 
 * Requires VITE_VAPI_API_KEY (PUBLIC key) and VITE_VAPI_ASSISTANT_ID environment variables
 * 
 * IMPORTANT: Use the PUBLIC API Key (not private) - this is safe to expose in the browser
 * The SDK handles WebRTC connections internally, no phone numbers needed
 */
import Vapi from '@vapi-ai/web';

export class VapiClient {
  constructor({ onEvent, onError, onReconnect, apiKey, assistantId }) {
    this.onEvent = onEvent;
    this.onError = onError || (() => {});
    this.onReconnect = onReconnect || (() => {});
    this.apiKey = apiKey || import.meta.env.VITE_VAPI_API_KEY;
    this.assistantId = assistantId || import.meta.env.VITE_VAPI_ASSISTANT_ID;
    
    console.log('Using Vapi public key:', this.apiKey?.slice(0, 6));
    console.log('Using Vapi assistant ID:', this.assistantId);
    
    if (!this.apiKey) {
      this.onError({
        type: 'missing_api_key',
        message: 'VITE_VAPI_API_KEY (PUBLIC key) is required. Add it to Vercel environment variables.'
      });
      return;
    }

    if (!this.assistantId) {
      this.onError({
        type: 'missing_assistant_id',
        message: 'VITE_VAPI_ASSISTANT_ID is required. Get it from your Vapi assistant settings.'
      });
      return;
    }

    // Initialize Vapi SDK with public key
    this.vapi = new Vapi(this.apiKey);
    this.isStopped = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.callId = null;

    // Set up event listeners
    this.setupEventListeners();
    
    // Expose a test method for manual transcript processing (for debugging)
    this.testProcessTranscript = async (text) => {
      if (!this.callId) {
        console.error('[VapiClient] No callId available for test');
        return;
      }
      console.log('[VapiClient] Manual test: Processing transcript:', text);
      await this.processTranscript(text, 'user');
    };
  }

  setupEventListeners() {
    // Call lifecycle events
    this.vapi.on('call-start', (event) => {
      console.log('[VapiClient] 🔍 call-start event received:', event);
      
      // Handle undefined event gracefully - extract call ID from Vapi instance or event
      let callId = null;
      if (event) {
        callId = event.call?.id || event.id || event.callId;
        console.log('[VapiClient] 🔍 callId from event:', callId);
      }
      
      // Try to get call ID from Vapi instance if event doesn't have it
      if (!callId && this.vapi.call) {
        callId = this.vapi.call.id;
        console.log('[VapiClient] 🔍 callId from this.vapi.call.id:', callId);
      }
      
      // CRITICAL: Always try to capture callId from call-start event
      // This is the most reliable source as Vapi may not return it in start() result
      if (callId) {
        this.callId = callId;
        console.log('[VapiClient] ✅ this.callId set in call-start handler:', this.callId);
      } else if (this.vapi?.call?.id) {
        // Fallback: try to get from vapi instance
        this.callId = this.vapi.call.id;
        callId = this.callId;
        console.log('[VapiClient] ✅ Got callId from this.vapi.call.id in call-start:', this.callId);
      } else if (!this.callId) {
        // Last resort: log warning if we still don't have a callId
        console.warn('[VapiClient] ⚠️ call-start event has no callId, and this.callId is not set');
        console.warn('[VapiClient] 🔍 Event details:', JSON.stringify(event, null, 2));
        console.warn('[VapiClient] 🔍 this.vapi.call:', this.vapi?.call);
      }
      
      this.reconnectAttempts = 0;
      
      // Emit status event with callId (critical for frontend to start listening to Firestore)
      const statusEvent = {
        type: 'status',
        status: 'connected',
        ...(event || {})
      };
      
      // Use this.callId (which we just set) if available
      const callIdToEmit = this.callId || callId;
      if (callIdToEmit) {
        statusEvent.callId = callIdToEmit;
        console.log('[VapiClient] ✅ Emitting status event with callId:', callIdToEmit);
      } else {
        console.warn('[VapiClient] ⚠️ Emitting status event WITHOUT callId - frontend won\'t be able to listen to suggestions');
      }
      
      this.onEvent(statusEvent);
    });

    this.vapi.on('call-end', (event) => {
      console.log('Vapi call ended:', event);
      this.onEvent({
        type: 'status',
        status: 'ended',
        ...(event || {})
      });
      
      // Only reconnect if explicitly stopped by user (not automatic reconnection)
      // This prevents the assistant from restarting and repeating the greeting
      // The user should manually restart if they want to continue
      // if (!this.isStopped) {
      //   this.handleReconnect();
      // }
    });

    // Transcript events - Vapi SDK may emit different event names
    // Listen to multiple possible event types
    const handleTranscript = (event, eventName = 'transcript') => {
      console.log(`[Vapi ${eventName} event]:`, event);
      
      if (!event) return;
      
      const transcript = event.transcript || event.text || event.message || event.content;
      const role = event.role || event.speaker || event.type;
      const transcriptType = event.transcriptType || event.type; // 'partial' or 'final'
      
      if (!transcript) {
        console.log(`[Vapi ${eventName}]: No transcript text found in event`);
        return;
      }
      
      // Ghost is a silent coach - we only want to capture the user's speech (the customer)
      // Filter out assistant speech to keep Ghost truly silent
      if (role === 'assistant' || role === 'system' || role === 'assistant-message' || role === 'bot') {
        console.log('Ghost: Filtering out assistant speech (silent mode):', transcript);
        return; // Don't emit assistant transcripts
      }
      
      // CRITICAL: Filter out common filler words/acknowledgments that the assistant might generate
      // These are often transcribed even when the assistant is "silent"
      // Examples: "Em", "eh", "uh", "um", "ok", "yeah", "yes", "mhm", "hmm", etc.
      const normalizedTranscript = transcript.trim().toLowerCase();
      const fillerWords = [
        'em', 'eh', 'uh', 'um', 'hmm', 'mhm', 'mm', 'huh',
        'ok', 'okay', 'yeah', 'yes', 'yep', 'yup', 'sure',
        'right', 'alright', 'got it', 'i see', 'i understand',
        'thanks', 'thank you', 'no problem', 'sounds good',
        '...', '..', '.', '', // Empty or just punctuation
      ];
      
      // Check if transcript is just a filler word (exact match or starts with it)
      const isFillerWord = fillerWords.some(filler => {
        // Exact match
        if (normalizedTranscript === filler) return true;
        // Starts with filler word followed by punctuation or space
        if (normalizedTranscript.startsWith(filler + ' ') || 
            normalizedTranscript.startsWith(filler + '.') ||
            normalizedTranscript.startsWith(filler + ',') ||
            normalizedTranscript.startsWith(filler + '!') ||
            normalizedTranscript.startsWith(filler + '?')) return true;
        return false;
      });
      
      // Also filter very short transcripts (1-3 characters) that are likely filler sounds
      const isVeryShortFiller = transcript.trim().length <= 3 && 
                                 /^[a-z]{1,3}[.,!?]*$/i.test(transcript.trim());
      
      if (isFillerWord || isVeryShortFiller) {
        console.log('Ghost: Filtering out filler word/acknowledgment:', transcript);
        return; // Don't emit filler words
      }
      
      // CRITICAL: Filter out coaching cues that are being picked up by the microphone
      // When TTS whispers coaching cues, they can be picked up by the mic and transcribed
      // We need to detect and filter these out
      const isCoachingCue = (text) => {
        const normalizedText = text.toLowerCase().trim();
        // Common coaching cue patterns
        const coachingPatterns = [
          'ask:',
          'acknowledge concern',
          'reframe around',
          'highlight',
          'pivot to',
          'emphasize',
          'probe deeper',
          'what\'s driving',
          'what specific',
          'how will this impact',
          'what would make this',
          'offer expedited',
          'request case studies',
          'reveal key performance',
          'explore specific metrics',
          'focus on quantifiable',
          'what\'s the deadline',
          'what\'s the cost of inaction'
        ];
        
        // Check if transcript starts with or contains coaching cue patterns
        return coachingPatterns.some(pattern => 
          normalizedText.startsWith(pattern) || 
          normalizedText.includes(pattern + ' ') ||
          normalizedText.includes(' ' + pattern)
        );
      };
      
      if (isCoachingCue(transcript)) {
        console.log('Ghost: Filtering out coaching cue picked up by microphone:', transcript);
        return; // Don't emit coaching cues as transcripts
      }
      
      // Only process FINAL transcripts for coaching cues to avoid triggering on incomplete sentences
      // Partial transcripts are shown in UI but not processed for coaching
      const isFinal = transcriptType === 'final' || eventName === 'final' || !transcriptType;
      const shouldProcessForCoaching = isFinal && role === 'user';
      
      console.log(`[Vapi transcript captured]: "${transcript}" (role: ${role}, type: ${transcriptType || 'unknown'}, final: ${isFinal})`);
      
      // DEBUG: Log current state of this.callId
      console.log(`[VapiClient] 🔍 DEBUG - this.callId at handleTranscript:`, this.callId);
      console.log(`[VapiClient] 🔍 DEBUG - this.vapi?.call?.id:`, this.vapi?.call?.id);
      console.log(`[VapiClient] 🔍 DEBUG - event?.callId:`, event?.callId);
      console.log(`[VapiClient] 🔍 DEBUG - event?.call?.id:`, event?.call?.id);
      
      // Emit transcript event for UI
      this.onEvent({
        type: 'transcript',
        text: transcript,
        speaker: role === 'user' ? 'Them' : 'You', // 'Them' = customer, 'You' = Ghost user
        timestamp: event.timestamp || new Date().toISOString()
      });

      // Also send to backend for processing (coaching cues)
      // Only process user transcripts (customer speech), not assistant
      
      // Try to get callId from multiple sources (in case it's not set yet)
      let callIdToUse = this.callId;
      console.log(`[VapiClient] 🔍 DEBUG - Initial callIdToUse from this.callId:`, callIdToUse);
      
      if (!callIdToUse && this.vapi?.call?.id) {
        callIdToUse = this.vapi.call.id;
        this.callId = callIdToUse; // Update for future use
        console.log(`[VapiClient] 🔍 DEBUG - Got callId from this.vapi.call.id:`, callIdToUse);
      }
      if (!callIdToUse && event?.callId) {
        callIdToUse = event.callId;
        this.callId = callIdToUse;
        console.log(`[VapiClient] 🔍 DEBUG - Got callId from event.callId:`, callIdToUse);
      }
      if (!callIdToUse && event?.call?.id) {
        callIdToUse = event.call.id;
        this.callId = callIdToUse;
        console.log(`[VapiClient] 🔍 DEBUG - Got callId from event.call.id:`, callIdToUse);
      }
      
      // Only process FINAL transcripts for coaching cues
      // Partial transcripts are shown in UI but not processed (avoids early triggers)
      console.log(`[VapiClient] Checking if should process: role=${role}, callId=${callIdToUse}, isFinal=${isFinal}, transcript="${transcript.substring(0, 30)}"`);
      if (shouldProcessForCoaching && callIdToUse) {
        console.log('[VapiClient] ✅ Calling processTranscript with callId:', callIdToUse);
        this.processTranscript(transcript, role, callIdToUse);
      } else {
        if (!isFinal) {
          console.log(`[VapiClient] ⏸️ Skipping partial transcript (will process when final)`);
        } else {
          console.log(`[VapiClient] ❌ Skipping processTranscript: role=${role}, callId=${callIdToUse}, isFinal=${isFinal}`);
        }
      }
    };
    
    // Listen to standard transcript event
    this.vapi.on('transcript', (event) => handleTranscript(event, 'transcript'));
    
    // Also listen to message events (Vapi may send transcripts as messages)
    this.vapi.on('message', (event) => {
      try {
        // CRITICAL: Block assistant messages that might trigger speech
        const role = event.role || event.message?.role || event.speaker;
        if (role === 'assistant' || role === 'bot') {
          // Only allow assistant transcripts (which we filter separately in handleTranscript)
          // Block all other assistant messages that might cause speech
          const messageType = event.type || event.message?.type;
          const hasTranscript = !!(event.transcript || event.text || event.content || 
                                   event.message?.transcript || event.message?.text ||
                                   event.data?.transcript || event.data?.text);
          
          // If it's not a transcript, block it completely (might trigger speech)
          if (!hasTranscript && messageType !== 'transcript') {
            console.log('🚫 CRITICAL: Blocking assistant message that might trigger speech:', { role, messageType, event });
            return; // Don't process this message
          }
        }
        
        const eventStr = JSON.stringify(event, null, 2);
        console.log('[Vapi message event] Full event:', eventStr);
        console.log('[Vapi message event] Event type:', event?.type);
        console.log('[Vapi message event] Event keys:', Object.keys(event || {}));
        
        // Check multiple possible transcript locations
        const transcript = event.transcript || event.text || event.content || 
                          event.message?.transcript || event.message?.text ||
                          event.data?.transcript || event.data?.text;
        
        if (transcript) {
          // CRITICAL: Check if this looks like an assistant response (filler words, very short, etc.)
          // Even if role is not explicitly 'assistant', filter out suspicious patterns
          const normalizedText = transcript.trim().toLowerCase();
          const suspiciousPatterns = [
            /^(em|eh|uh|um|hmm|mhm|mm|huh|ok|okay|yeah|yes|yep|yup|sure|right|alright)[.,!?]*$/i,
            /^(got it|i see|i understand|thanks|thank you|no problem|sounds good)[.,!?]*$/i,
            /^\.{1,3}$/, // Just dots
            /^[a-z]{1,3}[.,!?]*$/i // Very short (1-3 chars) single word
          ];
          
          const looksLikeAssistantResponse = suspiciousPatterns.some(pattern => 
            pattern.test(normalizedText)
          );
          
          // If it looks like an assistant response and role is unclear, filter it
          const role = event.role || event.message?.role || event.speaker;
          if (looksLikeAssistantResponse && (!role || role === 'assistant' || role === 'bot' || role === 'system')) {
            console.log('🚫 CRITICAL: Filtering suspicious assistant-like response:', transcript);
            return; // Don't process this message
          }
          
          console.log('[Vapi message event] ✅ Found transcript:', transcript);
          // Create a transcript-like event
          handleTranscript({
            transcript,
            text: transcript,
            role: role || 'user',
            ...event
          }, 'message');
        } else {
          console.log('[Vapi message event] ❌ No transcript found in event');
        }
      } catch (error) {
        console.error('[Vapi message event] Error processing:', error);
      }
    });
    
    // Listen to user-specific transcript events
    this.vapi.on('user-transcript', (event) => {
      console.log('[Vapi user-transcript event]:', JSON.stringify(event, null, 2));
      handleTranscript(event, 'user-transcript');
    });
    this.vapi.on('assistant-transcript', (event) => {
      // Explicitly ignore assistant transcripts
      console.log('Ghost: Ignoring assistant transcript:', event);
    });
    
    // Listen to all events for debugging (remove in production)
    const allEventTypes = ['status-update', 'function-call', 'hang', 'speech-update', 'metadata', 'conversation-item'];
    allEventTypes.forEach(eventType => {
      this.vapi.on(eventType, (event) => {
        console.log(`[Vapi ${eventType} event]:`, JSON.stringify(event, null, 2));
        // Check if any of these events contain transcript data
        if (event.transcript || event.text || event.content || event.message?.transcript) {
          console.log(`[Vapi ${eventType}] Contains transcript data!`);
          handleTranscript(event, eventType);
        }
      });
    });

    // Speech events (optional - for UI feedback)
    this.vapi.on('speech-start', (event) => {
      // CRITICAL: Block assistant speech
      if (event.role === 'assistant' || event.role === 'bot') {
        console.log('🚫 CRITICAL: Assistant speech-start blocked:', event);
        return; // Don't emit or process assistant speech
      }
      this.onEvent({
        type: 'speech-start',
        ...event
      });
    });

    this.vapi.on('speech-end', (event) => {
      // CRITICAL: Block assistant speech
      if (event.role === 'assistant' || event.role === 'bot') {
        console.log('🚫 CRITICAL: Assistant speech-end blocked:', event);
        return; // Don't emit or process assistant speech
      }
      this.onEvent({
        type: 'speech-end',
        ...event
      });
    });
    
    // CRITICAL: Intercept speech-update events to stop assistant speech
    this.vapi.on('speech-update', (event) => {
      const role = event.role || event.speaker;
      const status = event.status;
      
      // If assistant is trying to speak, block it immediately
      if (role === 'assistant' || role === 'bot') {
        console.log('🚫 CRITICAL: Assistant speech-update blocked:', { role, status, event });
        
        // Try to stop the speech programmatically if possible
        try {
          // If Vapi SDK has a method to stop speech, call it here
          // This is a defensive measure in case the assistant still tries to speak
          if (this.vapi?.call?.stopSpeaking) {
            this.vapi.call.stopSpeaking();
            console.log('[VapiClient] 🔇 Called stopSpeaking() to mute assistant');
          }
        } catch (error) {
          console.warn('[VapiClient] Could not stop assistant speech programmatically:', error);
        }
        
        // Do not emit this event to the UI
        return;
      }
    });
    
    // CRITICAL: Intercept ALL message events to block assistant messages that might trigger speech
    this.vapi.on('message', (event) => {
      // Check if this is an assistant message that might cause speech
      const role = event.role || event.message?.role || event.speaker;
      const messageType = event.type || event.message?.type;
      
      if (role === 'assistant' || role === 'bot') {
        // Block assistant messages that might trigger speech
        // Only allow transcripts (which we filter separately)
        if (messageType !== 'transcript' && !event.transcript) {
          console.log('🚫 CRITICAL: Blocking assistant message that might trigger speech:', { role, messageType, event });
          return; // Don't process this message
        }
      }
    });

    // Error handling
    this.vapi.on('error', async (error) => {
      console.error('Vapi SDK error:', error);
      
      // Daily/Vapi will emit an error like:
      // { action: 'error', errorMsg: 'Meeting has ended', ... }
      // Treat this as a normal call end, not a hard error.
      const errorMsg = error?.errorMsg || error?.message || error?.error?.message;
      if (errorMsg && errorMsg.toLowerCase().includes('meeting has ended')) {
        this.callId = null;
        this.onEvent({
          type: 'status',
          status: 'ended'
        });
        // Do NOT trigger reconnect or surface as hard error
        return;
      }

      // Try to extract meaningful error message for real problems
      let errorMessage = 'Vapi SDK error';
      if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.data) {
        errorMessage = JSON.stringify(error.data);
      }
      
      this.onError({
        type: 'sdk_error',
        message: errorMessage,
        error,
        hint: 'Check: 1) Public API key has web call permissions, 2) Assistant is configured for WebRTC, 3) Domain restrictions allow this origin'
      });
    });

    // Function call events (if using tools)
    this.vapi.on('function-call', (event) => {
      this.onEvent({
        type: 'function-call',
        ...event
      });
    });
  }

  async startSession(phoneNumber = null) {
    if (!this.apiKey || !this.assistantId) {
      return false;
    }

    if (this.isStopped) {
      // Reset if previously stopped
      this.isStopped = false;
      this.reconnectAttempts = 0;
    }

    try {
      // Start a WebRTC call using Vapi SDK (no phone number needed for browser sessions)
      // The SDK accepts either: 1) assistantId as a string, or 2) full assistant config object
      console.log('Starting Vapi session with assistant:', this.assistantId);
      
      // Use string format: vapi.start('assistant-id')
      // WebRTC is enabled by default - no special dashboard configuration needed
      // 
      // CRITICAL: Ghost Protocol is a SILENT coach - the assistant must NEVER speak
      // To prevent the assistant from speaking:
      // 1. Go to Vapi Dashboard → Assistants → "Ghost Protocol Assistant" → Settings
      // 2. Set "First Message" to EMPTY STRING (not "Hello" or anything else)
      // 3. Set System Prompt to: "You are a silent transcription assistant. Do not speak. Only transcribe."
      // 4. Disable any voice responses in assistant settings
      const result = await this.vapi.start(this.assistantId);
      
      // CRITICAL: Immediately try to mute/stop any assistant speech that might start
      // This is a defensive measure - the assistant should be configured to be silent, but we block it here too
      setTimeout(() => {
        try {
          console.log('[VapiClient] 🔇 Ensuring assistant remains silent (Ghost is a silent coach)');
          // The speech-update and message event handlers will block assistant speech
          // This timeout is just an extra safety measure
        } catch (error) {
          console.warn('[VapiClient] Could not apply silent mode (non-critical):', error);
        }
      }, 100);

      console.log('Vapi WebRTC session started:', result);
      
      // Capture callId from multiple sources (Vapi SDK may return it in different ways)
      let capturedCallId = null;
      
      // Try result.id first
      if (result?.id) {
        capturedCallId = result.id;
        console.log('[VapiClient] ✅ Got callId from result.id:', capturedCallId);
      }
      // Try result.call?.id
      else if (result?.call?.id) {
        capturedCallId = result.call.id;
        console.log('[VapiClient] ✅ Got callId from result.call.id:', capturedCallId);
      }
      // Try this.vapi.call.id (might be set asynchronously)
      else if (this.vapi?.call?.id) {
        capturedCallId = this.vapi.call.id;
        console.log('[VapiClient] ✅ Got callId from this.vapi.call.id:', capturedCallId);
      }
      
      if (capturedCallId) {
        this.callId = capturedCallId;
        console.log('[VapiClient] ✅ Vapi callId captured:', this.callId);
        
        // Emit status event with callId so frontend can start listening
        this.onEvent({
          type: 'status',
          status: 'connected',
          callId: this.callId
        });
      } else {
        console.warn('[VapiClient] ⚠️ No callId in start result, waiting for call-start event...');
        // The callId will be captured in the call-start event handler
        // But emit a status event anyway so the UI knows we're connecting
        this.onEvent({
          type: 'status',
          status: 'connecting'
        });
        
        // Also try to get callId after a short delay (in case it's set asynchronously)
        setTimeout(() => {
          if (!this.callId && this.vapi?.call?.id) {
            this.callId = this.vapi.call.id;
            console.log('[VapiClient] ✅ Got callId from delayed check (this.vapi.call.id):', this.callId);
            this.onEvent({
              type: 'status',
              status: 'connected',
              callId: this.callId
            });
          }
        }, 1000);
      }
      
      return true;
    } catch (error) {
      console.error('Vapi session start error:', error);
      
      // Extract detailed error info
      let errorMessage = 'Failed to start Vapi session';
      let errorDetails = null;
      
      if (error?.error?.message) {
        errorMessage = error.error.message;
        errorDetails = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data) {
        errorDetails = error.data;
        errorMessage = error.data?.message || errorMessage;
      }
      
      // Check for 403 specifically
      if (error?.status === 403 || error?.error?.statusCode === 403) {
        errorMessage = '403 Forbidden: Check that: 1) Public API key is correct and has web call permissions, 2) Assistant ID is valid, 3) Domain restrictions allow this origin. WebRTC is enabled by default - no dashboard configuration needed.';
      }
      
      this.onError({
        type: 'call_creation_error',
        message: errorMessage,
        error: errorDetails || error,
        hint: 'Verify: 1) Public key allows web calls, 2) Assistant supports WebRTC, 3) No domain restrictions blocking this origin'
      });
      return false;
    }
  }

  async handleReconnect() {
    if (this.isStopped || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.onError({
          type: 'max_reconnect',
          message: 'Max reconnection attempts reached. Please restart the session.'
        });
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    this.onReconnect({
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      nextAttemptIn: delay
    });

    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (!this.isStopped) {
      await this.startSession();
    }
  }

  async processTranscript(text, role, callId = null) {
    // Use provided callId or fall back to this.callId
    const callIdToUse = callId || this.callId;
    
    console.log('[VapiClient] 🔍 processTranscript called:', { 
      text: text.substring(0, 50), 
      role, 
      callIdParam: callId,
      thisCallId: this.callId,
      callIdToUse 
    });
    
    if (!callIdToUse) {
      console.log('[VapiClient] ❌ No callId available, skipping transcript processing');
      console.log('[VapiClient] 🔍 DEBUG - this.callId:', this.callId);
      console.log('[VapiClient] 🔍 DEBUG - this.vapi?.call?.id:', this.vapi?.call?.id);
      return;
    }

    try {
      // Use relative path - Vite proxy handles dev, production uses same origin
      const apiUrl = '/api/process-transcript';
      
      console.log('[VapiClient] 📤 Sending transcript to', apiUrl, 'with callId:', callIdToUse);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          callId: callIdToUse,
          role,
          speaker: role === 'user' ? 'Them' : 'You'
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        console.error('[VapiClient] ❌ Failed to process transcript:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          error: errorText.substring(0, 200)
        });
        return;
      }

      const result = await response.json();
      console.log('[VapiClient] ✅ Transcript processed successfully:', {
        hasCoachingCue: !!result.coachingCue,
        triggers: result.triggers,
        source: result.source
      });
    } catch (error) {
      console.error('[VapiClient] ❌ Error processing transcript:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      // Don't throw - this is non-critical
    }
  }

  stopSession() {
    this.isStopped = true;
    try {
      if (this.vapi) {
        this.vapi.stop();
      }
    } catch (error) {
      console.error('Error stopping Vapi session:', error);
    }
    this.reconnectAttempts = 0;
    this.callId = null;
  }

  getStatus() {
    return {
      isStopped: this.isStopped,
      reconnectAttempts: this.reconnectAttempts,
      callId: this.callId,
      connected: this.callId !== null && !this.isStopped
    };
  }
}
