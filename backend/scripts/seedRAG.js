const { upsertDocument } = require('../utils/rag');

const sampleProcedures = [
  {
    id: "proc_001",
    text: "Pres Makinesi Güvenlik Talimatı: Pres makinesini kullanan operatör, çift el kumanda sistemini iptal etmemelidir. Operasyon sırasında ellerin kalıp arasına girmesini önleyen ışık bariyerlerinin aktif ve çalışır durumda olduğu her vardiya başında kontrol edilmelidir.",
    source: "Makine Kullanım Kılavuzu"
  },
  {
    id: "proc_002",
    text: "Forklift Kullanım Talimatı: Depo alanında forklift hız limiti 5 km/s'dir. Sürücülerin koruyucu baret ve reflektif yelek giymesi zorunludur. Kör noktalara yaklaşırken mutlaka korna çalınmalıdır.",
    source: "Depo Güvenlik Prosedürü"
  },
  {
    id: "proc_003",
    text: "Kaynak İşleri Güvenlik Prosedürü: Kaynak atölyesinde çalışan tüm personelin yanmaz koruyucu kıyafet, kaynak maskesi ve deri eldiven kullanması zorunludur. Kaynak yapılan ortamda havalandırma sisteminin sürekli açık olması gerekmektedir.",
    source: "Atölye Güvenlik Talimatı"
  },
  {
    id: "proc_004",
    text: "6331 Sayılı İSG Kanunu Madde 4: İşveren, çalışanların işle ilgili sağlık ve güvenliğini sağlamakla yükümlüdür. İşyerinde alınan tedbirlere uyulup uyulmadığını izler, denetler ve uygunsuzlukların giderilmesini sağlar.",
    source: "Yasal Mevzuat"
  }
];

async function seed() {
  console.log("RAG Veritabanı (Pinecone) dolduruluyor...");
  
  for (const proc of sampleProcedures) {
    console.log(`İşleniyor: ${proc.id}`);
    const success = await upsertDocument(proc.id, proc.text, { source: proc.source });
    if (success) {
      console.log(`Başarılı: ${proc.id}`);
    } else {
      console.error(`HATA: ${proc.id} yüklenemedi.`);
    }
  }
  
  console.log("İşlem tamamlandı. Veritabanı hazır.");
}

seed();
