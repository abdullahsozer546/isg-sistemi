const fs = require('fs');
let c = fs.readFileSync('src/components/3d/SimulationViewer.jsx', 'utf8');

// Replace the hardcoded function with an API call function
c = c.replace(
  /const getLocalImageUrl = \(type, sceneIndex\) => \{[\s\S]*?return list\[sceneIndex % list\.length\];\s*\};/m,
  \const getLocalImageUrl = (type, sceneIndex) => {
  return "http://localhost:5000/api/caricature?type=" + encodeURIComponent(type || "") + "&index=" + sceneIndex;
};\);

fs.writeFileSync('src/components/3d/SimulationViewer.jsx', c, 'utf8');
console.log('Fixed viewer');
