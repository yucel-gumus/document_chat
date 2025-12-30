'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUploadModal } from '@/components/custom/FileUploadModal';
import { ChatWindow } from '@/components/custom/ChatWindow';
import { IYuklenenDosya, IChatMesaji } from '@/lib/types';
import { MessageCircle, Database, Loader2, Trash2, FileText, X } from 'lucide-react';

export default function AnaSayfa() {
  const [yuklenenDosyalar, setYuklenenDosyalar] = useState<IYuklenenDosya[]>([]);
  const [chatMesajlari, setChatMesajlari] = useState<IChatMesaji[]>([]);
  const [yuklemeDurumu, setYuklemeDurumu] = useState<boolean>(false);
  const [veriKontrolEdiliyor, setVeriKontrolEdiliyor] = useState<boolean>(true);
  const [silmeDevamEdiyor, setSilmeDevamEdiyor] = useState<string | null>(null);
  const [dosyaListesiAcik, setDosyaListesiAcik] = useState<boolean>(false);
  const [pineconeVeriDurumu, setPineconeVeriDurumu] = useState<{
    hasData: boolean;
    totalChunks: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    const pineconeVeriKontrolEt = async () => {
      try {
        console.log('Pinecone veri kontrolü başlatılıyor...');
        setVeriKontrolEdiliyor(true);

        const response = await fetch('/api/check-data');
        const data = await response.json();

        console.log('Pinecone veri kontrolü sonucu:', data);

        if (data.success && data.hasData) {
          setPineconeVeriDurumu({
            hasData: true,
            totalChunks: data.totalChunks,
            message: data.message
          });

          const karsilamaMesaji: IChatMesaji = {
            id: Date.now().toString(),
            tur: 'asistan',
            icerik: `Merhaba! Pinecone'da ${data.totalChunks} adet metin parçacığı bulunuyor. Bu veriler temelinde sorularınızı sorabilirsiniz.`,
            zaman: new Date(),
          };
          setChatMesajlari([karsilamaMesaji]);

        } else {
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

  const dosyaSil = async (dosya: IYuklenenDosya) => {
    const onay = confirm(`"${dosya.ad}" dosyasını silmek istediğinize emin misiniz?`);
    if (!onay) return;

    setSilmeDevamEdiyor(dosya.id);

    try {
      const response = await fetch('/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dosyaId: dosya.id }),
      });

      const data = await response.json();

      if (data.success) {
        setYuklenenDosyalar(prev => prev.filter(d => d.id !== dosya.id));

        setPineconeVeriDurumu(prev => {
          const newTotal = (prev?.totalChunks || 0) - dosya.metinParcacigiSayisi;
          return {
            hasData: newTotal > 0,
            totalChunks: Math.max(0, newTotal),
            message: newTotal > 0 ? `${newTotal} parçacık mevcut` : 'Veri yok'
          };
        });

        const silmeMesaji: IChatMesaji = {
          id: Date.now().toString(),
          tur: 'asistan',
          icerik: `"${dosya.ad}" dosyası başarıyla silindi.`,
          zaman: new Date(),
        };
        setChatMesajlari(prev => [...prev, silmeMesaji]);
      } else {
        throw new Error(data.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      alert(error instanceof Error ? error.message : 'Silme işlemi başarısız');
    } finally {
      setSilmeDevamEdiyor(null);
    }
  };

  const dosyaYuklenmeTamamlandi = (dosya: IYuklenenDosya) => {
    setYuklenenDosyalar(prev => [...prev, dosya]);

    setPineconeVeriDurumu(prev => ({
      hasData: true,
      totalChunks: (prev?.totalChunks || 0) + dosya.metinParcacigiSayisi,
      message: `Toplam ${(prev?.totalChunks || 0) + dosya.metinParcacigiSayisi} metin parçacığı mevcut.`
    }));

    const karsilamaMesaji: IChatMesaji = {
      id: Date.now().toString(),
      tur: 'asistan',
      icerik: `Harika! "${dosya.ad}" dosyasını başarıyla yükledim ve ${dosya.metinParcacigiSayisi} parçaya ayırdım. 🎉`,
      zaman: new Date(),
    };

    setChatMesajlari(prev => [...prev, karsilamaMesaji]);
  };

  const yeniMesajEkle = (mesaj: IChatMesaji) => {
    setChatMesajlari(oncekiMesajlar => [...oncekiMesajlar, mesaj]);
  };

  const dosyaYuklendi = yuklenenDosyalar.length > 0 || (pineconeVeriDurumu?.hasData ?? false);

  const formatBoyut = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-blue-600" />
                Döküman Sohbet
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {veriKontrolEdiliyor ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Kontrol ediliyor...</span>
                </div>
              ) : pineconeVeriDurumu && (
                <>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-slate-700">
                      {pineconeVeriDurumu.hasData
                        ? `${pineconeVeriDurumu.totalChunks} parçacık hazır`
                        : 'Veri yok'
                      }
                    </span>
                    <div className={`w-2 h-2 rounded-full ${pineconeVeriDurumu.hasData ? 'bg-green-500' : 'bg-orange-500'}`} />
                  </div>

                  {yuklenenDosyalar.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDosyaListesiAcik(!dosyaListesiAcik)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Dosyalar ({yuklenenDosyalar.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {dosyaListesiAcik && yuklenenDosyalar.length > 0 && (
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">Yüklenen Dosyalar</h3>
              <Button variant="ghost" size="sm" onClick={() => setDosyaListesiAcik(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {yuklenenDosyalar.map(dosya => (
                <div
                  key={dosya.id}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800 max-w-[150px] truncate">
                      {dosya.ad}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatBoyut(dosya.boyut)} • {dosya.metinParcacigiSayisi} parça
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => dosyaSil(dosya)}
                    disabled={silmeDevamEdiyor === dosya.id}
                  >
                    {silmeDevamEdiyor === dosya.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col">
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

        <div className="flex-1 px-4 pb-4">
          <div className="mx-auto max-w-4xl h-full">
            {veriKontrolEdiliyor ? (
              <Card className="h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
                  <div>
                    <p className="text-lg font-medium text-slate-900">Sistem Hazırlanıyor</p>
                    <p className="text-sm text-slate-600">Mevcut veriler kontrol ediliyor...</p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-[calc(100vh-200px)] flex flex-col shadow-lg">
                <CardHeader className="border-b border-slate-200 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    Sohbet Alanı
                  </CardTitle>
                  <CardDescription>
                    {dosyaYuklendi
                      ? `${yuklenenDosyalar.length > 0 ? yuklenenDosyalar.length + ' dosya yüklendi - ' : ''}Sorularınızı sorun`
                      : 'Sohbet edebilmek için sağ alt köşedeki butona tıklayarak döküman yükleyin'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ChatWindow
                    mesajlar={chatMesajlari}
                    onYeniMesaj={yeniMesajEkle}
                    dosyaYuklendi={dosyaYuklendi}
                    dosyaId={undefined}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <FileUploadModal
        onDosyaYuklendi={dosyaYuklenmeTamamlandi}
        yuklemeDevamEdiyor={yuklemeDurumu}
        setYuklemeDevamEdiyor={setYuklemeDurumu}
        pineconeVeriDurumu={pineconeVeriDurumu}
      />

      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="text-center text-xs text-slate-500">
            🔍 Pinecone Vektör Arama • ⚡ Next.js 14+ App Router
          </div>
        </div>
      </footer>
    </div>
  );
}
