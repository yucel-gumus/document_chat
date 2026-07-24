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
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer bg-[#FFEBD3]',
          suruklenmeAktif
            ? 'border-[#9BCEC1] bg-[#FFDBD2]/60 scale-[1.01]'
            : 'border-[#E69B8B] hover:border-[#9BCEC1] hover:bg-[#FFEBD3]/80',
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
              <div className="w-14 h-14 rounded-2xl bg-[#9BCEC1] flex items-center justify-center mx-auto shadow-xs">
                <Loader2 className="h-7 w-7 text-[#2D2320] animate-spin" />
              </div>
              <div>
                <p className="text-base font-bold text-[#2D2320]">
                  Dosyanız İşleniyor...
                </p>
                <p className="text-xs text-[#6B5751] mt-1">
                  Metinler ayıklanıyor ve vektör parçacıklarına dönüştürülüyor
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#FFB6A6] border border-[#E69B8B] flex items-center justify-center mx-auto shadow-xs">
                <Upload className="h-7 w-7 text-[#2D2320]" />
              </div>
              <div>
                <p className="text-base font-bold text-[#2D2320]">
                  Dosyayı buraya sürükleyin veya bilgisayarınızdan seçin
                </p>
                <p className="text-xs text-[#6B5751] mt-1">
                  {SUPPORTED_FILE_TYPES_LABEL} kabul edilir
                </p>
              </div>
              <Button
                variant="outline"
                className="bg-[#9BCEC1] hover:bg-[#82B8AB] text-[#2D2320] font-semibold border-[#82B8AB] rounded-xl h-11 px-5 shadow-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  dosyaSeciciAc();
                }}
              >
                <File className="mr-2 h-4 w-4 text-[#2D2320]" />
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
        <Badge className="bg-[#FFB6A6] text-[#2D2320] border-[#E69B8B] text-xs font-semibold px-3 py-1">
          📄 PDF Dökümanı
        </Badge>
        <Badge className="bg-[#FFB6A6] text-[#2D2320] border-[#E69B8B] text-xs font-semibold px-3 py-1">
          📝 Word (.docx)
        </Badge>
        <Badge className="bg-[#FFB6A6] text-[#2D2320] border-[#E69B8B] text-xs font-semibold px-3 py-1">
          📜 Düz Metin (.txt)
        </Badge>
      </div>

      {/* Hata Mesajı */}
      {hataMesaji && (
        <div className="mt-4 p-3.5 bg-[#FFDBD2] border border-[#E69B8B] rounded-xl flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-900">Yükleme Hatası</p>
            <p className="text-xs font-medium text-red-800 mt-0.5">{hataMesaji}</p>
          </div>
        </div>
      )}

      {/* Bilgi Notu */}
      <div className="mt-4 text-xs text-[#6B5751] text-center space-y-1 font-medium">
        <p>• Maksimum dosya boyutu: <strong>{MAX_FILE_SIZE_MB_LABEL}</strong></p>
        <p>• Yüklenen dökümanlar sadece aktif oturumunuz için saklanır.</p>
      </div>
    </div>
  );
}
