const fs = require('fs');
let c = fs.readFileSync('src/components/3d/SimulationViewer.jsx', 'utf8');

// Change the fallback text to not spoil the answer
c = c.replace(/{currentQuestion\.slogan \|\| currentQuestion\.options\[currentQuestion\.correctAnswerIndex\]}/g, '{currentQuestion.slogan || \"ÖNCE İŞ GÜVENLİĞİ!\"}');

// Find the image wrapper and move the slogan OUTSIDE the absolute positioning so it renders above/below the image.
// Right now, the overlay is inside <div className="relative w-full max-w-3xl flex justify-center">
// We want to put the slogan ABOVE the image.
c = c.replace(
  /<img\n\s*src={imageUrl}/,
  \{/* Eğitici Karikatür Sloganı (Overlay) - HER ZAMAN GÖRÜNÜR */}
  <div className="w-full px-6 flex justify-center mb-4 animate-[bounce_0.5s_ease-out]">
    <div className="bg-red-600 border-4 border-yellow-400 text-white p-3 rounded-2xl shadow-[0_10px_25px_rgba(220,38,38,0.7)] text-center transform -rotate-1">
      <p className="text-xl md:text-2xl font-black uppercase tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Impact, sans-serif' }}>
        {currentQuestion.slogan || "ÖNCE İŞ GÜVENLİĞİ!"}
      </p>
    </div>
  </div>
  <img
  src={imageUrl}\
);

// Remove the old absolute bottom overlay
c = c.replace(
  /\{\/\* Eğitici Karikatür Sloganı \(Overlay\) - HER ZAMAN GÖRÜNÜR \*\/\}\s*<div className="absolute bottom-4 left-0 w-full px-6 flex justify-center pointer-events-none animate-\[bounce_0\.5s_ease-out\]">\s*<div className="bg-red-600\/95 border-4 border-yellow-400 text-white p-3 rounded-2xl shadow-\[0_10px_25px_rgba\(220,38,38,0\.7\)\] backdrop-blur-sm max-w-xl text-center transform -rotate-2">\s*<p className="text-xl md:text-2xl font-black uppercase tracking-widest drop-shadow-\[2px_2px_0_rgba\(0,0,0,0\.8\)\]" style=\{\{ fontFamily: 'Impact, sans-serif' \}\}>\s*\{currentQuestion\.slogan \|\| "ÖNCE İŞ GÜVENLİĞİ!"\}\s*<\/p>\s*<\/div>\s*<\/div>/,
  ''
);

fs.writeFileSync('src/components/3d/SimulationViewer.jsx', c, 'utf8');
console.log('Done!');
