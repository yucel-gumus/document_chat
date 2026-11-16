import { Badge } from '@/components/ui/badge';
import { IChatMesaji } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  mesaj: IChatMesaji;
}

/**
 * Tek bir sohbet mesajını gösteren bileşen
 * İpek Küllü Arduvaz 60-30-10 Tasarım Sistemi
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
          'max-w-[85%] rounded-2xl px-4 py-3.5 shadow-sm border transition-all duration-200',
          kullaniciMesajiMi
            ? 'bg-[#F2A488]/45 border-[#EC7D55]/60 text-[#253341] rounded-br-xs'
            : 'bg-[#DCE3EA] border-[#BCC7D2] text-[#253341] rounded-bl-xs'
        )}
      >
        {/* Mesaj Başlığı & Rozet */}
        <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-[#BCC7D2]/70">
          <Badge
            className={cn(
              'text-xs font-semibold px-2.5 py-0.5 border-none shadow-none flex items-center gap-1.5',
              kullaniciMesajiMi
                ? 'bg-[#F5F9F5] text-[#253341]'
                : 'bg-[#DBE6DD] text-[#253341]'
            )}
          >
            {kullaniciMesajiMi ? (
              <>
                <User className="h-3 w-3 text-[#253341]" />
                <span>Siz</span>
              </>
            ) : (
              <>
                <Bot className="h-3 w-3 text-[#253341]" />
                <span>Kensai</span>
              </>
            )}
          </Badge>

          <span className="text-[11px] font-medium text-[#3E5164]">
            {mesaj.zaman.toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Mesaj İçeriği */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-[#253341]">
          {mesaj.icerik}
        </div>
      </div>
    </div>
  );
}
