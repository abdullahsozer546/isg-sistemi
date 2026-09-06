const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ override: true });

// API Anahtarları kontrolü
if (!process.env.PINECONE_API_KEY || !process.env.GEMINI_API_KEY) {
  console.warn("DİKKAT: Pinecone veya Gemini API Key eksik. RAG sistemi çalışmayacak.");
}

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'dummy_key',
});

const indexName = process.env.PINECONE_INDEX_NAME || 'isg-index';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Metni Vektöre Dönüştür (Gemini Embedding via Fetch)
async function getEmbedding(text) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-2',
        content: { parts: [{ text: text }] },
        outputDimensionality: 768
      })
    });
    
    if (!response.ok) {
      throw new Error(`Google API Hatası: ${response.status}`);
    }
    
    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error("Embedding oluşturma hatası:", error);
    return null;
  }
}

// Veritabanına Döküman Ekle (Semple data yüklemek için kullanılacak)
async function upsertDocument(id, text, metadata = {}) {
  try {
    const embedding = await getEmbedding(text);
    if (!embedding) return false;

    const index = pc.index(indexName);
    
    await index.upsert({
      records: [{
        id: id,
        values: embedding,
        metadata: { text, ...metadata }
      }]
    });

    console.log(`Döküman Pinecone'a eklendi: ${id}`);
    return true;
  } catch (error) {
    console.error("Pinecone Upsert hatası:", error);
    return false;
  }
}

// Kaza tanımlaması geldiğinde, ilgili eski kaza veya prosedürleri getirir
async function queryRelevantContext(queryText, topK = 3) {
  try {
    const queryEmbedding = await getEmbedding(queryText);
    if (!queryEmbedding) return "";

    const index = pc.index(indexName);
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
    });

    if (queryResponse.matches.length === 0) return "İlgili geçmiş veri bulunamadı.";

    const contextStrings = queryResponse.matches.map(match => {
      const meta = match.metadata || {};
      return `[Skor: ${match.score.toFixed(2)}] Kaynak: ${meta.source || 'Belirsiz'} - Metin: ${meta.text || 'Metin yok'}`;
    });

    return contextStrings.join('\n\n');
  } catch (error) {
    console.error("Pinecone Query hatası:", error);
    return "";
  }
}

module.exports = { getEmbedding, upsertDocument, queryRelevantContext };
