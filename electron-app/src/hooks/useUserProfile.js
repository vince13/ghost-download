import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirestoreDb } from '../services/firebase.js';
import { getPlanDetails } from '../constants/planConfig.js';

export const useUserProfile = (uid) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const db = getFirestoreDb();
    if (!db) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', uid),
      (snapshot) => {
        setProfile(snapshot.exists() ? snapshot.data() : null);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load user profile:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const planDetails = useMemo(() => {
    if (!profile?.plan) {
      return getPlanDetails('guest');
    }
    return getPlanDetails(profile.plan);
  }, [profile?.plan]);

  return { profile, planDetails, isLoading };
};


