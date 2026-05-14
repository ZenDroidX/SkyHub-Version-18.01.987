import * as admin from 'firebase-admin';

/**
 * Initializes Firebase Admin SDK as a singleton for Vercel Serverless.
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY
 * to be set in your Vercel Dashboard Environment Variables.
 */
export function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  // CRITICAL: Vercel environment variables often escape newlines when pasted.
  // This replacement ensures the private key is correctly formatted for the RSA protocol.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[SKY HUB ADMIN] Initialization pending: Required environment variables are missing.');
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('[SKY HUB ADMIN ERROR] Failed to initialize Firebase Admin:', error);
    return null;
  }
}

/**
 * Accessor for the Firestore instance using the Admin SDK bio-signature.
 */
import { getFirestore } from 'firebase-admin/firestore';

export const adminDb = () => {
  const app = getFirebaseAdmin();
  if (!app) return null;
  // Use the correct database instead of (default)
  return getFirestore(app, 'ai-studio-fe1b8646-47c1-4daf-badf-db55d5475837');
};
