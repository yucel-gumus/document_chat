'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from './ChatMessage';
import { IChatMesaji } from '@/lib/types';
import { Send, Loader2 } from 'lucide-react';

interface ChatWindowProps {
  mesajlar: IChatMesaji[];
  onYeniMesaj: (mesaj: IChatMesaji) => void;
  dosyaYuklendi: boolean;
  dosyaId?: string;
}

/**
 * Ana sohbet penceresi bileşeni
 * Mesajları gösterir, yeni mesaj gönderme imkanı sağlar
 */
export function ChatWindow({
  mesajlar,
  onYeniMesaj,
  dosyaYuklendi,
  dosyaId,
}: ChatWindowProps) {
  const [soruMetni, setSoruMetni] = useState('');
  const [cevapBekleniyor, setCevapBekleniyor] = useState(false);
  const [streamingMesaj, setStreamingMesaj] = useState<string>('');
  const mesajListesiRef = useRef<HTMLDivElement>(null);

  /**
   * Mesajlar güncellendiğinde otomatik scroll
   */
  useEffect(() => {
    if (mesajListesiRef.current) {
      mesajListesiRef.current.scrollTop = mesajListesiRef.current.scrollHeight;
    }
  }, [mesajlar, streamingMesaj]);

  /**
   * Form submit işlemi - yeni soru gönderme
   */
  const soruGonder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!soruMetni.trim() || !dosyaYuklendi || cevapBekleniyor) {
      return;
    }

    const kullaniciMesaji: IChatMesaji = {
      id: Date.now().toString(),
      tur: 'kullanici',
      icerik: soruMetni,
      zaman: new Date(),
    };

    // Kullanıcı mesajını hemen ekle
    onYeniMesaj(kullaniciMesaji);
    setSoruMetni('');
    setCevapBekleniyor(true);
    setStreamingMesaj('');

    try {
      // Streaming API çağrısı yap
      const yanit = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          soru: kullaniciMesaji.icerik,
          dosyaId: dosyaId,
        }),
      });

      if (!yanit.ok) {
        // Hata response'u JSON olabilir
        const errorText = await yanit.text();
        let errorMessage = 'API hatası oluştu';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON parse edilemezse text'i kullan
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const reader = yanit.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Response stream alınamadı');
      }

      let tamamCevap = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // 'data: ' kısmını çıkar
            
            if (data === '[DONE]') {
              // Stream tamamlandı
              const asistanMesaji: IChatMesaji = {
                id: (Date.now() + 1).toString(),
                tur: 'asistan',
                icerik: tamamCevap,
                zaman: new Date(),
              };
              onYeniMesaj(asistanMesaji);
              setStreamingMesaj('');
              return;
            }

            try {
              const parsedData = JSON.parse(data);
              
              if (parsedData.error) {
                throw new Error(parsedData.error);
              }
              
              if (parsedData.content) {
                tamamCevap += parsedData.content;
                setStreamingMesaj(tamamCevap);
              }
            } catch (parseError) {
              // JSON parse hatası, satırı atla
              console.warn('JSON parse hatası:', parseError);
            }
          }
        }
      }

    } catch (hata) {
      console.error('Sohbet hatası:', hata);
      const hataMesaji: IChatMesaji = {
        id: (Date.now() + 1).toString(),
        tur: 'asistan',
        icerik: hata instanceof Error ? hata.message : 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        zaman: new Date(),
      };
      onYeniMesaj(hataMesaji);
      setStreamingMesaj('');
    } finally {
      setCevapBekleniyor(false);
    }
  };

  /**
   * Enter tuşu ile form submit
   */
  const enterTusunaBasildi = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const formEvent = { preventDefault: () => {} } as React.FormEvent;
      soruGonder(formEvent);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mesajlar Listesi */}
      <div
        ref={mesajListesiRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 max-h-[400px]"
      >
        {mesajlar.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            {dosyaYuklendi ? (
              <div className="text-center space-y-2">
                <div className="text-2xl">💬</div>
                <p>Merhaba! Dökümanınız hakkında bir soru sorun.</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="text-2xl">📄</div>
                <p>Sohbet edebilmek için önce bir döküman yükleyin.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {mesajlar.map(mesaj => <ChatMessage key={mesaj.id} mesaj={mesaj} />)}
            
            {/* Streaming Mesaj */}
            {streamingMesaj && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-white border border-slate-200 text-slate-900 rounded-lg rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">
                      🤖 Asistan
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
                    {streamingMesaj}
                    <span className="inline-block w-2 h-4 bg-slate-400 animate-pulse ml-1"></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading indicator */}
        {cevapBekleniyor && !streamingMesaj && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Asistan düşünüyor...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mesaj Gönderme Alanı */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={soruGonder} className="flex gap-2">
          <Input
            type="text"
            placeholder={
              dosyaYuklendi
                ? 'Dökümanınız hakkında bir soru sorun...'
                : 'Önce bir döküman yükleyin'
            }
            value={soruMetni}
            onChange={e => setSoruMetni(e.target.value)}
            onKeyDown={enterTusunaBasildi}
            disabled={!dosyaYuklendi || cevapBekleniyor}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!dosyaYuklendi || !soruMetni.trim() || cevapBekleniyor}
            size="icon"
          >
            {cevapBekleniyor ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {dosyaYuklendi && (
          <p className="text-xs text-slate-500 mt-2">
            💡 İpucu: Enter tuşu ile mesaj gönderebilirsiniz
          </p>
        )}
      </div>
    </div>
  );
}
