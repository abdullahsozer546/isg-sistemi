const fs = require('fs');
let content = fs.readFileSync('src/components/3d/SimulationViewer.jsx', 'utf8');

const helperFunc = 'const getLocalImageUrl = (type, sceneIndex) => {' +
'  const t = (type || \'\').toLowerCase();' +
'  let list = [' +
'    \"/caricatures/media_1787203690340.jpg\",' +
'    \"/caricatures/genel_fallback_1786958064806.jpg\",' +
'    \"/caricatures/media_1787127921014.jpg\"' +
'  ];' +
'  if (t.includes(\"sıkışma\") || t.includes(\"ezilme\")) {' +
'    list = [\"/caricatures/sikisma_1_1787031428870.jpg\", \"/caricatures/sikisma_2_1787031445688.jpg\", \"/caricatures/sikisma_3_1787031460029.jpg\"];' +
'  } else if (t.includes(\"düşme\") || t.includes(\"kayma\")) {' +
'    list = [\"/caricatures/dusme_1_1787031474359.jpg\", \"/caricatures/dusme_2_1787031548008.jpg\", \"/caricatures/dusme_3_1787031559920.jpg\"];' +
'  } else if (t.includes(\"yangın\") || t.includes(\"patlama\")) {' +
'    list = [\"/caricatures/yangin_2_1787031582639.jpg\", \"/caricatures/yangin_3_1787031595119.jpg\", \"/caricatures/yangin_fallback_1786957930785.jpg\"];' +
'  }' +
'  return list[sceneIndex % list.length];' +
'};' +
'export default function SimulationViewer';

content = content.replace('export default function SimulationViewer', helperFunc);

// Line 111 & 115 replacement (inside isCompleted)
content = content.replace(/const endImageUrl = .*/g, 'const endImageUrl = getLocalImageUrl(accidentType, 2);');
content = content.replace(/const visualImageUrl = .*/g, 'const visualImageUrl = getLocalImageUrl(accidentType, 1);');

// Line 227 replacement (inside main render)
content = content.replace(/const imageUrl = .*/g, 'const imageUrl = getLocalImageUrl(accidentType, currentSceneIndex);');

fs.writeFileSync('src/components/3d/SimulationViewer.jsx', content, 'utf8');
console.log('Done replacing image urls!');
