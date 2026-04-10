const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, orderBy } = require('firebase/firestore');

const app = initializeApp({ projectId: 'test' });
const db = getFirestore(app);
const c = collection(db, 'users');

console.log('c.type:', c.type);
console.log('c.path:', c.path);
