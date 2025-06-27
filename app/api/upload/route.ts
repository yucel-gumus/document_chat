import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { metniVektoreCevir } from '@/lib/google';
import { dokumanParcaciginiKaydet } from '@/lib/pinecone';
import {
  IApiYaniti,
  IDosyaYuklemeYaniti,
  desteklenenDosyaTuruMu,
} from '@/lib/types';

/**
 * Maksimum dosya boyutu (10MB)
 */
const MAKSIMUM_DOSYA_BOYUTU = 10 * 1024 * 1024;

/**
 * Chunk boyutu (kelime sayısı)
 */
const CHUNK_KELIME_SAYISI = 500;

/**
 * Metni chunklara böler
 * @param metin - Bölünecek metin
 * @returns Metin chunks'ları
 */
function metniChunklereBol(metin: string): string[] {
  const kelimeler = metin.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < kelimeler.length; i += CHUNK_KELIME_SAYISI) {
    const chunk = kelimeler.slice(i, i + CHUNK_KELIME_SAYISI).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

/**
 * PDF dosyasından metin çıkarır
 * @param buffer - PDF dosya buffer'ı
 * @returns Çıkarılan metin
 */
async function pdfMetniCikar(buffer: Buffer): Promise<string> {
  try {
    console.log('pdfreader ile metin çıkarılıyor...');
    
    // pdfreader kütüphanesini dinamik olarak yükle
    const { PdfReader } = await import('pdfreader');
    
    return new Promise((resolve, reject) => {
      const textChunks: string[] = [];
      let currentPage = 0;
      
      new PdfReader().parseBuffer(buffer, (err, item) => {
        if (err) {
          console.error('PDF parsing hatası:', err);
          reject(new Error('PDF dosyası okunamadı'));
          return;
        }
        
        if (!item) {
          // Parsing tamamlandı
          const fullText = textChunks.join(' ').trim();
          console.log(`PDF metin çıkarma tamamlandı, toplam uzunluk: ${fullText.length}`);
          resolve(fullText);
          return;
        }
        
        if (item.page) {
          // Yeni sayfa
          currentPage = item.page;
          console.log(`Sayfa ${currentPage} işleniyor...`);
        } else if (item.text) {
          // Metin bulundu
          textChunks.push(item.text);
        }
      });
    });
    
  } catch (hata) {
    console.error('PDF metin çıkarma hatası:', hata);
    throw new Error('PDF dosyasından metin çıkarılamadı');
  }
}

/**
 * DOCX dosyasından metin çıkarır
 * @param buffer - DOCX dosya buffer'ı
 * @returns Çıkarılan metin
 */
async function docxMetniCikar(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const sonuc = await mammoth.extractRawText({ buffer });
    return sonuc.value;
  } catch (hata) {
    console.error('DOCX metin çıkarma hatası:', hata);
    throw new Error('DOCX dosyasından metin çıkarılamadı');
  }
}

/**
 * TXT dosyasından metin çıkarır
 * @param buffer - TXT dosya buffer'ı
 * @returns Çıkarılan metin
 */
async function txtMetniCikar(buffer: Buffer): Promise<string> {
  try {
    return buffer.toString('utf-8');
  } catch (hata) {
    console.error('TXT metin çıkarma hatası:', hata);
    throw new Error('TXT dosyasından metin çıkarılamadı');
  }
}

/**
 * Dosya türüne göre metin çıkarır
 * @param buffer - Dosya buffer'ı
 * @param dosyaTuru - MIME türü
 * @returns Çıkarılan metin
 */
