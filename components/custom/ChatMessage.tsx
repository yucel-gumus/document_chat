import { Badge } from '@/components/ui/badge';
import { IChatMesaji } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  mesaj: IChatMesaji;
}

/**
 * Tek bir sohbet mesajını gösteren bileşen
 * Kullanıcı ve asistan mesajları için farklı stiller uygular
 */
export function ChatMessage({ mesaj }: ChatMessageProps) {
  const kullaniciMesajiMi = mesaj.tur === 'kullanici';

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        kullaniciMesajiMi ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-4 py-3 shadow-sm',
          kullaniciMesajiMi
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
        )}
      >
        {/* Mesaj Başlığı */}
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant={kullaniciMesajiMi ? 'secondary' : 'default'}
            className={cn(
              'text-xs',
              kullaniciMesajiMi
                ? 'bg-blue-500 hover:bg-blue-500 text-white'
                : 'bg-slate-100 hover:bg-slate-100 text-slate-700'
            )}
          >
            {kullaniciMesajiMi ? '👤 Siz' : '🤖 Asistan'}
          </Badge>
          <span
            className={cn(
              'text-xs',
              kullaniciMesajiMi ? 'text-blue-100' : 'text-slate-500'
            )}
          >
            {mesaj.zaman.toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Mesaj İçeriği */}
        <div
          className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap',
            kullaniciMesajiMi ? 'text-white' : 'text-slate-800'
          )}
        >
          {mesaj.icerik}
        </div>
      </div>
    </div>
  );
}
