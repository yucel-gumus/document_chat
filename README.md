# 📄 Doküman Chat (Multi-Format Document RAG System)

Doküman Chat; kullanıcıların PDF, Word (.docx) veya düz metin (.txt) dosyalarını sisteme yüklemelerini, bu dosyaların otomatik olarak ayrıştırılıp chunk'lanmasını ve **RAG (Retrieval-Augmented Generation)** mimarisiyle dokümanların içeriği hakkında Gemini yapay zeka modeliyle gerçek zamanlı sohbet etmelerini sağlayan gelişmiş bir Next.js uygulamasıdır.

---

## 🏗️ Üç Katmanlı Mimarî Yapı

Uygulama, güvenli API anahtarı yönetimi ve tarayıcı performansını optimize etmek amacıyla üç katmanlı bir akış üzerine kurulmuştur:

```
[ TARAYICI (UI) ] ──(Sadece Aynı Origin /api/* Çağrıları)──► [ NEXT.JS BACKEND (Vercel) ]
                                                                      │
                                                           (Dosya Ayrıştırma, Chunking, Proxy)
                                                                      ▼
[ GEMINI + PINECONE ] ◄──(Embedding, Vektör Arama & SSE)─── [ PYTHON API GATEWAY ]
```

1. **İstemci Katmanı (Tarayıcı):** Herhangi bir API anahtarı barındırmaz, sadece Next.js API Routes (`/api/*`) ile konuşur.
2. **Next.js Katmanı (Vercel):** Dosyaları sunucu tarafında alır, metin ayrıştırma, parçalama (chunking) işlemlerini yürütür ve Python API Gateway'e güvenli proxy istekleri gönderir.
3. **Gateway Katmanı (Python Backend):** Gemini modelini ve Pinecone Vektör Veritabanını yönetir. Arama, veri ekleme (`upsert`) ve silme (`delete`) işlemlerini gerçekleştirerek API üzerinden Next.js'e aktarır.

---

## 🌟 Öne Çıkan Özellikler

* 📂 **Çoklu Format Desteği:** 
  * **PDF:** `pdfreader` kütüphanesi kullanılarak sayfa yapısı korunarak okunur.
  * **Word (.docx):** `mammoth` ile temiz metin dönüştürmesi yapılarak okunur.
  * **TXT:** Düz metin kodlaması çözülerek okunur.
* 🤖 **Pinecone & Gemini Entegrasyonu:** Belgeler, Gemini embedding modeliyle vektörleştirilerek Pinecone veritabanında saklanır.
* ⚡ **Gerçek Zamanlı Streaming:** Ajan yanıtları sohbet ekranına Server-Sent Events (SSE) ile anlık (streaming) olarak yansıtılır.
* 🧹 **Güvenli Doküman Yönetimi:** Admin anahtarı doğrulaması ile doküman silme (`dokuman-sil`) ve vektör indeksini güncelleme desteği sunar.

---

## 📁 Proje Klasör Yapısı

```
app/
├── api/
│   ├── chat/route.ts              # Gateway'e sohbet proxy istekleri gönderir
│   ├── upload/route.ts            # Formidable ile dosya alımı ve mammoth/pdfreader parser yönetimi
│   └── delete/route.ts            # Belirli dokümanı Pinecone'dan silme proxy'si
├── components/
│   ├── ui/                       # shadcn/ui bileşenleri
│   ├── ChatContainer.tsx         # Sohbet geçmişi ve mesajlaşma ekranı
│   └── FileUploadZone.tsx        # Sürükle-bırak destekli dosya yükleme alanı
├── lib/
│   └── utils.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Kurulum ve Yerel Çalıştırma

### 1. Bağımlılıkları Yükleyin
```bash
git clone https://github.com/yucel-gumus/document_chat.git
cd document_chat
npm install
```

### 2. Çevresel Değişkenler (`.env.local`)
Kök dizinde `.env.local` oluşturun ve Gateway adreslerinizi tanımlayın:

```env
# Python API Gateway Adresi (Örn: Localhost veya Canlı API)
AI_API_URL=https://api.yucelgumus.dev

# Sohbet ve Sorgulama İçin İstemci Anahtarı
GATEWAY_CLIENT_API_KEY=your_client_api_key

# Dosya Yükleme ve Silme Yetkileri İçin Yönetici Anahtarı
GATEWAY_ADMIN_API_KEY=your_admin_api_key
```

### 3. Uygulamayı Başlatın
```bash
npm run dev
```
Uygulama `http://localhost:3000` adresinde başlayacaktır.

---

## 🔗 Canlı Bağlantılar
* **Canlı Demo:** [https://document-chat-iota.vercel.app](https://document-chat-iota.vercel.app)
* **API Gateway Kaynak Kodu:** [yucel-gumus/llm_api](https://github.com/yucel-gumus/llm_api)