async function dosyadanMetinCikar(buffer: Buffer, dosyaTuru: string): Promise<string> {
  switch (dosyaTuru) {
    case 'application/pdf':
      return await pdfMetniCikar(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await docxMetniCikar(buffer);
    case 'text/plain':
      return await txtMetniCikar(buffer);
    default:
      throw new Error('Desteklenmeyen dosya türü');
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<IApiYaniti<IDosyaYuklemeYaniti>>> {
  try {
    console.log('Upload API çağrıldı');
    
    // Environment variables kontrolü
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('GOOGLE_AI_API_KEY environment variable eksik!');
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Sunucu yapılandırma hatası: Google AI API anahtarı bulunamadı.',
      }, { status: 500 });
    }

    if (!process.env.PINECONE_API_KEY) {
      console.error('PINECONE_API_KEY environment variable eksik!');
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Sunucu yapılandırma hatası: Pinecone API anahtarı bulunamadı.',
      }, { status: 500 });
    }

    if (!process.env.PINECONE_INDEX_NAME) {
      console.error('PINECONE_INDEX_NAME environment variable eksik!');
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Sunucu yapılandırma hatası: Pinecone index adı bulunamadı.',
      }, { status: 500 });
    }

    // FormData'yı al
    const formData = await req.formData();
    console.log('FormData alındı');
    
    const dosya = formData.get('file') as File;
    console.log('Dosya bilgisi:', {
      name: dosya?.name,
      type: dosya?.type,
      size: dosya?.size
    });
    
    if (!dosya) {
      console.error('Dosya bulunamadı');
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Dosya bulunamadı.',
      }, { status: 400 });
    }
    
    // Dosya türü kontrolü
    if (!desteklenenDosyaTuruMu(dosya.type)) {
      console.error('Desteklenmeyen dosya türü:', dosya.type);
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Desteklenmeyen dosya türü. Sadece PDF, DOCX ve TXT dosyaları kabul edilir.',
      }, { status: 400 });
    }

    // Dosya boyutu kontrolü
    if (dosya.size > MAKSIMUM_DOSYA_BOYUTU) {
      console.error('Dosya çok büyük:', dosya.size);
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Dosya çok büyük. Maksimum 10MB boyutunda dosya yükleyebilirsiniz.',
      }, { status: 400 });
    }

    // Benzersiz dosya ID'si oluştur
    const dosyaId = uuidv4();
    console.log('Dosya ID oluşturuldu:', dosyaId);

    // Dosyayı buffer'a çevir
    console.log('Dosya buffer\'a çevriliyor...');
    const arrayBuffer = await dosya.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer oluşturuldu, boyut:', buffer.length);

    // Dosyadan metin çıkar
    console.log('Metin çıkarılıyor...');
    const metin = await dosyadanMetinCikar(buffer, dosya.type);
    console.log('Metin çıkarıldı, uzunluk:', metin.length);
    
    if (!metin.trim()) {
      console.error('Metin boş');
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Dosyadan metin çıkarılamadı veya dosya boş.',
      }, { status: 400 });
    }

    // Metni chunklara böl
    console.log('Metin chunklara bölünüyor...');
    const chunks = metniChunklereBol(metin);
    console.log('Chunks oluşturuldu, sayı:', chunks.length);
    
    if (chunks.length === 0) {
      console.error('Chunks boş');
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Metin chunklara bölünemedi.',
      }, { status: 400 });
    }

    // Her chunk için embedding oluştur ve Pinecone'a kaydet
    console.log('Embedding\'ler oluşturuluyor ve Pinecone\'a kaydediliyor...');
    const kaydetmePromises = chunks.map(async (chunk, index) => {
      try {
        console.log(`Chunk ${index + 1}/${chunks.length} işleniyor...`);
        
        // Embedding oluştur
        const vektor = await metniVektoreCevir(chunk);
        console.log(`Chunk ${index + 1} embedding oluşturuldu, boyut:`, vektor.length);
        
        // Chunk ID'si oluştur
        const chunkId = `${dosyaId}_chunk_${index}`;
        
        // Pinecone'a kaydet
        await dokumanParcaciginiKaydet(chunkId, chunk, vektor, dosyaId);
        console.log(`Chunk ${index + 1} Pinecone'a kaydedildi`);
        
        return true;
      } catch (hata) {
        console.error(`Chunk ${index} kaydedilirken hata:`, hata);
        throw hata;
      }
    });

    // Tüm chunk'ları paralel olarak kaydet
    await Promise.all(kaydetmePromises);
    console.log('Tüm chunks başarıyla kaydedildi');

    // Başarılı yanıt dön
    const response = {
      success: true,
      data: {
        dosyaId,
        ad: dosya.name || 'Bilinmeyen Dosya',
        boyut: dosya.size,
        metinParcacigiSayisi: chunks.length,
      },
      error: null,
    };
    
    console.log('Başarılı response dönülüyor:', response);
    return NextResponse.json(response);

  } catch (hata) {
    console.error('Dosya yükleme hatası (detaylı):', {
      message: hata instanceof Error ? hata.message : 'Bilinmeyen hata',
      stack: hata instanceof Error ? hata.stack : undefined,
      name: hata instanceof Error ? hata.name : undefined
    });
    
    return NextResponse.json({
      success: false,
      data: null,
      error: hata instanceof Error ? hata.message : 'Dosya yüklenirken bilinmeyen bir hata oluştu.',
    }, { status: 500 });
  }
} 