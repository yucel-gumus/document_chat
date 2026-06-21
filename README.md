# Döküman Sohbet (document_chat)

Next.js uygulaması — dosya yükleme/sunum **Vercel Route Handlers** üzerinden; **Gemini + Pinecone** işlemleri **`python_backend`** (Gemini Gateway) üzerinden.

## Mimari

| Katman | Rol |
|--------|-----|
| Tarayıcı | Sadece `/api/*` (aynı Vercel origin) |
| Next.js API | PDF/DOCX/TXT parse, chunk, gateway proxy |
| `python_backend` | `dokuman-chat/stream`, `dokuman-upsert`, `dokuman-sil` |

**API anahtarları tarayıcıya gitmez** — yalnızca Vercel environment variables.

## Vercel environment variables

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `AI_API_URL` | Evet | `https://api.yucelgumus.dev` |
| `GATEWAY_CLIENT_API_KEY` | Evet | Gateway `CLIENT_API_KEYS` içinden biri |
| `GATEWAY_ADMIN_API_KEY` | Evet | Gateway `ADMIN_API_KEYS` — upload/silme |

Production'da `localhost:8000` kullanmayın.

## Gateway (python_backend)

- Chat: `POST /api/dokuman-chat/stream` — **client** key
- Upload chunks: `POST /api/dokuman-upsert` — **admin** key
- Delete: `DELETE /api/dokuman-sil` — **admin** key

Sunucuda Pinecone + `ADMIN_API_KEYS` yapılandırılmış olmalı.

## Lokal geliştirme

```bash
cp .env.example .env.local
# Anahtarları doldurun
npm install
npm run dev
```

## Deploy

```bash
git push origin main
# Vercel otomatik deploy veya: vercel --prod
```

## Eski not

`lib/google.ts` ve `lib/pinecone.ts` artık production akışında kullanılmıyor; tüm AI/vektör işlemleri gateway'de.