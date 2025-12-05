import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from './firebase.js';

/**
 * Ensures a user profile document exists and stores the latest metadata.
 * Creates the document with sensible defaults if it does not exist yet.
 */
export const ensureUserProfile = async (user, overrides = {}) => {
  const db = getFirestoreDb();

  if (!db || !user?.uid) return null;

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  const { plan: overridePlan, forcePlanOverride, ...restOverrides } = overrides;

  const baseDoc = snapshot.exists()
    ? {}
    : {
        createdAt: serverTimestamp(),
        plan: user.isAnonymous ? 'guest' : 'trial',
        onboardingStage: user.isAnonymous ? 'demo' : 'signed_in'
      };

  const payload = {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    authProvider: user.providerData?.[0]?.providerId ?? (user.isAnonymous ? 'anonymous' : 'custom'),
    lastActiveAt: serverTimestamp(),
    ...baseDoc,
    ...restOverrides
  };

  if (overridePlan !== undefined) {
    const existingPlan = snapshot.exists() ? snapshot.data()?.plan : null;
    const shouldOverridePlan =
      forcePlanOverride ||
      !existingPlan ||
      existingPlan === 'guest' ||
      overridePlan !== 'trial';

    if (shouldOverridePlan) {
      payload.plan = overridePlan;
    }
  }

  await setDoc(userRef, payload, { merge: true });
  return payload;
};


