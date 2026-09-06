const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');
const searchString = "app.post('/api/accidents'";
const firstIndex = c.indexOf(searchString);
const secondIndex = c.indexOf(searchString, firstIndex + 1);

if (secondIndex !== -1) {
  // It's duplicated!
  // Find where the first half ends. It probably ends right before the second searchString?
  // Let's just take the first part (imports, config) and the SECOND half of the endpoints.
  
  const imports = c.substring(0, firstIndex);
  const correctHalf = c.substring(secondIndex);
  fs.writeFileSync('index.js', imports + correctHalf, 'utf8');
  console.log('Fixed duplication! New length:', (imports + correctHalf).length);
} else {
  console.log('Not duplicated?');
}
