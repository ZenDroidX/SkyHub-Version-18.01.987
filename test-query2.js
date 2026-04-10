const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, orderBy } = require('firebase/firestore');

const app = initializeApp({ projectId: 'test' });
const db = getFirestore(app);
const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

console.log('canonicalString:', typeof q._query.path.canonicalString);
