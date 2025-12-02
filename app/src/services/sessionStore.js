import { addDoc, collection, doc, setDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from './firebase.js';

/**
 * Create or update a session document in Firestore
 */
export const createSession = async ({ userId, sessionId, mode = 'sales' }) => {
  if (!userId || !sessionId) return;
  const db = getFirestoreDb();
  if (!db) {
    return;
  }
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await setDoc(sessionRef, {
      mode,
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true }); // Use merge to avoid overwriting if document exists
    console.log('[SessionStore] ✅ Session document created:', sessionId);
  } catch (error) {
    console.error('[SessionStore] Failed to create session document:', error);
  }
};

/**
 * Update session metadata (e.g., when session ends)
 */
export const updateSession = async ({ userId, sessionId, updates }) => {
  if (!userId || !sessionId) return;
  const db = getFirestoreDb();
  if (!db) {
    return;
  }
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await setDoc(sessionRef, {
      ...updates,
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('[SessionStore] ✅ Session updated:', sessionId);
  } catch (error) {
    console.error('[SessionStore] Failed to update session:', error);
  }
};

/**
 * Delete a session and all its subcollections (transcript, suggestions)
 */
export const deleteSession = async ({ userId, sessionId }) => {
  if (!userId || !sessionId) return;
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore not available');
  }
  
  try {
    // Delete all documents in transcript subcollection
    const transcriptRef = collection(db, 'users', userId, 'sessions', sessionId, 'transcript');
    const transcriptSnapshot = await getDocs(transcriptRef);
    const transcriptDeletes = transcriptSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(transcriptDeletes);
    console.log('[SessionStore] ✅ Deleted', transcriptSnapshot.size, 'transcript entries');
    
    // Delete all documents in suggestions subcollection
    const suggestionsRef = collection(db, 'users', userId, 'sessions', sessionId, 'suggestions');
    const suggestionsSnapshot = await getDocs(suggestionsRef);
    const suggestionsDeletes = suggestionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(suggestionsDeletes);
    console.log('[SessionStore] ✅ Deleted', suggestionsSnapshot.size, 'suggestion entries');
    
    // Finally, delete the session document itself
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await deleteDoc(sessionRef);
    console.log('[SessionStore] ✅ Session deleted:', sessionId);
    
    return true;
  } catch (error) {
    console.error('[SessionStore] Failed to delete session:', error);
    throw error;
  }
};

export const persistSessionEvent = async ({ userId, sessionId, type, payload }) => {
  if (!userId || !sessionId) return;
  const db = getFirestoreDb();
  if (!db) {
    // Firebase not configured - skip persistence
    return;
  }
  try {
    // Ensure session document exists before adding events
    await createSession({ userId, sessionId });
    
    const eventsRef = collection(db, 'users', userId, 'sessions', sessionId, type);
    await addDoc(eventsRef, {
      ...payload,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to persist session event', error);
  }
};
