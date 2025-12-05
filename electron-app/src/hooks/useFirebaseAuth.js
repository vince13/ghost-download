import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { getFirebaseAuth } from '../services/firebase.js';
import { ensureUserProfile } from '../services/userProfile.js';

export const useFirebaseAuth = () => {
  const auth = getFirebaseAuth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isActionInFlight, setIsActionInFlight] = useState(false);

  useEffect(() => {
    if (!auth) {
      // Firebase not configured - work in offline mode
      setIsLoading(false);
      return;
    }

    let isInitialLoad = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[useFirebaseAuth] Auth state changed:', {
        hasUser: !!firebaseUser,
        isAnonymous: firebaseUser?.isAnonymous,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        isInitialLoad
      });

      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          await ensureUserProfile(firebaseUser);
        } catch (error) {
          console.error('Failed to ensure user profile document:', error);
        }
      }

      // Only attempt anonymous login if this is the initial load and no user exists
      // This prevents overriding a persisted Google auth session
      if (isInitialLoad && !firebaseUser) {
        console.log('[useFirebaseAuth] No persisted session found, creating anonymous session');
        signInAnonymously(auth).catch((error) => {
          console.error('Firebase anonymous auth failed:', error);
        });
      }

      isInitialLoad = false;
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const runAuthAction = useCallback(
    async (action) => {
      if (!auth) {
        throw new Error('Firebase not configured.');
      }
      setAuthError(null);
      setIsActionInFlight(true);
      try {
        return await action();
      } catch (error) {
        // Provide user-friendly error messages
        let userFriendlyError = error;
        
        if (error.code === 'auth/credential-already-in-use') {
          // This error is now handled gracefully, but if it somehow reaches here,
          // provide a helpful message
          userFriendlyError = new Error(
            'This account is already linked to another Ghost session. Signing you in with your existing account...'
          );
          userFriendlyError.code = error.code;
        } else if (error.code === 'auth/popup-closed-by-user') {
          userFriendlyError = new Error('Sign-in popup was closed. Please try again.');
          userFriendlyError.code = error.code;
        } else if (error.code === 'auth/popup-blocked') {
          userFriendlyError = new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
          userFriendlyError.code = error.code;
        } else if (error.code === 'auth/network-request-failed') {
          userFriendlyError = new Error('Network error. Please check your connection and try again.');
          userFriendlyError.code = error.code;
        }
        
        setAuthError(userFriendlyError);
        throw userFriendlyError;
      } finally {
        setIsActionInFlight(false);
      }
    },
    [auth]
  );

  const upgradeWithGoogle = useCallback(() => {
    return runAuthAction(async () => {
      const wasAnonymous = auth.currentUser?.isAnonymous;
      const anonymousUid = auth.currentUser?.uid;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      let credential;

      try {
        if (auth.currentUser && auth.currentUser.isAnonymous) {
          // Try to link the Google account to the anonymous account
          credential = await linkWithPopup(auth.currentUser, provider);
        } else {
          // User is already authenticated, just sign in with Google
          credential = await signInWithPopup(auth, provider);
        }
      } catch (error) {
        // Handle credential-already-in-use error
        if (error.code === 'auth/credential-already-in-use') {
          console.log('[useFirebaseAuth] Google account already linked to another user, signing in with existing account');
          
          // The error contains the email of the existing account
          const existingEmail = error.customData?.email;
          
          // Sign out the anonymous user first
          if (wasAnonymous) {
            await signOut(auth);
          }
          
          // Sign in with the existing Google account
          credential = await signInWithPopup(auth, provider);
          
          // Note: At this point, the anonymous account's data is separate
          // In a production app, you might want to merge data here
          // For now, we'll just sign in with the existing account
        } else {
          // Re-throw other errors
          throw error;
        }
      }

      await ensureUserProfile(credential.user, {
        authProvider: 'google',
        linkedFromAnonymous: !!wasAnonymous,
        plan: 'trial'
      });

      setUser(credential.user);
      return credential.user;
    });
  }, [auth, runAuthAction]);

  const upgradeWithEmail = useCallback(
    ({ email, password, displayName }) => {
      return runAuthAction(async () => {
        if (!email || !password) {
          throw new Error('Email and password are required.');
        }

        const credential = EmailAuthProvider.credential(email, password);
        let userCredential;
        const wasAnonymous = auth.currentUser?.isAnonymous;

        try {
          if (auth.currentUser && auth.currentUser.isAnonymous) {
            // Try to link the email/password to the anonymous account
            userCredential = await linkWithCredential(auth.currentUser, credential);
          } else {
            // User is already authenticated, try to sign in
            try {
              userCredential = await signInWithEmailAndPassword(auth, email, password);
            } catch (error) {
              if (error.code === 'auth/user-not-found') {
                // User doesn't exist, create new account
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
              } else {
                throw error;
              }
            }
          }
        } catch (error) {
          // Handle credential-already-in-use error
          if (error.code === 'auth/credential-already-in-use') {
            console.log('[useFirebaseAuth] Email account already linked to another user, signing in with existing account');
            
            // Sign out the anonymous user first
            if (wasAnonymous) {
              await signOut(auth);
            }
            
            // Sign in with the existing email/password account
            userCredential = await signInWithEmailAndPassword(auth, email, password);
          } else {
            // Re-throw other errors
            throw error;
          }
        }

        if (displayName && userCredential.user.displayName !== displayName) {
          await updateProfile(userCredential.user, { displayName });
        }

        await ensureUserProfile(userCredential.user, {
          authProvider: 'password',
          linkedFromAnonymous: !!wasAnonymous,
          plan: 'trial'
        });

        setUser(userCredential.user);
        return userCredential.user;
      });
    },
    [auth, runAuthAction]
  );

  const signOutUser = useCallback(() => {
    if (!auth) return Promise.resolve();
    return runAuthAction(async () => {
      await signOut(auth);
      setUser(null);
      await signInAnonymously(auth).catch((error) => {
        console.error('Failed to start new anonymous session after sign out:', error);
      });
    });
  }, [auth, runAuthAction]);

  const authHelpers = useMemo(
    () => ({
      upgradeWithGoogle,
      upgradeWithEmail,
      signOutUser,
      authError,
      isActionInFlight
    }),
    [authError, isActionInFlight, signOutUser, upgradeWithEmail, upgradeWithGoogle]
  );

  return {
    user,
    isLoading,
    ...authHelpers
  };
};

