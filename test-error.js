const { initializeApp } = require('firebase/app');
const { getFirestore, collection, onSnapshot } = require('firebase/firestore');

const app = initializeApp({ projectId: 'test' });
const db = getFirestore(app);
const c = collection(db, 'users');

onSnapshot(c, 
  () => {}, 
  (error) => {
    throw new Error("My custom error");
  }
);
