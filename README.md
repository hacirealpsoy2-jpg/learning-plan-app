# 6 Aylık Öğrenme Planı Web Uygulaması

Bu proje, TYT-AYT, İngilizce ve Python öğrenme planını interaktif bir web sitesinde sunar. Video desteği, AI özeti ve günlük takip içerir.

## Kurulum ve Çalıştırma

### Yerel Çalıştırma
1. Node.js'i indirin (nodejs.org).
2. Projeyi klonlayın veya zip'i açın.
3. Terminalde: `npm install`
4. `npm start` ile server'ı başlatın.
5. Tarayıcıda http://localhost:3000 açın.

### Deploy (Render)
1. GitHub'a yükleyin.
2. render.com'da yeni Web Service oluşturun.
3. Environment Variables ekleyin: YOUTUBE_API_KEY ve GEMINI_API_KEY (kendi anahtarlarınızı alın).
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Deploy edin.

## Özellikler
- Öğrenme planı kartları.
- YouTube video arama.
- AI video özeti (Gemini + RAG).
- Günlük motivasyon.
- Takip formu ve grafik.

## API Anahtarları
- YouTube: Google Cloud Console'dan alın.
- Gemini: Google AI Studio'dan alın.

## Sorun Giderme
- API hataları için console'u kontrol edin.
- Rate limit için anahtarları değiştirin.
