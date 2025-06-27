# Döküman Sohbet Uygulaması

Bu proje, TypeScript, Next.js 14+, Gemini 2.0 ve Pinecone kullanarak geliştirilmiş bir döküman analiz ve sohbet uygulamasıdır. Kullanıcılar PDF, Word (.docx) veya metin (.txt) dosyalarını yükleyebilir ve Gemini AI modeli ile bu dökümanlar hakkında sohbet edebilirler.

## 🚀 Özellikler

- **Döküman Yükleme**: PDF, DOCX ve TXT dosyaları desteği
- **Sürükle-Bırak**: Kolay dosya yükleme arayüzü
- **AI Sohbet**: Gemini 2.0 Flash modeli ile gerçek zamanlı sohbet
- **RAG Mimarisi**: Retrieval-Augmented Generation ile doğru cevaplar
- **Streaming**: Server-Sent Events ile anlık yanıtlar
- **Vektör Arama**: Pinecone ile anlamsal metin araması
- **Modern UI**: Tailwind CSS ve shadcn/ui ile şık arayüz

## 🛠️ Teknoloji Stack

- **Framework**: Next.js 14+ (App Router)
- **Dil**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **AI Model**: Google Gemini 2.0 Flash
- **Embedding**: Google text-embedding-004
- **Vektör DB**: Pinecone
- **UI Kütüphanesi**: Radix UI + Lucide React

## 📋 Gereksinimler

- Node.js 18+
- npm veya yarn
- Google AI API anahtarı
- Pinecone hesabı ve API anahtarı

## ⚙️ Kurulum

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd dokuman-sohbet-uygulamasi
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Environment Variables Ayarlayın

Proje kök dizininde `.env.local` dosyası oluşturun:

```env
# Google AI API Anahtarı
# https://aistudio.google.com/app/apikey adresinden alın
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Embedding Modeli (opsiyonel, varsayılan: text-embedding-004)
EMBEDDING_MODEL=text-embedding-004

# Pinecone API Anahtarı
# https://app.pinecone.io/ adresinden alın
PINECONE_API_KEY=your_pinecone_api_key_here

# Pinecone Index Adı
PINECONE_INDEX_NAME=dokuman-sohbet-index

# Pinecone Host URL (opsiyonel)
# Index oluşturduktan sonra dashboard'dan alın
PINECONE_HOST=your_pinecone_host_url_here
```

### 4. Pinecone Index Oluşturun

Pinecone dashboard'unda yeni bir index oluşturun:
- **Index Name**: `dokuman-sohbet-index` (veya .env'deki isim)
- **Dimensions**: `768` (text-embedding-004 modeli için)
- **Metric**: `cosine`
- **Pod Type**: `p1.x1` (starter plan için)

### 5. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## 📖 Kullanım

1. **Döküman Yükleme**: Sol panelde PDF, DOCX veya TXT dosyası yükleyin
2. **Dosya İşleme**: Sistem dosyanızı otomatik olarak analiz edecek ve parçacıklara böler
3. **Sohbet**: Sağ panelde dökümanınız hakkında sorular sorun
4. **AI Yanıtları**: Gemini 2.0 modeli gerçek zamanlı olarak cevaplar verir

## 🎯 RAG Mimarisi

Uygulama, sıkı RAG (Retrieval-Augmented Generation) kuralları uygular:
- ✅ **SADECE** yüklenen döküman bilgileri kullanılır
- ❌ AI modelinin genel bilgisi kullanılmaz
- 🔍 Yeterli context bulunamazsa açık hata mesajı gösterilir
- 📊 Benzerlik skoruna göre alakasız sonuçlar filtrelenir

## 🏗️ Proje Yapısı

```
├── app/
│   ├── api/
│   │   ├── upload/route.ts    # Dosya yükleme API
│   │   └── chat/route.ts      # Sohbet API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Ana sayfa
├── components/
│   ├── custom/
│   │   ├── FileUpload.tsx     # Dosya yükleme bileşeni
│   │   ├── ChatWindow.tsx     # Sohbet penceresi
│   │   └── ChatMessage.tsx    # Mesaj bileşeni
│   └── ui/                    # shadcn/ui bileşenleri
├── lib/
│   ├── google.ts              # Google AI SDK
│   ├── pinecone.ts            # Pinecone SDK
│   ├── types.ts               # TypeScript tipleri
│   └── utils.ts               # Yardımcı fonksiyonlar
└── README.md
```

## 🚀 Deployment

### Vercel (Önerilen)
```bash
npm run build
vercel
```

Environment variables'ları Vercel dashboard'unda ayarlamayı unutmayın.

### Diğer Platformlar
```bash
npm run build
npm start
```

## 🔧 Geliştirme

### Build
```bash
npm run build
```

### Linting
```bash
npm run lint
```

### Formatlama
```bash
npm run format
```

## 📝 API Endpoints

### POST /api/upload
Dosya yükleme ve işleme
- **Body**: `multipart/form-data` (file field)
- **Response**: `{ success, data: { dosyaId, ad, boyut, metinParcacigiSayisi }, error }`

### POST /api/chat
Sohbet (Streaming SSE)
- **Body**: `{ soru: string, dosyaId?: string }`
- **Response**: Server-Sent Events stream

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit'leyin (`git commit -m 'Add some AmazingFeature'`)
4. Push'layın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında dağıtılmaktadır.

## ⚠️ Önemli Notlar

- Dosyalar sadece işleme sırasında bellekte tutulur, kalıcı olarak saklanmaz
- Maksimum dosya boyutu: 10MB
- Desteklenen diller: Türkçe (AI yanıtları için)
- Güvenlik: API anahtarları asla client-side'da expose edilmez

## 🆘 Sorun Giderme

### "API anahtarı bulunamadı" hatası
- `.env.local` dosyasında `GOOGLE_AI_API_KEY` ve `PINECONE_API_KEY` ayarlandığından emin olun
- Development server'ını yeniden başlatın

### "Index bulunamadı" hatası  
- Pinecone dashboard'unda index'in oluşturulduğundan emin olun
- `PINECONE_INDEX_NAME` değerinin doğru olduğunu kontrol edin

### Build hataları
```bash
npm run lint --fix
npm run format
npm run build
```

## 📞 İletişim

Sorularınız için issue açabilir veya projeyi fork'layarak katkıda bulunabilirsiniz.
