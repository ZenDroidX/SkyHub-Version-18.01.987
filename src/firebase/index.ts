
import firebaseConfig from '../../firebase-applet-config.json';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

import { errorEmitter } from './error-emitter';

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
    (async () => {
      try {
        // Attempt to reach the server to verify connectivity
        await getDocFromServer(doc(firestoreInstance!, 'test', 'connection'));
      } catch (error: any) {
        if (error?.code === 'unavailable' || error?.message?.includes('the client is offline')) {
          console.warn("Firestore [UNAVAILABLE]: The backend is currently unreachable. The application will continue in OFFLINE mode using local cache.");
          errorEmitter.emit('connectivity-error', { 
            message: "Cloud Firestore is currently unreachable. Changes will sync once the connection is restored.",
            code: error?.code || 'unavailable'
          });
        } else {
          console.error("Firestore connectivity error:", error);
        }
      }
    })();
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
