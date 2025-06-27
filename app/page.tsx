'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileUpload } from '@/components/custom/FileUpload';
import { ChatWindow } from '@/components/custom/ChatWindow';
import { IYuklenenDosya, IChatMesaji } from '@/lib/types';

/**
 * Ana sayfa bileşeni
 * Döküman yükleme ve sohbet işlevlerini içerir
 */
export default function AnaSayfa() {
  const [yuklenenDosya, setYuklenenDosya] = useState<IYuklenenDosya | null>(
    null
  );
  const [chatMesajlari, setChatMesajlari] = useState<IChatMesaji[]>([]);
  const [yuklemeDurumu, setYuklemeDurumu] = useState<boolean>(false);

  /**
   * Dosya yükleme tamamlandığında çalışır
   * @param dosya - Yüklenen dosya bilgileri
   */
  const dosyaYuklenmeTamamlandi = (dosya: IYuklenenDosya) => {
    setYuklenenDosya(dosya);
    // Karşılama mesajı ekle
    const karsilamaMesaji: IChatMesaji = {
      id: Date.now().toString(),
      tur: 'asistan',
      icerik: `Merhaba! "${dosya.ad}" dosyanızı başarıyla yükledim. ${dosya.metinParcacigiSayisi} metin parçacığına ayırdım. Şimdi bu döküman hakkında sorularınızı sorabilirsiniz.`,
      zaman: new Date(),
    };
    setChatMesajlari([karsilamaMesaji]);
  };

  /**
   * Yeni chat mesajı ekler
   * @param mesaj - Eklenecek mesaj
   */
  const yeniMesajEkle = (mesaj: IChatMesaji) => {
    setChatMesajlari(oncekiMesajlar => [...oncekiMesajlar, mesaj]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Başlık ve Açıklama */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Döküman Sohbet Uygulaması
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            PDF, Word veya metin dosyalarınızı yükleyin ve yapay zeka ile
            dökümanınız hakkında sohbet edin. Gemini 2.0 modeli sayesinde
            sorularınıza anlamlı cevaplar alın.
          </p>
        </div>

        <Separator className="my-8" />

        {/* Ana İçerik Alanı */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Panel - Dosya Yükleme */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📄 Döküman Yükleme
              </CardTitle>
              <CardDescription>
                PDF, Word (.docx) veya metin (.txt) dosyalarınızı buraya
                yükleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onDosyaYuklendi={dosyaYuklenmeTamamlandi}
                yuklemeDevamEdiyor={yuklemeDurumu}
                setYuklemeDevamEdiyor={setYuklemeDurumu}
              />

              {/* Yüklenen Dosya Bilgisi */}
              {yuklenenDosya && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">
                    ✅ Dosya Başarıyla Yüklendi
                  </h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>
                      <strong>Dosya:</strong> {yuklenenDosya.ad}
                    </p>
                    <p>
                      <strong>Boyut:</strong>{' '}
                      {(yuklenenDosya.boyut / 1024).toFixed(1)} KB
                    </p>
                    <p>
                      <strong>Metin Parçacığı:</strong>{' '}
                      {yuklenenDosya.metinParcacigiSayisi} adet
                    </p>
                    <p>
                      <strong>Yüklenme Tarihi:</strong>{' '}
                      {yuklenenDosya.yuklenmeTarihi.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sağ Panel - Sohbet Alanı */}
          <Card className="flex flex-col h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💬 Sohbet Alanı
              </CardTitle>
              <CardDescription>
                {yuklenenDosya
                  ? `"${yuklenenDosya.ad}" hakkında sorularınızı sorun`
                  : 'Sohbet edebilmek için önce bir döküman yükleyin'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ChatWindow
                mesajlar={chatMesajlari}
                onYeniMesaj={yeniMesajEkle}
                dosyaYuklendi={!!yuklenenDosya}
                dosyaId={yuklenenDosya?.id}
              />
            </CardContent>
          </Card>
        </div>

        {/* Alt Bilgi */}
        <div className="text-center text-sm text-slate-500 mt-8">
          <p>
            🤖 Gemini 2.0 Flash ile desteklenen • 🔍 Pinecone vektör arama • ⚡
            Next.js 14+ App Router
          </p>
        </div>
      </div>
    </div>
  );
}
