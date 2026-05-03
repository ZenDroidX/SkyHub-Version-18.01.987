import firebaseConfig from '../../firebase-applet-config.json';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';
import { errorEmitter } from './error-emitter';

let firestoreInstance: Firestore | null = null;

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
      firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    }
  }

  if (typeof window !== 'undefined') {
    (async () => {
      try {
        await getDocFromServer(doc(firestoreInstance!, 'test', 'connection'));
        console.log("Firestore: Neural connection established.");
      } catch (error: any) {
        if (error?.code === 'permission-denied') {
          console.log("Firestore: Handshake successful (server reached, but test document access restricted).");
          return;
        }

        if (error?.code === 'unavailable' || error?.message?.includes('the client is offline')) {
          console.warn("Firestore [UNAVAILABLE]: The backend is currently unreachable. The application will continue in OFFLINE mode using local cache.");
          errorEmitter.emit('connectivity-error', { 
            message: "Cloud Firestore is currently unreachable. Changes will sync once the connection is restored.",
            code: error?.code || 'unavailable'
          });
        } else {
          console.error("Firestore connectivity pulse failed:", error);
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
