import { NextResponse } from 'next/server';
import { benzerParcaciklariAra } from '@/lib/pinecone';
import { metniVektoreCevir } from '@/lib/google';

/**
 * Pinecone'da veri olup olmadığını kontrol eden API
 * Uygulama açıldığında çağrılır
 */
export async function GET(): Promise<NextResponse> {
  try {
    console.log('Pinecone veri kontrolü başlatıldı...');

    // Environment variables kontrolü
    if (!process.env.GOOGLE_AI_API_KEY || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
      return NextResponse.json({
        success: false,
        hasData: false,
        error: 'Sunucu yapılandırma hatası',
      }, { status: 500 });
    }

    try {
      // Basit bir test sorgusu ile Pinecone'da veri olup olmadığını kontrol et
      // Rastgele bir vektörle arama yap, sonuç sayısına bak
      const testVektor = await metniVektoreCevir('test sorgulama');
      const sonuclar = await benzerParcaciklariAra(testVektor, undefined, 1);
      
      console.log('Pinecone kontrol sonucu:', {
        sonucSayisi: sonuclar.length,
        hasData: sonuclar.length > 0
      });

      if (sonuclar.length > 0) {
        // Veri var - tüm chunks'ların sayısını al
        const tumSonuclar = await benzerParcaciklariAra(testVektor, undefined, 100);
        
        return NextResponse.json({
          success: true,
          hasData: true,
          totalChunks: tumSonuclar.length,
          message: `Pinecone'da ${tumSonuclar.length} metin parçacığı bulundu. Sohbet etmeye başlayabilirsiniz!`,
          error: null,
        });
      } else {
        return NextResponse.json({
          success: true,
          hasData: false,
          totalChunks: 0,
          message: 'Henüz hiç döküman yüklenmemiş. Sohbet edebilmek için önce bir döküman yükleyin.',
          error: null,
        });
      }

    } catch (pineconeError) {
      console.error('Pinecone bağlantı hatası:', pineconeError);
      
      return NextResponse.json({
        success: false,
        hasData: false,
        error: 'Veritabanı bağlantı hatası. Lütfen daha sonra tekrar deneyin.',
      }, { status: 500 });
    }

  } catch (hata) {
    console.error('Veri kontrolü genel hatası:', hata);
    
    return NextResponse.json({
      success: false,
      hasData: false,
      error: hata instanceof Error ? hata.message : 'Veri kontrolünde bilinmeyen hata oluştu.',
    }, { status: 500 });
  }
} 