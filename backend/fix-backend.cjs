const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');

const replacement = "      }";\n" +
"    }\n" +
"\n" +
"    const jsonMatch = rawText.match(/{\[\s\S\]*}/);\n" +
"    const jsonString = jsonMatch ? '{' + jsonMatch[1] + '}' : rawText;\n" +
"    const aiResult = JSON.parse(jsonString);\n" +
"\n" +
"    // Veritabanına Kaydet\n" +
"    training = await Training.create({\n" +
"      content: aiResult.content,\n" +
"      quizData: JSON.stringify(aiResult.quiz),\n" +
"      AccidentId: accidentId\n" +
"    });\n" +
"\n" +
"    res.json({\n" +
"      content: aiResult.content,\n" +
"      quiz: aiResult.quiz,\n" +
"      accident: accident // Eklenen satır\n" +
"    });\n" +
"\n" +
"  } catch (error) {\n" +
"    console.error('Eğitim oluşturma hatası:', error);\n" +
"    res.status(500).json({ error: 'Eğitim oluşturulamadı.' });\n" +
"  }\n" +
"});\n" +
"\n" +
"  // 4. Dinamik Karikatür Getirme Endpoint'i\n" +
"  app.get('/api/caricature', (req, res) => {\n" +
"    const fs = require('fs');\n" +
"    const path = require('path');\n" +
"    \n" +
"    const type = (req.query.type || '').toLowerCase();\n" +
"    const index = parseInt(req.query.index || '0');\n" +
"    \n" +
"    // Tür belirleme\n" +
"    let keywords = ['genel'];\n" +
"    if (type.includes('sıkışma') || type.includes('ezilme')) keywords = ['sikisma', 'sıkışma', 'ezilme'];\n" +
"    else if (type.includes('düşme') || type.includes('kayma')) keywords = ['dusme', 'düşme', 'kayma'];\n" +
"    else if (type.includes('yangın') || type.includes('patlama') || type.includes('yanma')) keywords = ['yangin', 'yangın', 'yanma', 'patlama'];\n" +
"\n" +
"    const dirPath = path.join(__dirname, '../frontend/public/caricatures');\n" +
"    \n" +
"    try {\n" +
"      const files = fs.readdirSync(dirPath);\n" +
"      // Anahtar kelimeyi içeren dosyaları bul\n" +
"      let matchedFiles = files.filter(f => {\n" +
"        const lowerF = f.toLowerCase();\n" +
"        return keywords.some(k => lowerF.includes(k));\n" +
"      });\n" +
"      \n" +
"      // Eğer eşleşen dosya yoksa, 'genel' olanlara düş\n" +
"      if (matchedFiles.length === 0) {\n" +
"        matchedFiles = files.filter(f => f.toLowerCase().includes('genel') || f.toLowerCase().includes('media'));\n" +
"      }\n" +
"      \n" +
"      // Hala yoksa klasördeki her şeye düş\n" +
"      if (matchedFiles.length === 0) {\n" +
"        matchedFiles = files;\n" +
"      }\n" +
"\n" +
"      // Dosyaları isme göre sırala ki 1 2 3 diye düzgün gelsin\n" +
"      matchedFiles.sort();\n" +
"\n" +
"      // Index'e göre dosyayı seç (modüler aritmetik)\n" +
"      const selectedFile = matchedFiles[index % matchedFiles.length];\n" +
"      \n" +
"      // Dosyayı doğrudan gönder\n" +
"      res.sendFile(path.join(dirPath, selectedFile));\n" +
"    } catch (err) {\n" +
"      res.status(404).send('Resim bulunamadı.');\n" +
"    }\n" +
"  });\n" +
"\n" +
"// Veritabanını senkronize et ve sunucuyu başlat\n" +
"sequelize.sync({ alter: true }).then(() => {\n" +
"  console.log('SQLite veritabanı senkronize edildi.');\n" +
"  app.listen(PORT, () => {\n" +
"    console.log('Sunucu http://localhost:' + PORT + ' portunda çalışıyor.');\n" +
"  });\n" +
"}).catch(err => console.error('Veritabanı senkronizasyon hatası:', err));\n";

c = c.substring(0, c.indexOf("]"));
const prefix = c.substring(0, c.lastIndexOf("]")) + "]\n";
fs.writeFileSync('index.js', prefix + replacement, 'utf8');
