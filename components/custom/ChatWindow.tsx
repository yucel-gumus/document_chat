'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from './ChatMessage';
import { IChatMesaji } from '@/lib/types';
import { Send, Loader2, Bot, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

interface ChatWindowProps {
  mesajlar: IChatMesaji[];
  onYeniMesaj: (mesaj: IChatMesaji) => void;
  dosyaYuklendi: boolean;
  dosyaIds: string[];
}

const ONERILEN_SORULAR = [
  'Dökümanın ana fikrini özetler misin?',
  'Bu dökümandaki önemli maddeler nelerdir?',
  'Dökümanda öne çıkan tarihler veya sayılar var mı?',
];

export function ChatWindow({
  mesajlar,
  onYeniMesaj,
  dosyaYuklendi,
  dosyaIds,
}: ChatWindowProps) {
  const [soruMetni, setSoruMetni] = useState('');
  const [cevapBekleniyor, setCevapBekleniyor] = useState(false);
  const [streamingMesaj, setStreamingMesaj] = useState<string>('');
  const mesajListesiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mesajListesiRef.current) {
      mesajListesiRef.current.scrollTop = mesajListesiRef.current.scrollHeight;
    }
  }, [mesajlar, streamingMesaj]);

  const soruGonder = async (gonderilecekSoru?: string) => {
    const hedefSoru = gonderilecekSoru || soruMetni;

    if (!hedefSoru.trim() || !dosyaYuklendi || dosyaIds.length === 0 || cevapBekleniyor) {
      return;
    }

    const kullaniciMesaji: IChatMesaji = {
      id: Date.now().toString(),
      tur: 'kullanici',
      icerik: hedefSoru.trim(),
      zaman: new Date(),
    };

    onYeniMesaj(kullaniciMesaji);
    setSoruMetni('');
    setCevapBekleniyor(true);
    setStreamingMesaj('');

    try {
      const yanit = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          soru: kullaniciMesaji.icerik,
          dosyaIds,
        }),
      });

      if (!yanit.ok) {
        const errorText = await yanit.text();
        let errorMessage = 'API hatası oluştu';

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
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
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);

            if (data === '[DONE]') {
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
              console.warn('JSON parse hatası:', parseError);
            }
          }
        }
      }

      if (tamamCevap) {
        const asistanMesaji: IChatMesaji = {
          id: (Date.now() + 1).toString(),
          tur: 'asistan',
          icerik: tamamCevap,
          zaman: new Date(),
        };
        onYeniMesaj(asistanMesaji);
        setStreamingMesaj('');
      }

    } catch (hata) {
      console.error('Sohbet hatası:', hata);
      const hataMesaji: IChatMesaji = {
        id: (Date.now() + 1).toString(),
        tur: 'asistan',
        icerik: hata instanceof Error ? hata.message : 'Üzgünüm, bir hata oluştu.',
        zaman: new Date(),
      };
      onYeniMesaj(hataMesaji);
      setStreamingMesaj('');
    } finally {
      setCevapBekleniyor(false);
    }
  };

  const enterTusunaBasildi = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      soruGonder();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FFEBD3]">
      {/* Mesaj Listesi */}
      <div
        ref={mesajListesiRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#FFEBD3]"
      >
        {mesajlar.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center p-6 select-none">
            {dosyaYuklendi ? (
              <div className="max-w-md space-y-5 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-2xl bg-[#FFB6A6] border border-[#E69B8B] flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="h-8 w-8 text-[#2D2320]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#2D2320]">
                    Dökümanınız Hazır!
                  </h3>
                  <p className="text-sm text-[#6B5751] mt-1">
                    Aşağıdaki örnek sorulardan birine tıklayabilir veya kendi sorunuzu sorabilirsiniz.
                  </p>
                </div>

                {/* Önerilen Sorular (Prompt Chips) */}
                <div className="space-y-2 text-left pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6B5751] flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-[#55877A]" />
                    Hızlı Sorular
                  </span>
                  <div className="flex flex-col gap-2">
                    {ONERILEN_SORULAR.map((oneri, index) => (
                      <button
                        key={index}
                        onClick={() => soruGonder(oneri)}
                        disabled={cevapBekleniyor}
                        className="group p-3 rounded-xl bg-[#FFB6A6]/40 hover:bg-[#FFB6A6] border border-[#E69B8B] text-[#2D2320] text-xs font-semibold text-left transition-all duration-200 flex items-center justify-between shadow-xs hover:shadow-sm"
                      >
                        <span>{oneri}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#55877A] group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-xs space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#FFB6A6] border border-[#E69B8B] flex items-center justify-center mx-auto">
                  <Bot className="h-8 w-8 text-[#6B5751]" />
                </div>
                <h3 className="text-lg font-bold text-[#2D2320]">
                  Sohbete Başlamak İçin Döküman Yükleyin
                </h3>
                <p className="text-xs text-[#6B5751]">
                  Sol paneldeki &quot;Döküman Yükle&quot; butonunu kullanabilirsiniz.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {mesajlar.map((mesaj) => (
              <ChatMessage key={mesaj.id} mesaj={mesaj} />
            ))}

            {/* Streaming Mesaj */}
            {streamingMesaj && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="max-w-[85%] bg-[#FFEBD3] border border-[#E69B8B] text-[#2D2320] rounded-2xl rounded-bl-xs px-4 py-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#E69B8B]/40">
                    <span className="bg-[#9BCEC1] text-[#2D2320] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <Bot className="h-3 w-3 text-[#2D2320]" />
                      Kensai dökümanı analiz ediyor...
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-[#9BCEC1] rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-[#2D2320]">
                    {streamingMesaj}
                    <span className="inline-block w-2 h-4 bg-[#9BCEC1] animate-pulse ml-1 align-middle rounded-xs"></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading Indicator */}
        {cevapBekleniyor && !streamingMesaj && (
          <div className="flex justify-start animate-in fade-in duration-200">
            <div className="bg-[#FFEBD3] border border-[#E69B8B] rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-[#6B5751]">
                <Loader2 className="h-4 w-4 animate-spin text-[#55877A]" />
                <span className="text-xs font-semibold text-[#2D2320]">
                  Kensai dökümanı analiz ediyor...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mesaj Gönderme Formu */}
      <div className="p-4 border-t border-[#E69B8B] bg-[#FFB6A6]/40 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            soruGonder();
          }}
          className="flex gap-2 max-w-4xl mx-auto"
        >
          <Input
            type="text"
            placeholder={
              dosyaYuklendi
                ? 'Dökümanınız hakkında bir soru yazın...'
                : 'Sohbet için önce sol panelden döküman yükleyin'
            }
            value={soruMetni}
            onChange={(e) => setSoruMetni(e.target.value)}
            onKeyDown={enterTusunaBasildi}
            disabled={!dosyaYuklendi || cevapBekleniyor}
            className="flex-1 bg-[#FFEBD3] border-[#E69B8B] focus-visible:ring-[#9BCEC1] text-[#2D2320] placeholder:text-[#6B5751] h-12 rounded-xl text-sm shadow-xs font-medium"
          />
          <Button
            type="submit"
            disabled={!dosyaYuklendi || !soruMetni.trim() || cevapBekleniyor}
            className="h-12 w-12 rounded-xl bg-[#9BCEC1] hover:bg-[#82B8AB] text-[#2D2320] border border-[#82B8AB] shadow-xs flex-shrink-0"
            size="icon"
          >
            {cevapBekleniyor ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#2D2320]" />
            ) : (
              <Send className="h-5 w-5 text-[#2D2320]" />
            )}
          </Button>
        </form>

        {dosyaYuklendi && (
          <p className="text-[11px] text-[#6B5751] font-medium text-center mt-2">
            💡 İpucu: Soruyu Enter tuşu ile gönderebilirsiniz.
          </p>
        )}
      </div>
    </div>
  );
}
