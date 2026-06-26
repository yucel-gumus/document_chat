# Döküman Sohbet (`document_chat`)

PDF, DOCX ve düz metin dosyalarını yükleyip **RAG (Retrieval-Augmented Generation)** ile sohbet etmenizi sağlayan **Next.js** uygulaması. Dosya ayrıştırma ve chunking Vercel route handler’larında; embedding, vektör depolama ve streaming yanıtlar merkezi **Gemini Gateway** (`python_backend`) üzerinde çalışır.

**Canlı:** [document-chat-iota.vercel.app](https://document-chat-iota.vercel.app)  
**GitHub:** [yucel-gumus/document_chat](https://github.com/yucel-gumus/document_chat)

---

## Mimari (üç katman)

| Katman | Sorumluluk |
|--------|------------|
| **Tarayıcı** | Yalnızca aynı origin `/api/*` çağrıları; API anahtarı yok |
| **Next.js (Vercel)** | PDF/DOCX/TXT parse, metin bölme (chunk), gateway proxy, oturum UI |
| **Gateway** `api.yucelgumus.dev` | `dokuman-chat/stream`, `dokuman-upsert`, `dokuman-sil` — Gemini + Pinecone |

```
[Kullanıcı] → [Next.js API] → [Gateway] → Gemini + Pinecone
                  ↑
            chunk / metadata
```

Eski `lib/google.ts` ve `lib/pinecone.ts` doğrudan istemci akışında **kullanılmıyor**; tüm AI ve vektör işlemleri gateway’de merkezileştirildi.

---

## Özellikler

- Çoklu format yükleme (PDF, Word, TXT)
- Sohbet arayüzünde **streaming** token yanıtları
- Döküman silme ve indeks güncelleme (admin key ile)
- Production’da localhost gateway kullanılmaz

---

## Gateway endpoint’leri

| İşlem | Method | Gateway path | Anahtar tipi |
|-------|--------|--------------|--------------|
| Sohbet | POST | `/api/dokuman-chat/stream` | Client |
| Chunk upsert | POST | `/api/dokuman-upsert` | Admin |
| Silme | DELETE | `/api/dokuman-sil` | Admin |

Gateway sunucusunda Pinecone index ve `ADMIN_API_KEYS` / `CLIENT_API_KEYS` yapılandırılmış olmalıdır.

---

## Vercel environment variables

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `AI_API_URL` | Evet | `https://api.yucelgumus.dev` |
| `GATEWAY_CLIENT_API_KEY` | Evet | Streaming sohbet için client key |
| `GATEWAY_ADMIN_API_KEY` | Evet | Upload ve silme işlemleri |

---

## Yerel geliştirme

```bash
git clone https://github.com/yucel-gumus/document_chat.git
cd document_chat
cp .env.example .env.local
# AI_API_URL, GATEWAY_* anahtarlarını doldurun
npm install
npm run dev
```

Yerel gateway testi için `AI_API_URL=http://127.0.0.1:8000` kullanılabilir; Pinecone yine gateway `.env` üzerinden.

---

## Tipik akış

1. Kullanıcı dosya seçer → Next.js dosyayı parse eder ve chunk’lar üretir
2. Admin key ile `dokuman-upsert` → vektörler Pinecone’a yazılır
3. Kullanıcı soru sorar → `dokuman-chat/stream` ilgili chunk’ları context’e alır ve SSE döner
4. Silme → `dokuman-sil` ile namespace/document temizliği

---

## Deploy

```bash
git push origin main
# Vercel otomatik deploy
vercel --prod   # isteğe bağlı CLI
```

Deploy sonrası Vercel env’lerin production’da doğru olduğunu doğrulayın.

---

## İlgili repo

- Gateway kaynak ve operasyon: [llm_api](https://github.com/yucel-gumus/llm_api) (`python_backend`)

---

## Lisans

Proje sahibi lisansına tabidir.