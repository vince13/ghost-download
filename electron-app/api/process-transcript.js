/**
 * API endpoint to process transcripts from the frontend
 * Called when Vapi SDK receives a transcript event
 * Processes the transcript, checks for triggers, calls LLM, and saves to Firestore
 */
import { getAdminDb } from './lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, callId, role, speaker, skipTranscriptSave, playbookId } = req.body;

  if (!text || !callId) {
    return res.status(400).json({ error: 'Missing text or callId' });
  }

  console.log('[process-transcript] Received:', { text: text.substring(0, 50), callId, role, speaker });

  try {
    const db = getAdminDb();
    const hasFirestore = !!db;
    
    if (!hasFirestore) {
      console.error('[process-transcript] ⚠️ Firebase Admin DB not initialized');
      console.error('[process-transcript] This usually means FIREBASE_SERVICE_ACCOUNT is missing in Vercel environment variables');
      console.error('[process-transcript] Coaching cues will still be generated but not saved to Firestore');
    }

    // Save transcript to Firestore (if available)
    if (hasFirestore && !skipTranscriptSave) {
      try {
        const transcriptRef = db.collection('calls').doc(callId).collection('transcripts');
        await transcriptRef.add({
          text,
          role: role || 'user',
          speaker: speaker || (role === 'user' ? 'Them' : 'You'),
          timestamp: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp()
        });
        console.log('[process-transcript] ✅ Transcript saved to Firestore');
      } catch (firestoreError) {
        console.error('[process-transcript] ❌ Failed to save transcript:', firestoreError);
      }
    } else if (skipTranscriptSave) {
      console.log('[process-transcript] ⏭️ Skipping transcript save (requested by client)');
    }

    // Check for trigger keywords
    const triggers = detectTriggers(text);
    console.log('[process-transcript] Trigger detection:', { 
      text: text.substring(0, 50), 
      triggers,
      detected: triggers.detected,
      objection: triggers.objection,
      competitor: triggers.competitor,
      timeline: triggers.timeline
    });

    if (triggers.detected) {
      // Import LLM processing directly (avoids HTTP call and deployment protection issues)
      const { processWithLLM, getFallbackCue } = await import('./lib/llmProcessor.js');

      try {
        console.log('[process-transcript] 📤 Processing with LLM directly');
        console.log('[process-transcript] Request payload:', { text: text.substring(0, 50), triggers, callId });
        
        // Get userId from request if available (for RAG context)
        // Try to extract userId from callId metadata or request
        let userId = req.body.userId || null;
        
        // If userId not provided, try to get it from call metadata
        let callMetadata = null;
        if (!userId && hasFirestore && callId) {
          try {
            const callDoc = await db.collection('calls').doc(callId).get();
            if (callDoc.exists) {
              callMetadata = callDoc.data();
              userId = callMetadata?.userId || null;
            }
          } catch (error) {
            console.warn('[process-transcript] Could not fetch userId from call metadata:', error.message);
          }
        }
        
        // Get playbookId from request, call metadata, or user settings
        let effectivePlaybookId = playbookId || callMetadata?.playbookId || null;
        if (!effectivePlaybookId && userId && hasFirestore) {
          try {
            // Try to get selected playbook from user settings
            const settingsDoc = await db.collection('users').doc(userId).collection('settings').doc('default').get();
            if (settingsDoc.exists) {
              effectivePlaybookId = settingsDoc.data()?.selectedPlaybookId || null;
            }
          } catch (error) {
            console.warn('[process-transcript] Could not fetch playbook from settings:', error.message);
          }
        }
        
        // Fetch custom playbook if playbookId is available
        let customPrompt = null;
        if (effectivePlaybookId && userId && hasFirestore) {
          try {
            const playbookDoc = await db.collection('users').doc(userId).collection('playbooks').doc(effectivePlaybookId).get();
            if (playbookDoc.exists) {
              const playbookData = playbookDoc.data();
              customPrompt = playbookData.systemPrompt || null;
              if (customPrompt) {
                console.log('[process-transcript] ✅ Using custom playbook:', playbookData.name);
              }
            }
          } catch (error) {
            console.warn('[process-transcript] Could not fetch playbook:', error.message);
          }
        }
        
        const llmResult = await processWithLLM({ text, triggers, userId, callId, customPrompt });
        console.log('[process-transcript] ✅ LLM processing completed:', JSON.stringify(llmResult, null, 2));
        console.log('[process-transcript] Coaching cue from LLM:', llmResult.coachingCue);

        // Save coaching cue to Firestore (if available)
        if (hasFirestore) {
          try {
            const coachingCueText = llmResult.coachingCue || llmResult.suggestion || 'Coaching cue generated';
            
            // DEDUPLICATION: Check if a similar coaching cue was saved recently (within last 60 seconds)
            // This prevents duplicate cues from being saved when:
            // 1. The same transcript is processed multiple times
            // 2. Different transcripts generate the same coaching cue
            const suggestionsRef = db.collection('calls').doc(callId).collection('suggestions');
            
            // Try to check for duplicates, but don't fail if the query errors (e.g., missing index)
            let shouldSkipDuplicate = false;
            try {
              // Get recent suggestions (last 10) to check for duplicates
              // We can't use orderBy without an index, so we'll get all and filter client-side
              const recentSuggestions = await suggestionsRef
                .limit(10) // Get last 10 suggestions
                .get();
              
              if (!recentSuggestions.empty) {
                const now = new Date().getTime();
                const normalizedNewCue = coachingCueText.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,!?;:]/g, '').trim();
                
                // Check if any recent suggestion has similar text (within last 60 seconds)
                for (const doc of recentSuggestions.docs) {
                  const data = doc.data();
                  const existingCueText = (data.text || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,!?;:]/g, '').trim();
                  
                  // Check if texts are similar (exact match or very similar)
                  const isSimilar = normalizedNewCue === existingCueText || 
                                   normalizedNewCue.includes(existingCueText.substring(0, 20)) ||
                                   existingCueText.includes(normalizedNewCue.substring(0, 20));
                  
                  if (isSimilar) {
                    const time = data.createdAt?.toDate?.() || data.createdAt || data.timestamp?.toDate?.() || data.timestamp;
                    if (time) {
                      const timeMs = time instanceof Date ? time.getTime() : new Date(time).getTime();
                      const secondsSinceLastCue = (now - timeMs) / 1000;
                      
                      if (secondsSinceLastCue < 60) { // Increased to 60 seconds
                        console.log('[process-transcript] ⏸️ Skipping duplicate coaching cue (saved', secondsSinceLastCue.toFixed(1), 'seconds ago):', coachingCueText.substring(0, 50));
                        shouldSkipDuplicate = true;
                        break;
                      }
                    }
                  }
                }
              }
            } catch (dedupeError) {
              // If deduplication query fails (e.g., missing Firestore index), log but continue
              console.warn('[process-transcript] ⚠️ Deduplication check failed (continuing anyway):', dedupeError.message);
              // Continue to save the suggestion even if deduplication check failed
            }
            
            if (shouldSkipDuplicate) {
              return res.status(200).json({ 
                success: true,
                coachingCue: coachingCueText,
                triggers,
                source: llmResult.source,
                duplicate: true,
                message: 'Duplicate cue detected - not saved'
              });
            }
            
            console.log('[process-transcript] 🔍 About to save to Firestore:', {
              path: `calls/${callId}/suggestions`,
              callId,
              text: coachingCueText.substring(0, 50),
              triggers
            });
            
            console.log('[process-transcript] 📝 Attempting to save coaching cue to Firestore...');
            const docRef = await suggestionsRef.add({
              text: coachingCueText,
              type: 'suggestion',
              trigger: triggers,
              originalText: text,
              ragUsed: llmResult.ragUsed || false, // Indicate if KB content was used
              timestamp: FieldValue.serverTimestamp(),
              createdAt: FieldValue.serverTimestamp()
            });
          
            console.log('[process-transcript] ✅ Coaching cue saved to Firestore:', {
              docId: docRef.id,
              path: `calls/${callId}/suggestions/${docRef.id}`,
              callId,
              text: coachingCueText.substring(0, 50),
              triggers
            });
          
            // Verify it was saved by reading it back (with retry in case of eventual consistency)
            let verifyAttempts = 0;
            let verifySuccess = false;
            while (verifyAttempts < 3 && !verifySuccess) {
              await new Promise(resolve => setTimeout(resolve, 500 * verifyAttempts)); // Wait before retry
              const verifyDoc = await docRef.get();
              if (verifyDoc.exists) {
                const verifyData = verifyDoc.data();
                console.log('[process-transcript] ✅ Verified: Document exists in Firestore:', {
                  docId: docRef.id,
                  text: verifyData.text?.substring(0, 50),
                  createdAt: verifyData.createdAt?.toDate?.() || verifyData.createdAt
                });
                verifySuccess = true;
              } else {
                verifyAttempts++;
                if (verifyAttempts < 3) {
                  console.log(`[process-transcript] ⏳ Verification attempt ${verifyAttempts} failed, retrying...`);
                } else {
                  console.error('[process-transcript] ❌ Verification failed after 3 attempts: Document does not exist');
                }
              }
            }
        } catch (firestoreError) {
          console.error('[process-transcript] ❌ Failed to save coaching cue to Firestore:', firestoreError);
          console.error('[process-transcript] Error details:', {
            code: firestoreError.code,
            message: firestoreError.message,
            stack: firestoreError.stack,
            callId,
            text: coachingCueText?.substring(0, 50)
          });
          // Still return the coaching cue to the frontend even if Firestore save failed
          // The frontend can still display it, just won't persist it
          }
        } else {
          console.log('[process-transcript] ⚠️ Skipping Firestore save (Firebase Admin not configured)');
        }

        return res.status(200).json({ 
          success: true,
          coachingCue: llmResult.coachingCue,
          triggers
        });
      } catch (llmError) {
        console.error('[process-transcript] LLM error:', llmError);
        console.error('[process-transcript] LLM error details:', llmError.message, llmError.stack);
        
        // Generate fallback coaching cue when LLM fails
        const fallbackCue = getFallbackCue(triggers);
        console.log('[process-transcript] Using fallback coaching cue:', fallbackCue);
        
        // Still save fallback cue to Firestore (if available)
        if (hasFirestore) {
          try {
            console.log('[process-transcript] 🔍 About to save fallback to Firestore:', {
              path: `calls/${callId}/suggestions`,
              callId,
              text: fallbackCue.substring(0, 50),
              triggers
            });
            
            const suggestionsRef = db.collection('calls').doc(callId).collection('suggestions');
          const docRef = await suggestionsRef.add({
            text: fallbackCue,
            type: 'suggestion',
            trigger: triggers,
            originalText: text,
            timestamp: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            source: 'fallback' // Mark as fallback
          });
          
          console.log('[process-transcript] ✅ Fallback coaching cue saved to Firestore:', {
            docId: docRef.id,
            path: `calls/${callId}/suggestions/${docRef.id}`,
            callId,
            text: fallbackCue.substring(0, 50)
          });
          
          // Verify it was saved
          const verifyDoc = await docRef.get();
          if (verifyDoc.exists) {
            console.log('[process-transcript] ✅ Verified fallback: Document exists in Firestore');
          } else {
            console.error('[process-transcript] ❌ Verification failed: Fallback document does not exist');
          }
        } catch (firestoreError) {
          console.error('[process-transcript] ❌ Failed to save fallback coaching cue:', firestoreError);
          console.error('[process-transcript] Error details:', {
            code: firestoreError.code,
            message: firestoreError.message
          });
          }
        } else {
          console.log('[process-transcript] ⚠️ Skipping Firestore save for fallback (Firebase Admin not configured)');
        }
        
        return res.status(200).json({ 
          success: true,
          coachingCue: fallbackCue,
          triggers,
          source: 'fallback',
          error: llmError.message
        });
      }
    }

    // No triggers detected - return success but no coaching cue needed
    return res.status(200).json({ 
      success: true,
      triggers,
      message: 'No triggers detected - no coaching cue needed'
    });
  } catch (error) {
    console.error('[process-transcript] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function detectTriggers(text) {
  const lowerText = text.toLowerCase();
  
  // Expanded objection keywords - include variations and synonyms
  const objectionKeywords = [
    'expensive', 'price', 'cost', 'costly', 'costs', 'priced', 'pricing',
    'budget', 'afford', 'cheaper', 'cheap', 'high', 'too much', 'too expensive',
    'overpriced', 'unaffordable', 'steep', 'pricey', 'premium', 'worth it',
    'value', 'roi', 'return on investment', 'justify', 'justification'
  ];
  
  const competitorKeywords = [
    'competitor', 'competitors', 'alternative', 'alternatives', 'other vendor',
    'other solution', 'other tool', 'pendo', 'gong', 'chorus', 'competition',
    'vs', 'versus', 'compared to', 'better than', 'instead of', 'rather than'
  ];
  
  const timelineKeywords = [
    'timeline', 'when', 'deadline', 'urgent', 'asap', 'as soon as possible',
    'time', 'soon', 'quickly', 'fast', 'immediately', 'now', 'right away',
    'by when', 'how long', 'duration', 'schedule', 'scheduling'
  ];
  
  const detected = {
    objection: objectionKeywords.some(kw => lowerText.includes(kw)),
    competitor: competitorKeywords.some(kw => lowerText.includes(kw)),
    timeline: timelineKeywords.some(kw => lowerText.includes(kw))
  };

  return {
    detected: detected.objection || detected.competitor || detected.timeline,
    ...detected
  };
}

