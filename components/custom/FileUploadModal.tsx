'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from './FileUpload';
import { IYuklenenDosya } from '@/lib/types';
import { SUPPORTED_FILE_TYPES_LABEL } from '@/lib/constants';
import { Upload, X, Plus, Database, Sparkles } from 'lucide-react';

interface FileUploadModalProps {
  onDosyaYuklendi: (dosya: IYuklenenDosya) => void;
  yuklemeDevamEdiyor: boolean;
  setYuklemeDevamEdiyor: (durum: boolean) => void;
  pineconeVeriDurumu?: {
    hasData: boolean;
    totalChunks: number;
    message: string;
  } | null;
}

export function FileUploadModal({
  onDosyaYuklendi,
  yuklemeDevamEdiyor,
  setYuklemeDevamEdiyor,
  pineconeVeriDurumu,
  isOpen,
  onClose,
}: FileUploadModalProps & { isOpen?: boolean; onClose?: () => void }) {
  const [internalModalAcik, setInternalModalAcik] = useState(false);

  const modalAcik = isOpen !== undefined ? isOpen : internalModalAcik;

  const modalKapat = () => {
    if (!yuklemeDevamEdiyor) {
      if (onClose) onClose();
      else setInternalModalAcik(false);
    }
  };

  const dosyaYuklendi = (dosya: IYuklenenDosya) => {
    onDosyaYuklendi(dosya);
    setTimeout(() => {
      modalKapat();
    }, 1500);
  };

  return (
    <>
      {/* Floating Action Button (lg altı ekranlar için) */}
      {isOpen === undefined && (
        <div className="fixed bottom-6 right-6 z-40 lg:hidden">
          <Button
            onClick={() => setInternalModalAcik(true)}
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-[#9BCEC1] hover:bg-[#82B8AB] text-[#2D2320] border border-[#82B8AB]"
            size="icon"
          >
            {pineconeVeriDurumu?.hasData ? (
              <Plus className="h-6 w-6" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
          </Button>
        </div>
      )}

      {/* Modal Overlay */}
      {modalAcik && (
        <div className="fixed inset-0 bg-[#2D2320]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            onClick={modalKapat}
          />

          {/* Modal Content */}
          <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl bg-[#FFEBD3] border-[#E69B8B] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={modalKapat}
              disabled={yuklemeDevamEdiyor}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl text-[#2D2320] hover:bg-[#FFB6A6] transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <CardHeader className="pb-3 border-b border-[#E69B8B] bg-[#FFB6A6]/30">
              <CardTitle className="flex items-center gap-3 text-xl text-[#2D2320]">
                <div className="w-10 h-10 rounded-xl bg-[#9BCEC1] flex items-center justify-center text-[#2D2320]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span>Döküman Yükleme</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#6B5751] font-medium">
                {pineconeVeriDurumu?.hasData
                  ? 'Mevcut dökümanlarınıza yeni dosyalar ekleyin'
                  : `${SUPPORTED_FILE_TYPES_LABEL} dosyalarınızı yükleyin`
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <FileUpload
                onDosyaYuklendi={dosyaYuklendi}
                yuklemeDevamEdiyor={yuklemeDevamEdiyor}
                setYuklemeDevamEdiyor={setYuklemeDevamEdiyor}
              />

              {pineconeVeriDurumu?.hasData && (
                <div className="p-4 bg-[#FFB6A6]/40 border border-[#E69B8B] rounded-xl shadow-xs">
                  <h3 className="font-bold text-xs text-[#2D2320] mb-1.5 flex items-center gap-2">
                    <Database className="h-4 w-4 text-[#55877A]" />
                    Mevcut Veri Durumu
                  </h3>
                  <div className="text-xs text-[#6B5751] space-y-1 font-medium">
                    <p>
                      <strong>Toplam Metin Parçacığı:</strong>{' '}
                      <span className="text-[#2D2320] font-bold">{pineconeVeriDurumu.totalChunks} adet</span>
                    </p>
                    <p className="text-[#55877A] font-semibold">
                      ✓ Sohbet etmeye hazır
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}