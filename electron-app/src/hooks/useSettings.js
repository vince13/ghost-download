import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from '../services/firebase.js';

const DEFAULT_SETTINGS = {
  latencyTarget: 500,
  persona: 'Calm',
  triggers: {
    price: true,
    competitor: true,
    timeline: true,
    security: false
  },
  mode: 'sales'
};

export const useSettings = (userId) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    loadSettings(userId);
  }, [userId]);

  const loadSettings = async (uid) => {
    try {
      const db = getFirestoreDb();
      const settingsRef = doc(db, 'users', uid, 'settings', 'app');
      const snapshot = await getDoc(settingsRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } else {
        // Create default settings on first load
        await saveSettings(uid, DEFAULT_SETTINGS, true);
      }
    } catch (error) {
      console.error('Failed to load settings', error);
      // Use defaults on error
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (uid, newSettings, isInitial = false) => {
    if (!uid) return;

    setIsSaving(true);
    try {
      const db = getFirestoreDb();
      const settingsRef = doc(db, 'users', uid, 'settings', 'app');
      
      await setDoc(
        settingsRef,
        {
          ...newSettings,
          updatedAt: serverTimestamp(),
          ...(isInitial && { createdAt: serverTimestamp() })
        },
        { merge: true }
      );

      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = async (updates) => {
    const newSettings = { ...settings, ...updates };
    if (userId) {
      await saveSettings(userId, newSettings);
    } else {
      // Fallback to local state if not authenticated
      setSettings(newSettings);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    resetSettings: () => updateSettings(DEFAULT_SETTINGS)
  };
};

