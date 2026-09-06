const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function listModels() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.list();
    console.log(response.map(m => m.name).join(', '));
  } catch (err) {
    console.error(err);
  }
}

listModels();
