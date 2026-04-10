const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, orderBy } = require('firebase/firestore');

const app = initializeApp({ projectId: 'test' });
const db = getFirestore(app);
const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

console.log('q.type:', q.type);
console.log('q._query:', q._query);
