import { initializeFirebase } from './index';

const { firestore: db, auth, storage } = initializeFirebase();

export { db, auth, storage };
