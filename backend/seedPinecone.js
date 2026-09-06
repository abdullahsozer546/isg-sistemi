const { upsertDocument } = require('./utils/rag');

const isgRules = [
  {
    id: "kural_1",
    text: "Makine Koruyucularý (Machine Guarding): Hareketli parçasý olan tüm pres, torna ve freze makinelerinde optik bariyer veya fiziksel muhafaza bulunmasý zorunludur. Bakým sýrasýnda koruyucularýn çýkarýlmasý kesinlikle yasaktýr.",
    metadata: { type: "mevzuat", category: "makine" }
  },
  {
    id: "kural_2",
    text: "LOTO / EKED Prosedürü: Bakým veya onarým çalýþmalarý öncesinde makinenin tüm enerji (elektrik, pnömatik, hidrolik) kaynaklarý kesilmeli, kilitlenmeli ve etiketlenmelidir (Lockout/Tagout).",
    metadata: { type: "mevzuat", category: "bakim" }
  },
  {
    id: "kural_3",
    text: "Yüksekte Çalýþma: 1.2 metreden yüksekte yapýlan tüm çalýþmalarda tam korumalý emniyet kemeri (paraþüt tipi) kullanýlmasý ve güvenli bir yaþam hattýna (lifeline) baðlanmasý zorunludur.",
    metadata: { type: "mevzuat", category: "yuksekte_calisma" }
  },
  {
    id: "kural_4",
    text: "KKD (Kiþisel Koruyucu Donaným): Fabrika sahasý içerisinde baret, çelik burunlu iþ ayakkabýsý ve fosforlu yelek kullanýmý istisnasýz zorunludur. Kimyasal alanlarda tam yüz maskesi takýlmalýdýr.",
    metadata: { type: "mevzuat", category: "kkd" }
  },
  {
    id: "kural_5",
    text: "Kaldýrma ve Taþýma: Forklift ve vinç operasyonlarýnda yük altýnda durulmasý kesinlikle yasaktýr. Operatörlerin yetki belgesi (ehliyet) olmasý zorunludur.",
    metadata: { type: "mevzuat", category: "kaldirma" }
  }
];

async function seed() {
  console.log('Pinecone veri tabanýna ÝSG mevzuatlarý yükleniyor...');
  for (const rule of isgRules) {
    try {
      await upsertDocument(rule.id, rule.text, rule.metadata);
      console.log('Yuklendi: ' + rule.id);
    } catch (error) {
      console.error('Hata: ' + rule.id, error.message);
    }
  }
  console.log('Tum mevzuat verileri Pinecone a basariyla eklendi!');
}

seed();
