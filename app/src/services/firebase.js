import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let firebaseApp;

export const getFirebaseApp = () => {
  if (firebaseApp) return firebaseApp;

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  // Check if Firebase config is missing
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase config missing. App will work in limited mode.');
    // Return a mock app object to prevent crashes
    return null;
  }

  try {
    firebaseApp = initializeApp(firebaseConfig);
    return firebaseApp;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

let authInstance = null;

export const getFirebaseAuth = () => {
  const app = getFirebaseApp();
  if (!app) return null;
  
  // Return cached auth instance to ensure persistence is set once
  if (authInstance) return authInstance;
  
  authInstance = getAuth(app);
  
  // Explicitly set persistence to ensure login persists across page refreshes
  // This must be called before any auth operations
  setPersistence(authInstance, browserLocalPersistence).catch((error) => {
    console.error('[Firebase] Failed to set auth persistence:', error);
  });
  
  return authInstance;
};

export const getFirestoreDb = () => {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
};

