
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

import firebaseConfigFile from '../../firebase-applet-config.json';
import { errorEmitter } from './error-emitter';

// Robust configuration loading for universal deployment (Vercel, Netlify, Cloudflare, etc.)
const getFirebaseConfig = () => {
  // Priority 1: Individual Environment Variables (Standard for Vercel/Netlify)
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || firebaseConfigFile.firestoreDatabaseId,
    };
  }

  // Priority 2: Full JSON string config (Alternative common pattern)
  if (process.env.NEXT_PUBLIC_FIREBASE_CONFIG) {
    try {
      return JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
    } catch (e) {
      console.error("Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG", e);
    }
  }

  // Last Resort: Fallback to local config file (Default in AI Studio)
  return firebaseConfigFile;
};

const firebaseConfig = getFirebaseConfig();

let firestoreInstance: Firestore | null = null;

/**
 * Initializes Firebase SDKs for both client and server environments.
 * This function handles the singleton pattern for Firebase App initialization
 * to ensure it works correctly in Next.js Server Actions and Genkit Flows.
 */
export function initializeFirebase() {
  let app: FirebaseApp;
  const apps = getApps();

  if (!apps.length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  if (!firestoreInstance) {
    try {
      firestoreInstance = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      }, firebaseConfig.firestoreDatabaseId);
    } catch (e) {
      // In case of HMR or double initialization, fall back to getting existing instance
      firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    }
  }

  // Connection validation as per best practices
  if (typeof window !== 'undefined') {
    // Neural pulse: perform connection check after a short delay to allow environment stabilization
    setTimeout(async () => {
      try {
        // Attempt to reach the server to verify connectivity
        // We use getServerDoc to explicitly bypass cache and check the real backend
        await getDocFromServer(doc(firestoreInstance!, 'test', 'connection'));
        console.log("Firestore: Neural connection established.");
      } catch (error: any) {
        if (error?.code === 'permission-denied' || error?.code === 'not-found') {
          console.log("Firestore: Handshake successful (server reached).");
          return;
        }

        if (error?.code === 'unavailable' || error?.message?.includes('client is offline')) {
          console.warn("Firestore [UNAVAILABLE]: The backend is currently unreachable. The application will continue in OFFLINE mode.");
        } else {
          console.error("Firestore connectivity pulse failed:", error);
        }
      }
    }, 1000);
  }

  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: firestoreInstance!,
    storage: getStorage(app)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
