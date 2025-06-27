'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileUploadModal } from '@/components/custom/FileUploadModal';
import { ChatWindow } from '@/components/custom/ChatWindow';
import { IYuklenenDosya, IChatMesaji } from '@/lib/types';
import { MessageCircle, Database, Loader2 } from 'lucide-react';

/**
 * Ana sayfa bileşeni
 * Döküman yükleme ve sohbet işlevlerini içerir
 */
export default function AnaSayfa() {
  const [yuklenenDosya, setYuklenenDosya] = useState<IYuklenenDosya | null>(null);
  const [chatMesajlari, setChatMesajlari] = useState<IChatMesaji[]>([]);
  const [yuklemeDurumu, setYuklemeDurumu] = useState<boolean>(false);
  const [veriKontrolEdiliyor, setVeriKontrolEdiliyor] = useState<boolean>(true);
  const [pineconeVeriDurumu, setPineconeVeriDurumu] = useState<{
    hasData: boolean;
    totalChunks: number;
    message: string;
  } | null>(null);

  /**
   * Sayfa yüklendiğinde Pinecone'da veri olup olmadığını kontrol et
   */
  useEffect(() => {
    const pineconeVeriKontrolEt = async () => {
      try {
        console.log('Pinecone veri kontrolü başlatılıyor...');
        setVeriKontrolEdiliyor(true);

        const response = await fetch('/api/check-data');
        const data = await response.json();

        console.log('Pinecone veri kontrolü sonucu:', data);

        if (data.success && data.hasData) {
          // Pinecone'da veri var - sohbet modunu aktif et
          setPineconeVeriDurumu({
            hasData: true,
            totalChunks: data.totalChunks,
            message: data.message
          });

          // Sanal bir dosya objesi oluştur (sohbet için gerekli)
          const sanalDosya: IYuklenenDosya = {
            id: 'pinecone-data',
            ad: 'Mevcut Dökümanlar',
            boyut: 0,
            tur: 'application/pinecone',
            yuklenmeTarihi: new Date(),
            metinParcacigiSayisi: data.totalChunks,
          };
          setYuklenenDosya(sanalDosya);

          // Karşılama mesajı ekle
          const karsilamaMesaji: IChatMesaji = {
            id: Date.now().toString(),
            tur: 'asistan',
            icerik: `Merhaba! Pinecone'da ${data.totalChunks} adet metin parçacığı bulunuyor. Bu veriler temelinde sorularınızı sorabilirsiniz. Hangi konuda sohbet etmek istersiniz?`,
            zaman: new Date(),
          };
          setChatMesajlari([karsilamaMesaji]);

        } else {
          // Pinecone'da veri yok
          setPineconeVeriDurumu({
            hasData: false,
            totalChunks: 0,
            message: data.message || 'Henüz döküman yüklenmemiş.'
          });
        }

      } catch (error) {
        console.error('Pinecone veri kontrolü hatası:', error);
        setPineconeVeriDurumu({
          hasData: false,
          totalChunks: 0,
          message: 'Veri kontrolünde hata oluştu.'
        });
      } finally {
        setVeriKontrolEdiliyor(false);
      }
    };

    pineconeVeriKontrolEt();
  }, []);

  /**
   * Yeni dosya yükleme tamamlandığında çalışır
   * @param dosya - Yüklenen dosya bilgileri
   */
  const dosyaYuklenmeTamamlandi = (dosya: IYuklenenDosya) => {
    setYuklenenDosya(dosya);
    
    // Yeni dosya yüklenince Pinecone durumunu güncelle
    setPineconeVeriDurumu(prev => ({
      hasData: true,
      totalChunks: (prev?.totalChunks || 0) + dosya.metinParcacigiSayisi,
      message: `Toplam ${(prev?.totalChunks || 0) + dosya.metinParcacigiSayisi} metin parçacığı mevcut.`
    }));

    // Karşılama mesajı ekle
    const karsilamaMesaji: IChatMesaji = {
      id: Date.now().toString(),
      tur: 'asistan',
      icerik: `Harika! "${dosya.ad}" dosyasını başarıyla yükledim ve ${dosya.metinParcacigiSayisi} parçaya ayırdım. Artık bu döküman hakkında sorularınızı sorabilirsiniz! 🎉`,
      zaman: new Date(),
    };
    
    // Eğer daha önce mesaj varsa ekle, yoksa yeni liste oluştur
    setChatMesajlari(prev => prev.length > 0 ? [...prev, karsilamaMesaji] : [karsilamaMesaji]);
  };

  /**
   * Yeni chat mesajı ekler
   * @param mesaj - Eklenecek mesaj
   */
  const yeniMesajEkle = (mesaj: IChatMesaji) => {
    setChatMesajlari(oncekiMesajlar => [...oncekiMesajlar, mesaj]);
  };

  const dosyaYuklendi = !!yuklenenDosya;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-blue-600" />
                Döküman Sohbet
              </h1>
            </div>

            {/* Durum Göstergesi */}
            <div className="hidden md:flex items-center gap-3">
              {veriKontrolEdiliyor ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Kontrol ediliyor...</span>
                </div>
              ) : pineconeVeriDurumu && (
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-slate-700">
                    {pineconeVeriDurumu.hasData 
                      ? `${pineconeVeriDurumu.totalChunks} parçacık hazır`
                      : 'Veri yok'
                    }
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    pineconeVeriDurumu.hasData ? 'bg-green-500' : 'bg-orange-500'
                  }`} />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Durum Mesajı - Mobile */}
        {!veriKontrolEdiliyor && pineconeVeriDurumu && (
          <div className="md:hidden p-4">
            <div className="text-center">
              {pineconeVeriDurumu.hasData ? (
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200 text-sm">
                  <span className="text-green-600">✅</span>
                  <span>{pineconeVeriDurumu.totalChunks} parçacık hazır</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200 text-sm">
                  <span className="text-blue-600">📄</span>
                  <span>Döküman yükleyin</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 px-4 pb-4">
          <div className="mx-auto max-w-4xl h-full">
            {veriKontrolEdiliyor ? (
              // Loading State
              <Card className="h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
                  <div>
                    <p className="text-lg font-medium text-slate-900">
                      Sistem Hazırlanıyor
                    </p>
                    <p className="text-sm text-slate-600">
                      Mevcut veriler kontrol ediliyor...
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              // Chat Interface
              <Card className="h-[calc(100vh-200px)] flex flex-col shadow-lg">
                <CardHeader className="border-b border-slate-200 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    Sohbet Alanı
                  </CardTitle>
                  <CardDescription>
                    {dosyaYuklendi
                      ? pineconeVeriDurumu?.hasData 
                        ? 'Yüklediğiniz dökümanlar hakkında sorularınızı sorun'
                        : `"${yuklenenDosya?.ad}" hakkında sorularınızı sorun`
                      : 'Sohbet edebilmek için sağ alt köşedeki butona tıklayarak döküman yükleyin'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ChatWindow
                    mesajlar={chatMesajlari}
                    onYeniMesaj={yeniMesajEkle}
                    dosyaYuklendi={dosyaYuklendi}
                    dosyaId={yuklenenDosya?.id === 'pinecone-data' ? undefined : yuklenenDosya?.id}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* File Upload Modal */}
      <FileUploadModal
        onDosyaYuklendi={dosyaYuklenmeTamamlandi}
        yuklemeDevamEdiyor={yuklemeDurumu}
        setYuklemeDevamEdiyor={setYuklemeDurumu}
        pineconeVeriDurumu={pineconeVeriDurumu}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="text-center text-xs text-slate-500">
            🤖 Gemini 2.0 Flash • 🔍 Pinecone Vektör Arama • ⚡ Next.js 14+ App Router
          </div>
        </div>
      </footer>
    </div>
  );
}
