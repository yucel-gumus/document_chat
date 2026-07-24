'use client';

import { IYuklenenDosya } from '@/lib/types';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Trash2,
  Plus,
  Database,
  Loader2,
  ShieldCheck,
  FolderOpen,
  Sparkles,
} from 'lucide-react';

interface DocumentSidebarProps {
  yuklenenDosyalar: IYuklenenDosya[];
  dosyaSil: (dosya: IYuklenenDosya) => void;
  silmeDevamEdiyor: string | null;
  onOpenUploadModal: () => void;
}

export function DocumentSidebar({
  yuklenenDosyalar,
  dosyaSil,
  silmeDevamEdiyor,
  onOpenUploadModal,
}: DocumentSidebarProps) {
  const toplamParca = yuklenenDosyalar.reduce(
    (acc, d) => acc + d.metinParcacigiSayisi,
    0
  );

  return (
    <aside className="w-full lg:w-80 bg-[#FFB6A6] border-r border-[#E69B8B] flex flex-col h-full shadow-md select-none">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-[#E69B8B] bg-[#FFEBD3]/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9BCEC1] flex items-center justify-center text-[#2D2320] shadow-sm">
            <Sparkles className="h-5 w-5 text-[#2D2320]" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-[#2D2320] tracking-tight">
              Döküman Hub
            </h2>
            <p className="text-xs text-[#6B5751] font-medium">
              Vektör Tabanlı Akıllı Asistan
            </p>
          </div>
        </div>
      </div>

      {/* Upload Quick CTA */}
      <div className="p-4 border-b border-[#E69B8B]/60">
        <Button
          onClick={onOpenUploadModal}
          className="w-full bg-[#9BCEC1] hover:bg-[#82B8AB] text-[#2D2320] font-semibold h-12 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 border border-[#82B8AB]"
        >
          <Plus className="h-5 w-5" />
          <span>Döküman Yükle</span>
        </Button>
      </div>

      {/* Stats Summary Card */}
      <div className="px-4 py-3">
        <div className="bg-[#FFEBD3] border border-[#E69B8B] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[#55877A]" />
              <span className="text-xs font-semibold text-[#2D2320]">
                Vektör Deposu
              </span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#9BCEC1] text-[#2D2320]">
              {toplamParca > 0 ? `${toplamParca} Parça` : 'Boş'}
            </span>
          </div>

          <div className="text-xs text-[#6B5751] flex items-center gap-1.5 mt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#55877A]" />
            <span>Oturum izolasyonu aktif</span>
          </div>
        </div>
      </div>

      {/* Document List Header */}
      <div className="px-5 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6B5751]">
          Yüklenen Dosyalar ({yuklenenDosyalar.length})
        </span>
      </div>

      {/* Document Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5">
        {yuklenenDosyalar.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-[#E69B8B]/70 rounded-xl bg-[#FFEBD3]/30">
            <FolderOpen className="h-10 w-10 text-[#6B5751] mb-2 opacity-60" />
            <p className="text-sm font-semibold text-[#2D2320]">
              Henüz dosya eklenmedi
            </p>
            <p className="text-xs text-[#6B5751] mt-1 max-w-[200px]">
              Sohbet etmek için döküman yükleyin
            </p>
          </div>
        ) : (
          yuklenenDosyalar.map((dosya) => (
            <div
              key={dosya.id}
              className="group bg-[#FFEBD3] border border-[#E69B8B] rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#FFDBD2] flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-[#55877A]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#2D2320] truncate">
                    {dosya.ad}
                  </p>
                  <p className="text-[11px] text-[#6B5751] mt-0.5">
                    {formatBytes(dosya.boyut)} • {dosya.metinParcacigiSayisi} parça
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => dosyaSil(dosya)}
                disabled={silmeDevamEdiyor === dosya.id}
                className="h-8 w-8 text-[#6B5751] hover:text-red-700 hover:bg-[#FFDBD2] rounded-lg transition-colors flex-shrink-0"
              >
                {silmeDevamEdiyor === dosya.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2D2320]" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#E69B8B] bg-[#FFEBD3]/40 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-[#6B5751] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#9BCEC1] animate-pulse"></span>
          <span>60-30-10 Tasarım Sistemi</span>
        </div>
      </div>
    </aside>
  );
}
