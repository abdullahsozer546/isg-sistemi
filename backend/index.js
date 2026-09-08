require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { upsertDocument } = require('./utils/rag');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const Accident = sequelize.define('Accident', {
  department: DataTypes.STRING,
  machine: DataTypes.STRING,
  description: DataTypes.TEXT,
  riskLevel: DataTypes.STRING,
  rootCause: DataTypes.TEXT,
  preventiveMeasures: DataTypes.TEXT,
  accidentType: DataTypes.STRING,
  videoUrl: DataTypes.STRING,
  locationPhotoUrl: DataTypes.TEXT,
  rulePhotoUrl: DataTypes.TEXT,
  problemDefinition: DataTypes.TEXT,
  fiveWhys: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('fiveWhys');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('fiveWhys', JSON.stringify(value));
    }
  },
  actions: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('actions');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('actions', JSON.stringify(value));
    }
  }
});

const Employee = sequelize.define('Employee', {
  name: DataTypes.STRING,
  department: DataTypes.STRING,
  hasTraining: { type: DataTypes.BOOLEAN, defaultValue: false },
  trainingStatus: DataTypes.STRING,
  lastTrainingDate: DataTypes.DATE,
});

const Training = sequelize.define('Training', {
  content: DataTypes.TEXT,
  quizData: DataTypes.TEXT,
});
Accident.hasOne(Training);
Training.belongsTo(Accident);
Employee.hasMany(Accident);
Accident.belongsTo(Employee);

const BasicTraining = sequelize.define('BasicTraining', {
  content: DataTypes.TEXT,
  quizData: DataTypes.TEXT,
});


