import { Badge } from '@/components/ui/badge';
import { IChatMesaji } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  mesaj: IChatMesaji;
}

/**
 * Tek bir sohbet mesajını gösteren bileşen
 * 60-30-10 Renk Kurallarına göre (Dominant: #FFEBD3, Sekonder: #FFB6A6, Aksan: #9BCEC1)
 */
export function ChatMessage({ mesaj }: ChatMessageProps) {
  const kullaniciMesajiMi = mesaj.tur === 'kullanici';

  return (
    <div
      className={cn(
        'flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-200',
        kullaniciMesajiMi ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3.5 shadow-sm border transition-all',
          kullaniciMesajiMi
            ? 'bg-[#FFB6A6] border-[#E69B8B] text-[#2D2320] rounded-br-xs'
            : 'bg-[#FFEBD3] border-[#E69B8B] text-[#2D2320] rounded-bl-xs'
        )}
      >
        {/* Mesaj Başlığı & Rozet */}
        <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-[#E69B8B]/40">
          <Badge
            className={cn(
              'text-xs font-semibold px-2.5 py-0.5 border-none shadow-none flex items-center gap-1.5',
              kullaniciMesajiMi
                ? 'bg-[#FFEBD3] text-[#2D2320]'
                : 'bg-[#9BCEC1] text-[#2D2320]'
            )}
          >
            {kullaniciMesajiMi ? (
              <>
                <User className="h-3 w-3 text-[#2D2320]" />
                <span>Siz</span>
              </>
            ) : (
              <>
                <Bot className="h-3 w-3 text-[#2D2320]" />
                <span>Kensai</span>
              </>
            )}
          </Badge>

          <span className="text-[11px] font-medium text-[#6B5751]">
            {mesaj.zaman.toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Mesaj İçeriği */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-[#2D2320]">
          {mesaj.icerik}
        </div>
      </div>
    </div>
  );
}
