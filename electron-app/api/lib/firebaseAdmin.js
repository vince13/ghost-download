/**
 * Firebase Admin SDK initialization for server-side Firestore access
 * Used by API routes (webhooks) to write to Firestore without client auth
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp;
let adminDb;

export const getAdminDb = () => {
  if (adminDb) return adminDb;

  // Check if already initialized
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    adminDb = getFirestore(adminApp);
    return adminDb;
  }

  // For Vercel, we MUST use a service account - default credentials don't work
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('[firebaseAdmin] ❌ FIREBASE_SERVICE_ACCOUNT environment variable is required for server-side Firestore access');
    console.error('[firebaseAdmin] To fix: Add FIREBASE_SERVICE_ACCOUNT to Vercel environment variables');
    console.error('[firebaseAdmin] Get service account: Firebase Console → Project Settings → Service Accounts → Generate New Private Key');
    return null; // Return null instead of trying default credentials
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Validate required fields
    if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
      console.error('[firebaseAdmin] ❌ Service account JSON is missing required fields');
      console.error('[firebaseAdmin] Required: private_key, client_email, project_id');
      return null;
    }
    
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
    });
    console.log('[firebaseAdmin] ✅ Initialized with service account for project:', serviceAccount.project_id);
  } catch (error) {
    console.error('[firebaseAdmin] ❌ Failed to initialize Firebase Admin:', error);
    console.error('[firebaseAdmin] Error details:', error.message);
    if (error instanceof SyntaxError) {
      console.error('[firebaseAdmin] ⚠️ This looks like a JSON parsing error. Make sure FIREBASE_SERVICE_ACCOUNT is valid JSON.');
    }
    return null;
  }

  adminDb = getFirestore(adminApp);
  return adminDb;
};

