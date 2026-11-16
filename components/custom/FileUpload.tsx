'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IYuklenenDosya, IDosyaYuklemeYaniti, desteklenenDosyaTuruMu } from '@/lib/types';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB_LABEL,
  SUPPORTED_FILE_EXTENSIONS,
  SUPPORTED_FILE_TYPES_LABEL,
} from '@/lib/constants';
import { Upload, File, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onDosyaYuklendi: (dosya: IYuklenenDosya) => void;
  yuklemeDevamEdiyor: boolean;
  setYuklemeDevamEdiyor: (durum: boolean) => void;
}

export function FileUpload({
  onDosyaYuklendi,
  yuklemeDevamEdiyor,
  setYuklemeDevamEdiyor,
}: FileUploadProps) {
  const [suruklenmeAktif, setSuruklenmeAktif] = useState(false);
  const [hataMesaji, setHataMesaji] = useState<string | null>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  const dosyaSecildi = useCallback(
    async (dosyalar: FileList | null) => {
      if (!dosyalar || dosyalar.length === 0) return;

      const dosya = dosyalar[0];
      setHataMesaji(null);

      if (dosyaInputRef.current) {
        dosyaInputRef.current.value = '';
      }

      if (!desteklenenDosyaTuruMu(dosya.type, dosya.name)) {
        setHataMesaji(
          `Desteklenmeyen dosya türü. Lütfen ${SUPPORTED_FILE_TYPES_LABEL} seçin.`
        );
        return;
      }

      if (dosya.size > MAX_FILE_SIZE_BYTES) {
        setHataMesaji(
          `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE_MB_LABEL} dosya yükleyebilirsiniz.`
        );
        return;
      }

      setYuklemeDevamEdiyor(true);

      try {
        const formData = new FormData();
        formData.append('file', dosya);

        const yanit = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        let data: { success?: boolean; data?: IDosyaYuklemeYaniti; error?: string } | null = null;
        try {
          data = await yanit.json();
        } catch {
          data = null;
        }

        if (yanit.ok && data?.success && data.data) {
          const resData = data.data;
          const yuklenenDosya: IYuklenenDosya = {
            id: resData.dosyaId,
            ad: resData.ad,
            boyut: resData.boyut,
            tur: dosya.type,
            yuklenmeTarihi: new Date(),
            metinParcacigiSayisi: resData.metinParcacigiSayisi,
          };
          onDosyaYuklendi(yuklenenDosya);
        } else {
          const errMsg = data?.error || `Dosya yüklenemedi (HTTP ${yanit.status})`;
          throw new Error(errMsg);
        }
      } catch (hata) {
        console.error('Dosya yükleme hatası:', hata);
        setHataMesaji(
          hata instanceof Error ? hata.message : 'Dosya yüklenirken hata oluştu'
        );
      } finally {
        setYuklemeDevamEdiyor(false);
      }
    },
    [onDosyaYuklendi, setYuklemeDevamEdiyor]
  );

  const suruklemeBitti = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setSuruklenmeAktif(false);

      if (!yuklemeDevamEdiyor) {
        dosyaSecildi(e.dataTransfer.files);
      }
    },
    [dosyaSecildi, yuklemeDevamEdiyor]
  );

  const suruklenmeBasladi = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setSuruklenmeAktif(true);
  }, []);

  const suruklenmeDevamEdiyor = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const suruklenmeAyrilildi = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setSuruklenmeAktif(false);
  }, []);

  const dosyaSeciciAc = useCallback(() => {
    if (dosyaInputRef.current && !yuklemeDevamEdiyor) {
      setTimeout(() => {
        dosyaInputRef.current?.click();
      }, 50);
    }
  }, [yuklemeDevamEdiyor]);

  return (
    <div className="w-full select-none">
      {/* Sürükle-Bırak Alanı */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer bg-[#F5F9F5]',
          suruklenmeAktif
            ? 'border-[#EC7D55] bg-[#DBE6DD] scale-[1.01]'
            : 'border-[#BCC7D2] hover:border-[#EC7D55] hover:bg-[#DBE6DD]/45',
          yuklemeDevamEdiyor && 'pointer-events-none opacity-70'
        )}
        onDrop={suruklemeBitti}
        onDragOver={suruklenmeDevamEdiyor}
        onDragEnter={suruklenmeBasladi}
        onDragLeave={suruklenmeAyrilildi}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            dosyaSeciciAc();
          }
        }}
      >
        <div className="space-y-4">
          {yuklemeDevamEdiyor ? (
            <div className="py-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#EC7D55] flex items-center justify-center mx-auto shadow-xs">
                <Loader2 className="h-7 w-7 text-[#253341] animate-spin" />
              </div>
              <div>
                <p className="text-base font-bold text-[#253341]">
                  Dosyanız İşleniyor...
                </p>
                <p className="text-xs text-[#3E5164] mt-1">
                  Metinler ayıklanıyor ve vektör parçacıklarına dönüştürülüyor
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#DCE3EA] border border-[#BCC7D2] flex items-center justify-center mx-auto shadow-xs">
                <Upload className="h-7 w-7 text-[#253341]" />
              </div>
              <div>
                <p className="text-base font-bold text-[#253341]">
                  Dosyayı buraya sürükleyin veya bilgisayarınızdan seçin
                </p>
                <p className="text-xs text-[#3E5164] mt-1">
                  {SUPPORTED_FILE_TYPES_LABEL} kabul edilir
                </p>
              </div>
              <Button
                variant="outline"
                className="bg-[#EC7D55] hover:bg-[#AB421C] text-[#253341] hover:text-[#F5F9F5] font-semibold border-[#EC7D55] hover:border-[#AB421C] rounded-xl h-11 px-5 shadow-xs transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  dosyaSeciciAc();
                }}
              >
                <File className="mr-2 h-4 w-4" />
                Dosya Seç
              </Button>
            </>
          )}
        </div>

        <input
          ref={dosyaInputRef}
          type="file"
          className="hidden"
          accept={SUPPORTED_FILE_EXTENSIONS}
          onChange={(e) => dosyaSecildi(e.target.files)}
          disabled={yuklemeDevamEdiyor}
        />
      </div>

      {/* Format Rozetleri */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <Badge className="bg-[#DCE3EA] text-[#253341] border-[#BCC7D2] text-xs font-semibold px-3 py-1">
          📄 PDF Dökümanı
        </Badge>
        <Badge className="bg-[#DCE3EA] text-[#253341] border-[#BCC7D2] text-xs font-semibold px-3 py-1">
          📝 Word (.docx)
        </Badge>
        <Badge className="bg-[#DCE3EA] text-[#253341] border-[#BCC7D2] text-xs font-semibold px-3 py-1">
          📜 Düz Metin (.txt)
        </Badge>
      </div>

      {/* Hata Mesajı */}
      {hataMesaji && (
        <div className="mt-4 p-3.5 bg-[#F2A488]/25 border border-[#AB421C] rounded-xl flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="h-5 w-5 text-[#AB421C] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#AB421C]">Yükleme Hatası</p>
            <p className="text-xs font-medium text-[#253341] mt-0.5">{hataMesaji}</p>
          </div>
        </div>
      )}

      {/* Bilgi Notu */}
      <div className="mt-4 text-xs text-[#3E5164] text-center space-y-1 font-medium">
        <p>• Maksimum dosya boyutu: <strong className="text-[#253341]">{MAX_FILE_SIZE_MB_LABEL}</strong></p>
        <p>• Yüklenen dökümanlar sadece aktif oturumunuz için saklanır.</p>
      </div>
    </div>
  );
}
