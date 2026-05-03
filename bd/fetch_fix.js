const fetch = require('node-fetch');
fetch('http://localhost:3000/api/fix').then(r => r.json()).then(console.log).catch(console.error);
