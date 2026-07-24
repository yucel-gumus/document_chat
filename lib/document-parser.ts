import { CHUNK_WORD_COUNT } from './constants';

/**
 * Metni belirli kelime sayısına sahip parçacıklara (chunk) böler.
 */
export function metniChunklereBol(metin: string, chunkBoyutu = CHUNK_WORD_COUNT): string[] {
  const kelimeler = metin.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < kelimeler.length; i += chunkBoyutu) {
    const chunk = kelimeler.slice(i, i + chunkBoyutu).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }

  return chunks;
}

/**
 * PDF buffer'ından metin çıkarır.
 */
export async function pdfMetniCikar(buffer: Buffer): Promise<string> {
  try {
    const { PdfReader } = await import('pdfreader');

    return new Promise((resolve, reject) => {
      const textChunks: string[] = [];

      new PdfReader().parseBuffer(buffer, (err, item) => {
        if (err) {
          console.error('PDF parsing hatası:', err);
          reject(new Error('PDF dosyası okunamadı veya bozuk.'));
          return;
        }

        if (!item) {
          const fullText = textChunks.join(' ').trim();
          resolve(fullText);
          return;
        }

        if (item.text) {
          textChunks.push(item.text);
        }
      });
    });
  } catch (hata) {
    console.error('PDF metin çıkarma hatası:', hata);
    throw new Error('PDF dosyasından metin çıkarılamadı.');
  }
}

/**
 * DOCX buffer'ından metin çıkarır.
 */
export async function docxMetniCikar(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const sonuc = await mammoth.extractRawText({ buffer });
    return sonuc.value;
  } catch (hata) {
    console.error('DOCX metin çıkarma hatası:', hata);
    throw new Error('DOCX dosyasından metin çıkarılamadı.');
  }
}

/**
 * TXT buffer'ından metin çıkarır.
 */
export async function txtMetniCikar(buffer: Buffer): Promise<string> {
  try {
    return buffer.toString('utf-8');
  } catch (hata) {
    console.error('TXT metin çıkarma hatası:', hata);
    throw new Error('TXT dosyasından metin çıkarılamadı.');
  }
}

/**
 * Dosya türüne veya uzantısına göre metin çıkarma fonksiyonu
 */
export async function dosyadanMetinCikar(
  buffer: Buffer,
  dosyaTuru: string,
  dosyaAdi?: string
): Promise<string> {
  const name = dosyaAdi?.toLowerCase() || '';

  if (dosyaTuru === 'application/pdf' || name.endsWith('.pdf')) {
    return await pdfMetniCikar(buffer);
  }
  if (
    dosyaTuru ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    return await docxMetniCikar(buffer);
  }
  if (dosyaTuru === 'text/plain' || name.endsWith('.txt')) {
    return await txtMetniCikar(buffer);
  }

  throw new Error('Desteklenmeyen dosya türü.');
}