app.post('/api/accidents', async (req, res) => {
  const { queryRelevantContext } = require('./utils/rag');
  
  try {
    const { department, machine, description, videoUrl, locationPhotoUrl, locationPhotoName, employeeId } = req.body;
    
    console.log('AI analizi başlatılıyor (Multimodal)...');
    
    // RAG veritabanından kaza ile ilgili şirket içi mevzuat / kuralları çek
    const ragContext = await queryRelevantContext(`Bölüm: ${department} Makine: ${machine || ''} Olay: ${description}`, 3);

    const parts = [
      { text: `Sen bir İSG (İş Sağlığı ve Güvenliği) Uzmanısın. Aşağıdaki kaza verilerini analiz et.

ŞİRKET BİLGİ BANKASI / MEVZUAT KURALLARI (RAG):
${ragContext ? ragContext : "Sistemde kural bulunamadı."}

Bölüm: ${department}\nMakine: ${machine || 'Belirtilmedi'}\nAçıklama: ${description}` }
    ];

    if (locationPhotoUrl) {
      const base64Data = locationPhotoUrl.split(',')[1];
      const mimeType = locationPhotoUrl.split(';')[0].split(':')[1];
      parts.push({ text: `\n[Kaza Yeri Fotoğrafı] Dosya Adı: ${locationPhotoName || 'Bilinmiyor'}\nİşçi tarafından kaza yeri olarak eklenen görsel aşağıdadır:` });
      parts.push({ inlineData: { data: base64Data, mimeType: mimeType } });
    }

    let ruleFiles = [];
    try {
      const rulesDir = path.join(__dirname, '../frontend/public/kurallar');
      if (fs.existsSync(rulesDir)) {
        ruleFiles = fs.readdirSync(rulesDir).filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i));
        
        if (ruleFiles.length > 0) {
          parts.push({ text: `\nAşağıda sistemimizde bulunan mevcut kural levhaları/fotoğrafları yer almaktadır. Lütfen bu görsellerin içeriklerini, taşıdıkları anlamları ve varsa üzerlerindeki yazıları görsel olarak analiz et:` });
          
          for (const file of ruleFiles.slice(0, 30)) {
            const filePath = path.join(rulesDir, file);
            const ext = path.extname(file).toLowerCase().replace('.', '');
            const mime = ext === 'jpg' ? 'jpeg' : ext;
            const base64 = fs.readFileSync(filePath, { encoding: 'base64' });
            
            parts.push({ text: `\nKural Dosyası Adı: ${file}` });
            parts.push({ inlineData: { data: base64, mimeType: `image/${mime}` } });
          }
        }
      }
    } catch(e) { console.error("Kural dizini okunamadı", e); }

    parts.push({
      text: `\nLütfen kaza açıklamasını, görseli ve sana verdiğim ŞİRKET MEVZUAT KURALLARI metinlerini birlikte değerlendirerek detaylı bir "5 Neden Analizi (5 Whys)" yap. Özellikle, yaşanan kaza mevzuatta gelen kurallardan birini ihlal ediyorsa, 'rootCause' (Kök Neden) ve 'preventiveMeasures' (Özet Önlemler) kısmında o kurala açıkça referans ver.
Kaza yeri fotoğrafı yüklenmişse o fotoğrafı bir kaynak/kanıt olarak riskler ve kök nedenler için analiz et.
Yukarida sana görsel içerikleriyle birlikte sunduğum kural fotoğraflarından (görsellerin anlattığı duruma veya levhaların içeriğine bakarak) bu kazaya en uygun olanı seç. Uygun yoksa veya liste boşsa null bırak.

ÖNEMLİ KURALLAR:
1. 5 Neden Analizi'ndeki "question" (soru) kısmına sürekli "Neden oldu?" yazma. Önceki cevaba bağlı kalarak "Zemin neden kaygandı?", "Conta neden yırtıldı?" gibi gerçek ve olaya özgü sorular üret.
2. Cevaplarında ASLA "RAG", "veritabanı", "PDF", "fotoğraf adı", "dosya" gibi teknik/yazılımsal terimler KULLANMA. Son derece resmi ve profesyonel bir İSG dili kullan (Örn: "Şirket Yüksekte Çalışma Prosedürü ihlal edilmiştir" şeklinde yaz).

  Lütfen sadece aşağıdaki JSON formatında cevap ver, hiçbir ek açıklama yapma:
{
  "riskLevel": "Düşük/Orta/Yüksek/Kritik",
  "accidentType": "Düşme/Sıkışma/Kesik/Yanık/Elektrik/Diğer",
  "selectedRulePhoto": "secilen_dosya_adi.jpg VEYA null",
  "problemDefinition": "Kazanın/Problemin kısa ve net tanımı",
  "fiveWhys": [
    { "step": "1. Neden", "question": "Personel neden düştü?", "answer": "...", "evidence": "..." },
    { "step": "2. Neden", "question": "Zemin neden kaygandı?", "answer": "...", "evidence": "..." },
    { "step": "3. Neden", "question": "Makineden neden yağ sızdı?", "answer": "...", "evidence": "..." },
    { "step": "4. Neden", "question": "Conta neden yırtıldı?", "answer": "...", "evidence": "..." },
    { "step": "5. Neden", "question": "Bakımlar neden gecikti?", "answer": "...", "evidence": "..." }
  ],
  "rootCause": "Kazanın temel kök nedeni (5. Neden'den çıkarılan sonuç)",
  "preventiveMeasures": "Kısa özet önlem (Geriye dönük uyumluluk için)",
  "actions": [
    { "no": 1, "action": "Aksiyon açıklaması", "responsible": "İSG / Bakım / Yönetim", "targetDate": "Hemen / 24 Saat / 1 Hafta", "status": "Bekliyor" },
    { "no": 2, "action": "Aksiyon açıklaması", "responsible": "İSG / Bakım / Yönetim", "targetDate": "Hemen / 24 Saat / 1 Hafta", "status": "Bekliyor" }
  ]
}`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [ { role: 'user', parts: parts } ]
    });

    const rawText = response.text;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawText;
    const aiResult = JSON.parse(jsonString);
    
    const safePreventiveMeasures = Array.isArray(aiResult.preventiveMeasures) 
      ? aiResult.preventiveMeasures.join('\n') 
      : aiResult.preventiveMeasures;

    const safeRootCause = Array.isArray(aiResult.rootCause) 
      ? aiResult.rootCause.join('\n') 
      : aiResult.rootCause;

    const finalRulePhotoUrl = (aiResult.selectedRulePhoto && aiResult.selectedRulePhoto !== "null") 
      ? '/kurallar/' + aiResult.selectedRulePhoto 
      : null;

    const accident = await Accident.create({
      department,
      machine,
      description,
      riskLevel: aiResult.riskLevel,
      rootCause: safeRootCause,
      preventiveMeasures: safePreventiveMeasures,
      accidentType: aiResult.accidentType,
      videoUrl: videoUrl,
      locationPhotoUrl: locationPhotoUrl,
      rulePhotoUrl: finalRulePhotoUrl,
      EmployeeId: employeeId,
      problemDefinition: aiResult.problemDefinition || '',
      fiveWhys: aiResult.fiveWhys || [],
      actions: aiResult.actions || []
    });

    const { upsertDocument } = require('./utils/rag');
    const pineconeText = 'Bölüm: ' + department + ', Makine: ' + (machine || 'Yok') + ', Açıklama: ' + description + ', Kök Neden: ' + safeRootCause + ', Önlemler: ' + safePreventiveMeasures;
    upsertDocument('accident_' + accident.id, pineconeText, { 
      type: 'accident_report', 
      department: department 
    }).catch(err => console.error('Pinecone Upsert Hatası:', err));

    res.status(201).json({ message: 'Kaza başarıyla kaydedildi.', data: accident });

  } catch (error) {
    console.error('Kaza kayıt hatası DETAYLARI:', error.message, error.stack, error.status);
    res.status(500).json({ error: 'Sunucu hatası oluştu.', details: error.message });
  }
});

