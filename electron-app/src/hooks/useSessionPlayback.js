import { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { getFirestoreDb } from '../services/firebase.js';

/**
 * Real-time Firestore listener for session playback.
 * Subscribes to transcript and suggestions collections for a given session,
 * making Firestore the source of truth for UI state.
 */
export const useSessionPlayback = ({ userId, sessionId, enabled = true }) => {
  const [transcript, setTranscript] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const transcriptUnsubRef = useRef(null);
  const suggestionsUnsubRef = useRef(null);

  useEffect(() => {
    // Cleanup previous listeners
    if (transcriptUnsubRef.current) {
      transcriptUnsubRef.current();
      transcriptUnsubRef.current = null;
    }
    if (suggestionsUnsubRef.current) {
      suggestionsUnsubRef.current();
      suggestionsUnsubRef.current = null;
    }

    // Reset state when session changes
    setTranscript([]);
    setSuggestions([]);
    setIsLoading(false);

    if (!enabled || !userId || !sessionId) {
      return;
    }

    setIsLoading(true);
    const db = getFirestoreDb();

    // Listen to transcript events - limit to last 200 for performance
    const transcriptRef = collection(db, 'users', userId, 'sessions', sessionId, 'transcript');
    const transcriptQuery = query(transcriptRef, orderBy('createdAt', 'desc'), limit(200));
    
    transcriptUnsubRef.current = onSnapshot(
      transcriptQuery,
      (snapshot) => {
        const events = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        // Reverse to show oldest first (since we queried desc)
        events.reverse();
        setTranscript(events);
        setIsLoading(false);
      },
      (error) => {
        console.error('Firestore transcript listener error:', error);
        setIsLoading(false);
      }
    );

    // Listen to suggestions events - limit to last 50 for performance
    const suggestionsRef = collection(db, 'users', userId, 'sessions', sessionId, 'suggestions');
    const suggestionsQuery = query(suggestionsRef, orderBy('createdAt', 'desc'), limit(50));
    
    suggestionsUnsubRef.current = onSnapshot(
      suggestionsQuery,
      (snapshot) => {
        const events = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setSuggestions(events);
      },
      (error) => {
        console.error('Firestore suggestions listener error:', error);
      }
    );

    // Cleanup on unmount or when dependencies change
    return () => {
      if (transcriptUnsubRef.current) {
        transcriptUnsubRef.current();
        transcriptUnsubRef.current = null;
      }
      if (suggestionsUnsubRef.current) {
        suggestionsUnsubRef.current();
        suggestionsUnsubRef.current = null;
      }
    };
  }, [userId, sessionId, enabled]);

  return {
    transcript,
    suggestions,
    isLoading
  };
};

