import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { getFirestoreDb } from '../services/firebase.js';

/**
 * Hook to fetch list of past sessions for a user
 */
export const useSessionList = ({ userId, enabled = true }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!enabled || !userId) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const db = getFirestoreDb();
        if (!db) {
          setIsLoading(false);
          return;
        }

        // Get sessions collection
        const sessionsRef = collection(db, 'users', userId, 'sessions');
        
        // Query sessions - we'll order by the most recent transcript/suggestion timestamp
        // Since we can't order by subcollection, we'll fetch all and sort client-side
        const sessionsSnapshot = await getDocs(sessionsRef);
        
        console.log('[useSessionList] Found sessions:', sessionsSnapshot.size);
        
        // For each session, get the latest transcript or suggestion to determine last activity
        // Only fetch minimal data for performance
        const sessionsWithMetadata = await Promise.all(
          sessionsSnapshot.docs.map(async (doc) => {
            const sessionId = doc.id;
            const sessionData = doc.data();
            
            try {
              // Try to get latest transcript (just for timestamp)
              const transcriptRef = collection(db, 'users', userId, 'sessions', sessionId, 'transcript');
              const transcriptQuery = query(transcriptRef, orderBy('createdAt', 'desc'), limit(1));
              const transcriptSnapshot = await getDocs(transcriptQuery);
              
              // Try to get latest suggestion (just for timestamp)
              const suggestionsRef = collection(db, 'users', userId, 'sessions', sessionId, 'suggestions');
              const suggestionsQuery = query(suggestionsRef, orderBy('createdAt', 'desc'), limit(1));
              const suggestionsSnapshot = await getDocs(suggestionsQuery);
              
              // Get latest timestamp from either transcript or suggestion
              let lastActivity = null;
              if (!transcriptSnapshot.empty) {
                const transcriptData = transcriptSnapshot.docs[0].data();
                lastActivity = transcriptData.createdAt?.toDate?.() || transcriptData.createdAt || null;
              }
              if (!suggestionsSnapshot.empty) {
                const suggestionData = suggestionsSnapshot.docs[0].data();
                const suggestionTime = suggestionData.createdAt?.toDate?.() || suggestionData.createdAt || null;
                if (!lastActivity || (suggestionTime && suggestionTime > lastActivity)) {
                  lastActivity = suggestionTime;
                }
              }
              
              // Get counts efficiently (only if we need them)
              // For now, we'll estimate based on whether collections exist
              // Full counts will be shown when session is selected
              const transcriptCount = transcriptSnapshot.empty ? 0 : '?'; // Placeholder
              const suggestionsCount = suggestionsSnapshot.empty ? 0 : '?'; // Placeholder
              
              return {
                id: sessionId,
                ...sessionData,
                lastActivity,
                transcriptCount,
                suggestionsCount
              };
            } catch (err) {
              // If query fails (e.g., missing index), return session with minimal data
              console.warn(`Error fetching metadata for session ${sessionId}:`, err);
              return {
                id: sessionId,
                ...sessionData,
                lastActivity: null,
                transcriptCount: 0,
                suggestionsCount: 0
              };
            }
          })
        );
        
        // Sort by last activity (most recent first)
        sessionsWithMetadata.sort((a, b) => {
          if (!a.lastActivity && !b.lastActivity) return 0;
          if (!a.lastActivity) return 1;
          if (!b.lastActivity) return -1;
          return b.lastActivity.getTime() - a.lastActivity.getTime();
        });
        
        setSessions(sessionsWithMetadata);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [userId, enabled, refreshTrigger]);

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return { sessions, isLoading, error, refresh };
};

