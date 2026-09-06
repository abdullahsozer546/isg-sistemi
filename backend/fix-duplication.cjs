const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');

// Find the first instance of app.listen
const listenIdx = c.indexOf('app.listen(PORT');
const endIdx = c.indexOf('}).catch(err', listenIdx);
const finalEndIdx = c.indexOf(';', endIdx) + 1;

// Cut everything after the first app.listen block
c = c.substring(0, finalEndIdx) + '\n';

fs.writeFileSync('index.js', c, 'utf8');
console.log('Fixed duplication! New length:', c.length);
