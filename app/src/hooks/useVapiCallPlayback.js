/**
 * Hook to listen to Vapi call transcripts and suggestions from Firestore
 * Listens to calls/{callId}/transcripts and calls/{callId}/suggestions
 * 
 * This is separate from useSessionPlayback because Vapi uses callId instead of sessionId
 */
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getFirestoreDb } from '../services/firebase.js';

export const useVapiCallPlayback = ({ callId, enabled }) => {
  const [transcript, setTranscript] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCallId, setLastCallId] = useState(null);

  useEffect(() => {
    // Clear suggestions/transcript only when starting a NEW call (callId changes)
    if (callId && callId !== lastCallId) {
      console.log('[useVapiCallPlayback] New call detected, clearing old data:', { oldCallId: lastCallId, newCallId: callId });
      setTranscript([]);
      setSuggestions([]);
      setLastCallId(callId);
    }

    if (!enabled || !callId) {
      console.log('[useVapiCallPlayback] Disabled or no callId:', { enabled, callId });
      // Don't clear existing suggestions/transcript when disabled - keep them visible
      // Only stop listening for new updates
      setIsLoading(false);
      return;
    }

    console.log('[useVapiCallPlayback] Setting up listeners for callId:', callId);

    const db = getFirestoreDb();
    if (!db) {
      console.error('[useVapiCallPlayback] Firestore DB not available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Listen to calls/{callId}/transcripts - limit to last 100 for performance
    const transcriptRef = collection(db, 'calls', callId, 'transcripts');
    const qTranscript = query(transcriptRef, orderBy('timestamp', 'desc'), limit(100));

    const unsubscribeTranscript = onSnapshot(qTranscript, (snapshot) => {
      console.log('[useVapiCallPlayback] Transcript snapshot:', snapshot.size, 'docs');
      const newTranscript = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to Date if needed
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp || new Date()),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date())
        };
      });
      // Reverse to show oldest first (since we queried desc)
      newTranscript.reverse();
      console.log('[useVapiCallPlayback] Transcripts:', newTranscript.length);
      setTranscript(newTranscript);
      setIsLoading(false);
    }, (error) => {
      console.error("[useVapiCallPlayback] Error listening to Vapi call transcripts:", error);
      setIsLoading(false);
    });

    // Listen to calls/{callId}/suggestions - limit to last 50 for performance
    const suggestionsRef = collection(db, 'calls', callId, 'suggestions');
    // Use createdAt for ordering (more reliable than timestamp)
    // If index is missing, the error handler will retry with a simple query
    const qSuggestions = query(suggestionsRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribeSuggestions = onSnapshot(qSuggestions, (snapshot) => {
      console.log('[useVapiCallPlayback] ✅ Suggestions snapshot received:', snapshot.size, 'docs');
      if (snapshot.size > 0) {
        console.log('[useVapiCallPlayback] 📄 First suggestion doc:', snapshot.docs[0].id, snapshot.docs[0].data());
      }
      const newSuggestions = snapshot.docs.map(doc => {
        const data = doc.data();
        const suggestion = {
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to Date if needed
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp || new Date()),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date())
        };
        console.log('[useVapiCallPlayback] Processed suggestion:', suggestion.id, suggestion.text?.substring(0, 50));
        return suggestion;
      });
      
      // Sort by createdAt desc manually if orderBy wasn't used
      newSuggestions.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return timeB - timeA; // Descending order
      });
      
      console.log('[useVapiCallPlayback] ✅ Final suggestions array:', newSuggestions.length, 'items');
      setSuggestions(newSuggestions);
      setIsLoading(false);
    }, (error) => {
      console.error("[useVapiCallPlayback] ❌ Error listening to Vapi call suggestions:", error);
      console.error("[useVapiCallPlayback] Error details:", error.code, error.message);
      
      // If the error is about missing index, try a simpler query
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.log('[useVapiCallPlayback] 🔄 Retrying with simple query (no orderBy)...');
        const simpleQuery = query(suggestionsRef);
        onSnapshot(simpleQuery, (snapshot) => {
          const newSuggestions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp || new Date()),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date())
            };
          });
          // Sort manually
          newSuggestions.sort((a, b) => {
            const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
            const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
            return timeB - timeA;
          });
          setSuggestions(newSuggestions);
          setIsLoading(false);
        }, (retryError) => {
          console.error("[useVapiCallPlayback] ❌ Retry also failed:", retryError);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeTranscript();
      unsubscribeSuggestions();
    };
  }, [callId, enabled]);

  return { transcript, suggestions, isLoading };
};

