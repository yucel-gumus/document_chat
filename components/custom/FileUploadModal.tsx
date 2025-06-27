'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from './FileUpload';
import { IYuklenenDosya } from '@/lib/types';
import { Upload, X, FileText, Plus } from 'lucide-react';

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

/**
 * Modal içinde döküman yükleme bileşeni
 * Floating action button ile açılır/kapanır
 */
export function FileUploadModal({
  onDosyaYuklendi,
  yuklemeDevamEdiyor,
  setYuklemeDevamEdiyor,
  pineconeVeriDurumu,
}: FileUploadModalProps) {
  const [modalAcik, setModalAcik] = useState(false);

  const modalKapat = () => {
    if (!yuklemeDevamEdiyor) {
      setModalAcik(false);
    }
  };

  const dosyaYuklendi = (dosya: IYuklenenDosya) => {
    onDosyaYuklendi(dosya);
    // Modalı yükleme tamamlandıktan sonra kapat
    setTimeout(() => {
      setModalAcik(false);
    }, 2000);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setModalAcik(true)}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
          size="icon"
        >
          {pineconeVeriDurumu?.hasData ? (
            <Plus className="h-6 w-6" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Modal Overlay */}
      {modalAcik && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0" 
            onClick={modalKapat}
          />
          
          {/* Modal Content */}
          <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={modalKapat}
              disabled={yuklemeDevamEdiyor}
              className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
            </button>

            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <FileText className="h-7 w-7 text-blue-600" />
                Döküman Yükleme
              </CardTitle>
              <CardDescription className="text-base">
                {pineconeVeriDurumu?.hasData 
                  ? 'Mevcut dökümanlarınıza yeni dosyalar ekleyin'
                  : 'PDF, Word (.docx) veya metin (.txt) dosyalarınızı yükleyin'
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* File Upload Component */}
              <FileUpload
                onDosyaYuklendi={dosyaYuklendi}
                yuklemeDevamEdiyor={yuklemeDevamEdiyor}
                setYuklemeDevamEdiyor={setYuklemeDevamEdiyor}
              />

              {/* Mevcut Veri Durumu */}
              {pineconeVeriDurumu?.hasData && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Mevcut Veri Durumu
                  </h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>
                      <strong>Toplam Metin Parçacığı:</strong>{' '}
                      {pineconeVeriDurumu.totalChunks} adet
                    </p>
                    <p>
                      <strong>Durum:</strong> Sohbet etmeye hazır ✅
                    </p>
                    <p className="mt-2 text-blue-600">
                      💡 Yeni döküman ekledikten sonra tüm dosyalarınızla sohbet edebilirsiniz.
                    </p>
                  </div>
                </div>
              )}

              {/* Bilgi Notu */}
              <div className="text-xs text-slate-500 space-y-1">
                <p>• Maksimum dosya boyutu: 10MB</p>
                <p>• Desteklenen formatlar: PDF, DOCX, TXT</p>
                <p>• Dosyalarınız güvenli bir şekilde işlenir ve Pinecone&apos;da saklanır</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
} 