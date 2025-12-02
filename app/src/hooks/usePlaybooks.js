/**
 * Hook for managing custom coaching playbooks
 * Stores playbooks in Firestore under users/{userId}/playbooks
 */
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getFirestoreDb } from '../services/firebase.js';

export const usePlaybooks = (userId) => {
  const [playbooks, setPlaybooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setPlaybooks([]);
      setIsLoading(false);
      return;
    }

    const db = getFirestoreDb();
    if (!db) {
      setError('Firestore not available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const playbooksRef = collection(db, 'users', userId, 'playbooks');
    const q = query(playbooksRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const playbooksList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : (doc.data().updatedAt ? new Date(doc.data().updatedAt) : null)
        }));
        setPlaybooks(playbooksList);
        setIsLoading(false);
      },
      (err) => {
        console.error('[usePlaybooks] Error fetching playbooks:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const createPlaybook = async (playbookData) => {
    if (!userId) {
      throw new Error('User must be logged in to create playbooks');
    }

    const db = getFirestoreDb();
    if (!db) {
      throw new Error('Firestore not available');
    }

    const playbooksRef = collection(db, 'users', userId, 'playbooks');
    const now = new Date();
    
    const newPlaybook = {
      ...playbookData,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(playbooksRef, newPlaybook);
    return docRef.id;
  };

  const updatePlaybook = async (playbookId, updates) => {
    if (!userId) {
      throw new Error('User must be logged in to update playbooks');
    }

    const db = getFirestoreDb();
    if (!db) {
      throw new Error('Firestore not available');
    }

    const playbookRef = doc(db, 'users', userId, 'playbooks', playbookId);
    await updateDoc(playbookRef, {
      ...updates,
      updatedAt: new Date()
    });
  };

  const deletePlaybook = async (playbookId) => {
    if (!userId) {
      throw new Error('User must be logged in to delete playbooks');
    }

    const db = getFirestoreDb();
    if (!db) {
      throw new Error('Firestore not available');
    }

    const playbookRef = doc(db, 'users', userId, 'playbooks', playbookId);
    await deleteDoc(playbookRef);
  };

  return {
    playbooks,
    isLoading,
    error,
    createPlaybook,
    updatePlaybook,
    deletePlaybook
  };
};

