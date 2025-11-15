const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static('public')); // Frontend dosyalarını serve et
app.use(express.json());

// API Anahtarları (Üretimde environment variables kullanın, örn. process.env.YOUTUBE_API_KEY)
const YOUTUBE_API_KEY = 'AIzaSyB-d8G2GvFXcs9oBYTOy2sZXH8JMXlJ84A';
const GEMINI_API_KEY = 'AlzaSyAuf3WkoU6sed3bcwNm8zrGiDcLdBlwcls';

// Rate Limiting Simülasyonu (Basit, üretimde express-rate-limit kullanın)
let requestCount = 0;
const resetInterval = setInterval(() => requestCount = 0, 60000); // Dakikada sıfırla

// YouTube Arama Proxy
app.get('/api/youtube/search', async (req, res) => {
  if (requestCount > 100) return res.status(429).json({ error: 'Rate limit exceeded' });
  requestCount++;
  try {
    const { q } = req.query;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}&maxResults=5&type=video`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('YouTube API Error:', error.message);
    res.status(500).json({ error: 'Video arama hatası' });
  }
});

// YouTube Video Detayları Proxy
app.get('/api/youtube/video', async (req, res) => {
  if (requestCount > 100) return res.status(429).json({ error: 'Rate limit exceeded' });
  requestCount++;
  try {
    const { id } = req.query;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${YOUTUBE_API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('YouTube Video API Error:', error.message);
    res.status(500).json({ error: 'Video detay hatası' });
  }
});

// Gemini Motivasyon/Özet Proxy
app.post('/api/gemini/generate', async (req, res) => {
  if (requestCount > 50) return res.status(429).json({ error: 'Rate limit exceeded' });
  requestCount++;
  try {
    const { prompt, model = 'gemini-1.5-flash' } = req.body;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] });
    res.json(response.data);
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    res.status(500).json({ error: 'AI üretme hatası' });
  }
});

// Server Başlat
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
