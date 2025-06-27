'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IYuklenenDosya, desteklenenDosyaTuruMu } from '@/lib/types';
import { Upload, File, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onDosyaYuklendi: (dosya: IYuklenenDosya) => void;
  yuklemeDevamEdiyor: boolean;
  setYuklemeDevamEdiyor: (durum: boolean) => void;
}

/**
 * Sürükle-bırak destekli dosya yükleme bileşeni
 * PDF, Word ve metin dosyalarını destekler
 */
export function FileUpload({
  onDosyaYuklendi,
  yuklemeDevamEdiyor,
  setYuklemeDevamEdiyor,
}: FileUploadProps) {
  const [suruklenmeAktif, setSuruklenmeAktif] = useState(false);
  const [hataMesaji, setHataMesaji] = useState<string | null>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  /**
   * Dosya seçildiğinde çalışır
   */
  const dosyaSecildi = useCallback(
    async (dosyalar: FileList | null) => {
      if (!dosyalar || dosyalar.length === 0) return;

      const dosya = dosyalar[0];
      setHataMesaji(null);

      // Dosya türü kontrolü
      if (!desteklenenDosyaTuruMu(dosya.type)) {
        setHataMesaji(
          'Desteklenmeyen dosya türü. Lütfen PDF, Word (.docx) veya metin (.txt) dosyası seçin.'
        );
        return;
      }

      // Dosya boyutu kontrolü (10MB limit)
      const maksimumBoyut = 10 * 1024 * 1024; // 10MB
      if (dosya.size > maksimumBoyut) {
        setHataMesaji(
          'Dosya boyutu çok büyük. Maksimum 10MB dosya yükleyebilirsiniz.'
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

        if (!yanit.ok) {
          throw new Error(`HTTP ${yanit.status}: ${yanit.statusText}`);
        }

        const data = await yanit.json();

        if (data.success) {
          const yuklenenDosya: IYuklenenDosya = {
            id: data.data.dosyaId,
            ad: data.data.ad,
            boyut: data.data.boyut,
            tur: dosya.type,
            yuklenmeTarihi: new Date(),
            metinParcacigiSayisi: data.data.metinParcacigiSayisi,
          };
          onDosyaYuklendi(yuklenenDosya);
        } else {
          throw new Error(data.error || 'Dosya yüklenirken hata oluştu');
        }
      } catch (hata) {
        console.error('Dosya yükleme hatası:', hata);
        setHataMesaji(
          hata instanceof Error ? hata.message : 'Dosya yüklenirken hata oluştu'
        );
      } finally {
        setYuklemeDevamEdiyor(false);
        // Input'u temizle
        if (dosyaInputRef.current) {
          dosyaInputRef.current.value = '';
        }
      }
    },
    [onDosyaYuklendi, setYuklemeDevamEdiyor]
  );

  /**
   * Sürükle-bırak olayları
   */
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

  /**
   * Dosya seçici açma
   */
  const dosyaSeciciAc = () => {
    if (dosyaInputRef.current && !yuklemeDevamEdiyor) {
      dosyaInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      {/* Sürükle-Bırak Alanı */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
          suruklenmeAktif
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50',
          yuklemeDevamEdiyor && 'pointer-events-none opacity-60'
        )}
        onDrop={suruklemeBitti}
        onDragOver={suruklenmeDevamEdiyor}
        onDragEnter={suruklenmeBasladi}
        onDragLeave={suruklenmeAyrilildi}
        onClick={dosyaSeciciAc}
      >
        <div className="space-y-4">
          {yuklemeDevamEdiyor ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
              <div>
                <p className="text-lg font-medium text-slate-900">
                  Dosya işleniyor...
                </p>
                <p className="text-sm text-slate-600">
                  Dökümanınız analiz ediliyor ve vektöre çevriliyor
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <div>
                <p className="text-lg font-medium text-slate-900">
                  Dosyayı buraya sürükleyin veya seçin
                </p>
                <p className="text-sm text-slate-600">
                  PDF, Word (.docx) veya metin (.txt) dosyaları desteklenir
                </p>
              </div>
              <Button
                variant="outline"
                className="mx-auto"
                onClick={dosyaSeciciAc}
              >
                <File className="mr-2 h-4 w-4" />
                Dosya Seç
              </Button>
            </>
          )}
        </div>

        {/* Gizli dosya inputu */}
        <input
          ref={dosyaInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={e => dosyaSecildi(e.target.files)}
          disabled={yuklemeDevamEdiyor}
        />
      </div>

      {/* Desteklenen Dosya Türleri */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <Badge variant="secondary" className="text-xs">
          📄 PDF
        </Badge>
        <Badge variant="secondary" className="text-xs">
          📝 Word (.docx)
        </Badge>
        <Badge variant="secondary" className="text-xs">
          📜 Metin (.txt)
        </Badge>
      </div>

      {/* Hata Mesajı */}
      {hataMesaji && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Hata</p>
            <p className="text-sm text-red-700">{hataMesaji}</p>
          </div>
        </div>
      )}

      {/* Bilgi Notu */}
      <div className="mt-4 text-xs text-slate-500 text-center">
        <p>• Maksimum dosya boyutu: 10MB</p>
        <p>
          • Dosyanız güvenli bir şekilde işlenir ve sadece bu oturum için
          saklanır
        </p>
      </div>
    </div>
  );
}
