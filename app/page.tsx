'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DocumentSidebar } from '@/components/custom/DocumentSidebar';
import { FileUploadModal } from '@/components/custom/FileUploadModal';
import { ChatWindow } from '@/components/custom/ChatWindow';
import { IYuklenenDosya, IChatMesaji } from '@/lib/types';
import {
  MessageCircle,
  Database,
  Loader2,
  Menu,
  X,
  Plus,
} from 'lucide-react';

const FILES_STORAGE_KEY = 'document-chat-files-v1';

export default function AnaSayfa() {
  const [yuklenenDosyalar, setYuklenenDosyalar] = useState<IYuklenenDosya[]>([]);
  const hasHydratedFilesRef = useRef(false);
  const [chatMesajlari, setChatMesajlari] = useState<IChatMesaji[]>([]);
  const [yuklemeDurumu, setYuklemeDurumu] = useState<boolean>(false);
  const [veriKontrolEdiliyor, setVeriKontrolEdiliyor] = useState<boolean>(true);
  const [silmeDevamEdiyor, setSilmeDevamEdiyor] = useState<string | null>(null);
  const [mobileSidebarAcik, setMobileSidebarAcik] = useState<boolean>(false);
  const [uploadModalAcik, setUploadModalAcik] = useState<boolean>(false);
  const [pineconeVeriDurumu, setPineconeVeriDurumu] = useState<{
    hasData: boolean;
    totalChunks: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/session', { credentials: 'include' }).catch(() => undefined);

    let restored: IYuklenenDosya[] = [];
    try {
      const saved = window.localStorage.getItem(FILES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          restored = parsed.filter(
            (item): item is IYuklenenDosya =>
              Boolean(item && typeof item.id === 'string' && typeof item.ad === 'string'),
          );
          if (restored.length > 0) {
            setYuklenenDosyalar(restored);
          }
        }
      }
    } catch {
      // Ignore corrupt localStorage entries
    } finally {
      hasHydratedFilesRef.current = true;
    }

    const pineconeVeriKontrolEt = async () => {
      try {
        setVeriKontrolEdiliyor(true);
        const response = await fetch('/api/check-data');
        const data = await response.json();

        const restoredChunks = restored.reduce((t, d) => t + (Number(d.metinParcacigiSayisi) || 0), 0);
        if (restored.length > 0) {
          setPineconeVeriDurumu({
            hasData: true,
            totalChunks: restoredChunks,
            message: 'Önceki oturum dökümanları geri yüklendi.',
          });
        } else if (data.success) {
          setPineconeVeriDurumu({
            hasData: false,
            totalChunks: 0,
            message: data.message || 'Önce döküman yükleyin.',
          });
        } else {
          setPineconeVeriDurumu({
            hasData: false,
            totalChunks: 0,
            message: data.message || 'Henüz döküman yüklenmemiş.',
          });
        }
      } catch (error) {
        console.error('Pinecone veri kontrolü hatası:', error);
        setPineconeVeriDurumu({
          hasData: false,
          totalChunks: 0,
          message: 'Veri kontrolünde hata oluştu.',
        });
      } finally {
        setVeriKontrolEdiliyor(false);
      }
    };

    pineconeVeriKontrolEt();
  }, []);

  useEffect(() => {
    if (!hasHydratedFilesRef.current) return;
    try {
      window.localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(yuklenenDosyalar));
    } catch {
      // Ignore storage quota / private mode errors
    }
  }, [yuklenenDosyalar]);

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
        setYuklenenDosyalar((prev) => prev.filter((d) => d.id !== dosya.id));

        setPineconeVeriDurumu((prev) => {
          const newTotal = (prev?.totalChunks || 0) - dosya.metinParcacigiSayisi;
          return {
            hasData: newTotal > 0,
            totalChunks: Math.max(0, newTotal),
            message: newTotal > 0 ? `${newTotal} parçacık mevcut` : 'Veri yok',
          };
        });

        const silmeMesaji: IChatMesaji = {
          id: Date.now().toString(),
          tur: 'asistan',
          icerik: `"${dosya.ad}" dosyası başarıyla silindi.`,
          zaman: new Date(),
        };
        setChatMesajlari((prev) => [...prev, silmeMesaji]);
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
    setYuklenenDosyalar((prev) => {
      const next = [...prev, dosya];
      setPineconeVeriDurumu({
        hasData: true,
        totalChunks: next.reduce((t, d) => t + d.metinParcacigiSayisi, 0),
        message: 'Bu oturumdaki dökümanlar kullanılıyor.',
      });
      return next;
    });

    const karsilamaMesaji: IChatMesaji = {
      id: Date.now().toString(),
      tur: 'asistan',
      icerik: `Harika! "${dosya.ad}" dosyasını başarıyla yükledim ve ${dosya.metinParcacigiSayisi} parçaya ayırdım. 🎉`,
      zaman: new Date(),
    };

    setChatMesajlari((prev) => [...prev, karsilamaMesaji]);
  };

  const yeniMesajEkle = (mesaj: IChatMesaji) => {
    setChatMesajlari((oncekiMesajlar) => [...oncekiMesajlar, mesaj]);
  };

  const dosyaYuklendi = yuklenenDosyalar.length > 0;
  const oturumDosyaIds = yuklenenDosyalar.map((d) => d.id);
  const oturumParcaSayisi = yuklenenDosyalar.reduce(
    (toplam, d) => toplam + d.metinParcacigiSayisi,
    0
  );

  return (
    <div className="h-screen w-screen bg-[#FFEBD3] flex flex-col overflow-hidden font-sans text-[#2D2320]">
      {/* Dynamic Header Navbar */}
      <header className="h-16 border-b border-[#E69B8B] bg-[#FFB6A6] px-4 lg:px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarAcik(!mobileSidebarAcik)}
            className="lg:hidden h-10 w-10 text-[#2D2320] hover:bg-[#FFEBD3] rounded-xl"
          >
            {mobileSidebarAcik ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* App Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#9BCEC1] border border-[#82B8AB] flex items-center justify-center shadow-xs">
              <MessageCircle className="h-5 w-5 text-[#2D2320]" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-[#2D2320] leading-tight flex items-center gap-2">
                <span>Döküman Sohbet</span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-[#9BCEC1] text-[#2D2320]">
                  KENSAI
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Header Right Status Bar */}
        <div className="flex items-center gap-3">
          {veriKontrolEdiliyor ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6B5751]">
              <Loader2 className="h-4 w-4 animate-spin text-[#2D2320]" />
              <span className="hidden sm:inline">Kontrol ediliyor...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFEBD3] border border-[#E69B8B] text-xs font-semibold text-[#2D2320]">
                <Database className="h-3.5 w-3.5 text-[#55877A]" />
                <span>
                  {dosyaYuklendi
                    ? `${oturumParcaSayisi} Vektör Parçası`
                    : 'Henüz Veri Yok'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${dosyaYuklendi ? 'bg-[#9BCEC1]' : 'bg-[#E69B8B]'
                    }`}
                />
              </div>

              <Button
                onClick={() => setUploadModalAcik(true)}
                className="bg-[#9BCEC1] hover:bg-[#82B8AB] text-[#2D2320] font-semibold text-xs h-9 px-3.5 rounded-xl border border-[#82B8AB] shadow-xs flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Döküman Ekle</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block h-full flex-shrink-0">
          <DocumentSidebar
            yuklenenDosyalar={yuklenenDosyalar}
            dosyaSil={dosyaSil}
            silmeDevamEdiyor={silmeDevamEdiyor}
            onOpenUploadModal={() => setUploadModalAcik(true)}
          />
        </div>

        {/* Mobile Slide-Over Sidebar Drawer */}
        {mobileSidebarAcik && (
          <div className="lg:hidden absolute inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-[#2D2320]/50 backdrop-blur-xs"
              onClick={() => setMobileSidebarAcik(false)}
            />
            <div className="relative w-80 max-w-[85vw] h-full bg-[#FFB6A6] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
              <DocumentSidebar
                yuklenenDosyalar={yuklenenDosyalar}
                dosyaSil={dosyaSil}
                silmeDevamEdiyor={silmeDevamEdiyor}
                onOpenUploadModal={() => {
                  setMobileSidebarAcik(false);
                  setUploadModalAcik(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Central Chat View */}
        <main className="flex-1 flex flex-col h-full bg-[#FFEBD3] relative">
          <ChatWindow
            mesajlar={chatMesajlari}
            onYeniMesaj={yeniMesajEkle}
            dosyaYuklendi={dosyaYuklendi}
            dosyaIds={oturumDosyaIds}
          />
        </main>
      </div>

      {/* Upload Modal */}
      <FileUploadModal
        onDosyaYuklendi={dosyaYuklenmeTamamlandi}
        yuklemeDevamEdiyor={yuklemeDurumu}
        setYuklemeDevamEdiyor={setYuklemeDurumu}
        pineconeVeriDurumu={pineconeVeriDurumu}
        isOpen={uploadModalAcik}
        onClose={() => setUploadModalAcik(false)}
      />
    </div>
  );
}
