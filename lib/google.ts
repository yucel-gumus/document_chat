import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Google AI istemcisini başlatır
 * Gemini modeli ve embedding modeli için kullanılır
 */
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

/**
 * Gemini 2.0 modeli referansı
 * Sohbet ve metin üretimi için kullanılır
 */
export const geminiModel = googleAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
});

/**
 * Embedding modeli referansı
 * Metinleri vektöre çevirmek için kullanılır
 */
export const embeddingModel = googleAI.getGenerativeModel({
  model: process.env.EMBEDDING_MODEL || 'text-embedding-004',
});

/**
 * Verilen metni vektöre çevirir
 * @param metin - Vektöre çevrilecek metin
 * @returns Metin vektörü (embedding)
 */
export async function metniVektoreCevir(metin: string): Promise<number[]> {
  try {
    const sonuc = await embeddingModel.embedContent(metin);
    return sonuc.embedding.values;
  } catch (hata) {
    console.error('Metin vektöre çevrilirken hata:', hata);
    throw new Error('Metin vektöre çevrilemedi');
  }
}

/**
 * Gemini modeli ile RAG prompt'u işler (non-streaming)
 * @param prompt - İşlenecek prompt
 * @returns Model yanıtı
 */
export async function geminiIleCevapOlustur(prompt: string) {
  try {
    const sonuc = await geminiModel.generateContent(prompt);
    return sonuc.response.text();
  } catch (hata) {
    console.error('Gemini model yanıtı oluşturulurken hata:', hata);
    throw new Error('Model yanıtı oluşturulamadı');
  }
}

/**
 * Gemini modeli ile RAG prompt'u işler (streaming)
 * @param prompt - İşlenecek prompt
 * @returns Stream response
 */
export async function geminiIleStreamCevapOlustur(prompt: string) {
  try {
    const result = await geminiModel.generateContentStream(prompt);
    return result;
  } catch (hata) {
    console.error('Gemini model stream yanıtı oluşturulurken hata:', hata);
    throw new Error('Model stream yanıtı oluşturulamadı');
  }
}
