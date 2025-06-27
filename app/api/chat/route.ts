import { NextRequest, NextResponse } from 'next/server';
import { metniVektoreCevir, geminiModel } from '@/lib/google';
import { benzerParcaciklariAra } from '@/lib/pinecone';
import { ISohbetIstegi } from '@/lib/types';

/**
 * RAG prompt'u oluşturur
 * @param kullaniciSorusu - Kullanıcının sorusu
 * @param baglamMetinleri - Pinecone'dan gelen ilgili metin parçacıkları
 * @returns Gemini modeline gönderilecek prompt
 */
function ragPromptOlustur(kullaniciSorusu: string, baglamMetinleri: string[]): string {
  const baglamBirlesmis = baglamMetinleri
    .map((metin, index) => `${index + 1}. ${metin}`)
    .join('\n\n');

  return `Sen bir döküman analiz asistanısın. Görevin, sağlanan bağlam bilgileri temelinde kullanıcının sorusunu cevaplamaktır.

ÖNEMLI KURALLAR:
- SADECE ve SADECE verilen bağlam bilgilerini kullan
- Kendi genel bilgini asla kullanma
- Bağlamda bulunmayan bilgiler hakkında spekülasyon yapma
- Eğer soru bağlamdaki bilgilerle cevaplanamıyorsa, "Bu soruya cevap verebilmek için yüklediğiniz dökümanlarda yeterli bilgi bulunmuyor" de

BAĞLAM BİLGİLERİ:
${baglamBirlesmis}

KULLANICI SORUSU: ${kullaniciSorusu}

CEVAP:`;
}

/**
 * Minimum benzerlik skoru eşiği
 */
const MINIMUM_BENZERLIK_SKORU = 0.5;

/**
 * Maksimum getirilen context sayısı
 */
const MAKSIMUM_CONTEXT_SAYISI = 5;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as ISohbetIstegi;
    const { soru, dosyaId } = body;

    console.log('Chat API çağrıldı:', { soru: soru?.substring(0, 50) + '...', dosyaId });

    // Girdi doğrulama
    if (!soru?.trim()) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Soru boş olamaz.',
      }, { status: 400 });
    }

    // Kullanıcı sorusunu vektöre çevir
    let soruVektoru: number[];
    try {
      soruVektoru = await metniVektoreCevir(soru);
      console.log('Soru vektöre çevrildi, boyut:', soruVektoru.length);
    } catch (hata) {
      console.error('Soru vektöre çevrilirken hata:', hata);
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Soru işlenirken hata oluştu.',
      }, { status: 500 });
    }

    // Pinecone'da benzer parçacıkları ara
    // dosyaId yoksa tüm veriler içinde ara, varsa sadece o dosyada ara
    let benzerParcaciklar;
    try {
      benzerParcaciklar = await benzerParcaciklariAra(
        soruVektoru,
        dosyaId, // undefined olabilir, o zaman tüm veriler içinde arar
        MAKSIMUM_CONTEXT_SAYISI
      );
      
      console.log('Pinecone araması tamamlandı:', {
        bulunanSonucSayisi: benzerParcaciklar.length,
        dosyaId: dosyaId || 'TÜM VERİLER'
      });
    } catch (hata) {
      console.error('Pinecone araması hatası:', hata);
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Döküman araması yapılırken hata oluştu.',
      }, { status: 500 });
    }

    // Yeterli benzerlikte sonuç var mı kontrol et
    const uygunParcaciklar = benzerParcaciklar.filter(
      parcacik => parcacik.skor >= MINIMUM_BENZERLIK_SKORU
    );

    console.log('Uygun parçacık sayısı:', uygunParcaciklar.length);

    if (uygunParcaciklar.length === 0) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Bu soruya cevap verebilmek için yüklediğiniz dökümanlarda yeterli ilgili bilgi bulunamadı.',
      }, { status: 404 });
    }

    // Context metinlerini hazırla
    const baglamMetinleri = uygunParcaciklar.map(parcacik => parcacik.metin);

    // RAG prompt'u oluştur
    const ragPrompt = ragPromptOlustur(soru, baglamMetinleri);

    // Streaming response oluştur
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Gemini streaming başlatılıyor...');
          
          // Gemini modeli ile stream response al
          const result = await geminiModel.generateContentStream(ragPrompt);

          // Stream'i işle
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              const data = JSON.stringify({ content: chunkText });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Stream'i sonlandır
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          console.log('Gemini streaming tamamlandı');
        } catch (hata) {
          console.error('Gemini stream hatası:', hata);
          const errorData = JSON.stringify({ 
            error: 'Cevap oluşturulurken hata oluştu.' 
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // Stream response döndür
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (hata) {
    console.error('Chat API hatası:', hata);
    
    return NextResponse.json({
      success: false,
      data: null,
      error: hata instanceof Error ? hata.message : 'Sohbet işlenirken bilinmeyen bir hata oluştu.',
    }, { status: 500 });
  }
}

/**
 * OPTIONS metodu CORS için gerekli
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 