app.get('/api/accidents', async (req, res) => {
  try {
    const accidents = await Accident.findAll({ 
      include: [Employee],
      order: [['createdAt', 'DESC']] 
    });
    res.json(accidents);
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.get('/api/accidents/:id', async (req, res) => {
  try {
    const accident = await Accident.findByPk(req.params.id, {
      include: Employee
    });
    if (!accident) return res.status(404).json({ error: 'Bulunamadı' });
    res.json(accident);
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.post('/api/accidents/batch', async (req, res) => {
  try {
    const accidents = await Accident.bulkCreate(req.body);
    res.status(201).json({ message: 'Toplu ekleme başarılı', data: accidents });
  } catch (error) {
    res.status(500).json({ error: 'Toplu ekleme hatası' });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.findAll({ include: [Accident] });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, { include: [Accident] });
    if (!employee) return res.status(404).json({ error: 'Bulunamadı' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Bulunamadı' });
    await employee.update(req.body);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const totalAccidents = await Accident.count();
    const highRiskAccidents = await Accident.count({ where: { riskLevel: 'Kritik' } });
    const totalEmployees = await Employee.count();
    const untrainedEmployees = await Employee.count({ where: { hasTraining: false } });
    const deptStats = await Accident.findAll({
      attributes: ['department', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['department']
    });
    res.json({ totalAccidents, highRiskAccidents, totalEmployees, untrainedEmployees, departmentStats: deptStats });
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.delete('/api/accidents/:id', async (req, res) => {
  try {
    const accident = await Accident.findByPk(req.params.id);
    if (!accident) return res.status(404).json({ error: 'Bulunamadı' });
    await accident.destroy();
    res.json({ message: 'Silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.get('/api/training/:accidentId', async (req, res) => {
  try {
    const { accidentId } = req.params;
    const accident = await Accident.findByPk(accidentId);
    if (!accident) return res.status(404).json({ error: 'Bulunamadı' });

    let training = await Training.findOne({ where: { AccidentId: accidentId } });
    if (training) {
      return res.json({ content: training.content, quiz: JSON.parse(training.quizData), accident });
    }

    const { queryRelevantContext } = require('./utils/rag');
    const ragContext = await queryRelevantContext(accident.description + ' ' + accident.rootCause, 3);

    let ruleFiles = [];
    try {
      const rulesDir = path.join(__dirname, '../frontend/public/kurallar');
      if (fs.existsSync(rulesDir)) {
        ruleFiles = fs.readdirSync(rulesDir).filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i));
      }
    } catch (e) { console.error("Kural dizini okunamadı", e); }

    const prompt = `Sen A Sınıfı bir İSG Uzmanısın. Aşağıdaki kaza verilerine ve RESMİ MEVZUATA (Pinecone Veritabanı) dayanarak fabrika sahasında çalışanlara verilecek etkili bir "İşbaşı Güvenlik Konuşması (Toolbox Talk)" metni ve 3 soruluk bir sınav (quiz) hazırla.
    
Kaza Açıklaması: "${accident.description}"
Kök Neden: "${accident.rootCause}"
Alınması Gereken Önlemler: "${accident.preventiveMeasures}"

RESMİ MEVZUAT VE GEÇMİŞ DERSLER:
${ragContext}

MEVCUT KURAL FOTOĞRAFLARI:
${ruleFiles.length > 0 ? ruleFiles.join(', ') : 'Yok'}

KURALLAR:
1. Eğitim metni uyarıcı ve koruyucu olmalıdır.
2. Mevzuat bilgilerini metne yedir.
3. Quiz soruları çeldirici olmalı.
4. HER SORU İÇİN BİR SLOGAN YAZ: Kısa, çarpıcı, bazen uyaklı bir iş güvenliği sloganı olmalıdır.
5. HER SORU İÇİN FARKLI BİR KURAL FOTOĞRAFI SEÇ: "MEVCUT KURAL FOTOĞRAFLARI" listesindeki dosya adlarından, o soruyla en alakalı olanı seç. Çeşitlilik olması için 3 soruya da BİRBİRİNDEN FARKLI dosya isimleri seçmeye çalış. Uygun bir görsel yoksa null bırak.

Lütfen SADECE aşağıdaki JSON formatında cevap ver:
{
  "content": "Saha çalışanlarına hitaben yazılmış konuşma metni.",
  "quiz": [
    {
      "questionText": "Soru metni",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "slogan": "KISA KARİKATÜR SLOGANI",
      "rulePhoto": "dosya_adi.jpg"
    }
  ]
}`;

    let rawText = '';
    try {
      const response = await ai.models.generateContent({ model: 'gemini-3.1-flash-lite', contents: prompt });
      rawText = response.text;
    } catch (err) {
      console.error("Yapay Zeka Hata verdi:", err);
      return res.status(500).json({ error: 'Yapay Zeka kotası doldu. Lütfen 1 dakika bekleyin.' });
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawText;
    const aiResult = JSON.parse(jsonString);

    training = await Training.create({
      content: aiResult.content,
      quizData: JSON.stringify(aiResult.quiz),
      AccidentId: accidentId
    });

    res.json({ content: aiResult.content, quiz: aiResult.quiz, accident });

  } catch (error) {
    console.error("Training oluşturma hatası:", error);
    res.status(500).json({ error: 'Hata' });
  }
});

app.get('/api/basic-training', async (req, res) => {
  try {
    let training = await BasicTraining.findOne();
    if (training) {
      return res.json({ content: training.content, quiz: JSON.parse(training.quizData) });
    }

    const prompt = `Sen A Sınıfı bir İSG Uzmanısın. Fabrika sahasında işe yeni başlayacak bir personele verilecek genel bir "Temel İş Sağlığı ve Güvenliği Eğitimi" metni ve 5 soruluk bir sınav (quiz) hazırla.
KURALLAR:
1. Eğitim metni uyarıcı, kuralları kapsayıcı ve koruyucu olmalıdır.
2. İş kazaları, KKD (Kişisel Koruyucu Donanım) kullanımı, acil durumlar gibi temel konuları içersin.
3. Quiz soruları (5 adet) dikkat ölçücü olmalı.
4. HER SORU İÇİN BİR SLOGAN YAZ.
5. "rulePhoto" alanını null bırakabilirsin.

Lütfen SADECE aşağıdaki JSON formatında cevap ver:
{
  "content": "Saha çalışanlarına hitaben yazılmış temel eğitim konuşma metni.",
  "quiz": [
    {
      "questionText": "Soru metni",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "slogan": "KISA SLOGAN",
      "rulePhoto": null
    }
  ]
}`;

    let rawText = '';
    try {
      const response = await ai.models.generateContent({ model: 'gemini-3.1-flash-lite', contents: prompt });
      rawText = response.text;
    } catch (err) {
      console.error("Yapay Zeka Hata verdi:", err);
      return res.status(500).json({ error: 'Yapay Zeka kotası doldu. Lütfen 1 dakika bekleyin.' });
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawText;
    const aiResult = JSON.parse(jsonString);

    training = await BasicTraining.create({
      content: aiResult.content,
      quizData: JSON.stringify(aiResult.quiz),
    });

    res.json({ content: aiResult.content, quiz: aiResult.quiz });

  } catch (error) {
    console.error("Basic Training oluşturma hatası:", error);
    res.status(500).json({ error: 'Hata' });
  }
});

app.get('/api/caricature', (req, res) => {
  const type = (req.query.q || req.query.type || '').toLowerCase();
  const index = parseInt(req.query.index || '0');
  
  let keywords = ['genel', 'baret', 'koruyucu', 'kulaklik', 'gazmaskesi'];
  if (type.includes('sikisma') || type.includes('ezilme') || type.includes('pres')) keywords = ['sikisma', 'ezilme', 'pres', 'ciftel'];
  else if (type.includes('dusme') || type.includes('kayma') || type.includes('yuksek') || type.includes('palet') || type.includes('malzeme')) keywords = ['dusme', 'kayma', 'yuksekte', 'zeminduzeni'];
  else if (type.includes('yangin') || type.includes('patlama') || type.includes('yanma') || type.includes('sicak') || type.includes('yanik')) keywords = ['yangin', 'yanma', 'patlama', 'sicak'];
  else if (type.includes('kaynak')) keywords = ['kaynak'];
  else if (type.includes('vinc') || type.includes('yuk') || type.includes('aski')) keywords = ['vinc', 'yuk', 'askidayuk'];
  else if (type.includes('taslama') || type.includes('capak')) keywords = ['taslama', 'capak', 'yuzsiperligi'];
  else if (type.includes('elektrik')) keywords = ['elektrik'];
  else if (type.includes('bel') || type.includes('kaldirma') || type.includes('tasima')) keywords = ['bel', 'kaldirma', 'tasima'];
  else if (type.includes('kimyasal') || type.includes('asit')) keywords = ['kimya', 'kimyasal', 'asit'];
  else if (type.includes('goz')) keywords = ['goz', 'kkdgozluk'];
  else if (type.includes('forklift') || type.includes('arac')) keywords = ['forklift'];

  const dirPath = path.join(__dirname, '../frontend/public/caricatures');
  
  try {
    const files = fs.readdirSync(dirPath);
    let matchedFiles = files.filter(f => keywords.some(k => f.toLowerCase().includes(k)));
    if (matchedFiles.length === 0) matchedFiles = files.filter(f => f.toLowerCase().includes('genel') || f.toLowerCase().includes('media'));
    if (matchedFiles.length === 0) matchedFiles = files;
    
    matchedFiles.sort();
    const selectedFile = matchedFiles[index % matchedFiles.length];
    res.sendFile(path.join(dirPath, selectedFile));
  } catch (err) {
    res.status(404).send('Resim bulunamadı.');
  }
});

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/knowledge/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya yüklenmedi.' });

    const data = await pdfParse(req.file.buffer);
    const text = data.text;

    // Chunking logic (approx 1000 characters, trying to split by paragraphs)
    const chunks = [];
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';

    for (const p of paragraphs) {
      if ((currentChunk.length + p.length) < 1000) {
        currentChunk += p + '\n\n';
      } else {
        if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
        currentChunk = p + '\n\n';
      }
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());

    let successCount = 0;
    const fileId = Date.now().toString();

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `doc_${fileId}_chunk_${i}`;
      const success = await upsertDocument(chunkId, chunks[i], { 
        source: req.file.originalname, 
        type: 'knowledge_base' 
      });
      if (success) successCount++;
    }

    res.json({ 
      message: 'Dosya başarıyla işlendi ve vektör veritabanına eklendi.',
      totalChunks: chunks.length,
      successfulChunks: successCount
    });
  } catch (error) {
    console.error('PDF işleme hatası:', error);
    res.status(500).json({ error: 'PDF işlenirken sunucu hatası oluştu.' });
  }
});

// ==========================================
// FRONTEND'i BACKEND ÜZERİNDEN SUNMA (DEPLOY)
// ==========================================
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// API olmayan tüm istekleri React'a (index.html) yönlendir
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

sequelize.sync().then(() => {
  app.listen(PORT, () => console.log('Sunucu http://localhost:' + PORT + ' portunda çalışıyor.'));
}).catch(err => console.error('Veritabanı hatası:', err));