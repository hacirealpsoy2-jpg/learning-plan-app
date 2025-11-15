// script.js

// --- Cache ve Yardımcı Fonksiyonlar
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
function getCachedData(key) {
    try {
        const cached = localStorage.getItem(key);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CACHE_EXPIRY) return parsed.data;
        }
    } catch (e) {
        console.warn('Cache okuma hatası', e);
    }
    return null;
}
function setCachedData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
        console.warn('Cache yazma hatası', e);
    }
}
function validateYouTubeUrl(url) {
    if (!url) return false;
    // Destekli örnekler: https://www.youtube.com/watch?v=ID, https://youtu.be/ID
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})([&?].*)?$/;
    return regex.test(url);
}
function extractVideoId(videoUrl) {
    if (!videoUrl || typeof videoUrl !== 'string') return null;
    // watch?v=...
    const m = videoUrl.match(/[?&]v=([^&]+)/);
    if (m && m[1]) return m[1];
    // youtu.be/...
    const m2 = videoUrl.match(/youtu\.be\/([^?&]+)/);
    if (m2 && m2[1]) return m2[1];
    // fallback: 11 karakterlik potansiyel ID'yi çıkar
    const fallback = videoUrl.match(/([a-zA-Z0-9_-]{11})/);
    return fallback ? fallback[1] : null;
}

// --- DOM Hazırlıkları
const el = id => document.getElementById(id);
if (el('currentDate')) el('currentDate').textContent = new Date().toLocaleDateString('tr-TR');

const plans = [
    { week: '1-4', tyt: 'Temel konular (Türkçe, Matematik, Fizik)', eng: 'A1: Temel kelimeler', py: 'Değişkenler, döngüler', routine: 'Su: 1L, Şınav: 10, Esneme: 10dk', icon: 'fas fa-seedling' },
    { week: '5-8', tyt: 'Derinlik (Fizik, Kimya)', eng: 'A2: Zamanlar', py: 'Listeler, projeler', routine: 'Su: 1.5L, Şınav: 15, Esneme: 12dk', icon: 'fas fa-tree' },
    { week: '9-12', tyt: 'Tamamlanma (Tarih, Coğrafya)', eng: 'B1: Karmaşık cümleler', py: 'Dosya işlemleri', routine: 'Su: 2L, Şınav: 20, Esneme: 15dk', icon: 'fas fa-mountain' },
    { week: '13-16', tyt: 'Gözden geçirme', eng: 'B1+: Yazma pratiği', py: 'Veri analizi', routine: 'Su: 2.5L, Şınav: 20, Esneme: 15dk', icon: 'fas fa-eye' },
    { week: '17-20', tyt: 'Final hazırlık', eng: 'Sertifika hazırlık', py: 'Kişisel projeler', routine: 'Su: 3L, Şınav: 20, Esneme: 15dk', icon: 'fas fa-rocket' },
    { week: '21-24', tyt: 'Sınav günü', eng: 'Test', py: 'Portföy', routine: 'Su: 3L, Şınav: 20, Esneme: 15dk', icon: 'fas fa-trophy' }
];

(function renderPlans() {
    const planGrid = el('planGrid');
    if (!planGrid) return;
    planGrid.innerHTML = '';
    plans.forEach(plan => {
        const card = document.createElement('div');
        card.className = 'card plan-card';
        card.innerHTML = `
            <i class="${plan.icon}" aria-hidden="true"></i>
            <h5>Hafta ${plan.week}</h5>
            <p><strong>TYT-AYT:</strong> ${plan.tyt}</p>
            <p><strong>İngilizce:</strong> ${plan.eng}</p>
            <p><strong>Python:</strong> ${plan.py}</p>
            <p><strong>Rutin:</strong> ${plan.routine}</p>
        `;
        planGrid.appendChild(card);
    });
})();

// --- YouTube Arama
if (el('searchBtn')) {
    el('searchBtn').addEventListener('click', async () => {
        const queryInput = el('videoSearch');
        if (!queryInput) return alert('Arama inputu bulunamadı.');
        const query = queryInput.value.trim();
        if (!query) return alert('Arama terimi girin.');

        const loading = el('loadingVideo');
        if (loading) loading.style.display = 'block';

        try {
            const cacheKey = 'videoCache_' + query;
            let data = getCachedData(cacheKey);
            if (!data) {
                const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
                if (!response.ok) {
                    const t = await response.json().catch(()=>null);
                    throw new Error(t && t.error ? t.error : 'API Hatası');
                }
                data = await response.json();
                setCachedData(cacheKey, data);
            }

            const resultsDiv = el('videoResults');
            if (!resultsDiv) throw new Error('videoResults elementi yok.');
            resultsDiv.innerHTML = '';

            const items = (data && data.items) ? data.items : [];
            if (!items.length) {
                resultsDiv.innerHTML = '<div class="alert alert-warning">Sonuç bulunamadı.</div>';
                return;
            }

            items.forEach(item => {
                // item.id.videoId veya item.id olabilir (API farklı şekillerde dönebilir)
                const videoId = item.id && (item.id.videoId || item.id) ? (item.id.videoId || item.id) : null;
                const title = item.snippet && item.snippet.title ? item.snippet.title : 'Başlık yok';
                if (!videoId) return; // skip
                const wrapper = document.createElement('div');
                wrapper.className = 'mb-3 card';
                wrapper.innerHTML = `
                    <h5>${title}</h5>
                    <iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen aria-label="${title} videosu"></iframe>
                `;
                resultsDiv.appendChild(wrapper);
            });
        } catch (error) {
            console.error('YouTube Arama Hatası:', error);
            const resultsDiv = el('videoResults');
            if (resultsDiv) resultsDiv.innerHTML = `<div class="alert alert-danger">Video yüklenirken hata oluştu: ${error.message}</div>`;
        } finally {
            if (loading) loading.style.display = 'none';
        }
    });
}

// --- Video Özeti
if (el('summarizeBtn')) {
    el('summarizeBtn').addEventListener('click', async () => {
        const input = el('videoUrl');
        const summaryResult = el('summaryResult');
        const loading = el('loadingSummary');
        if (!input || !summaryResult) return alert('Gerekli elementler bulunamadı.');

        summaryResult.style.display = 'none';
        const videoUrl = input.value.trim();

        if (!validateYouTubeUrl(videoUrl)) {
            summaryResult.className = 'alert alert-warning';
            summaryResult.innerHTML = 'Lütfen geçerli bir YouTube URL girin (örn. https://www.youtube.com/watch?v=VIDEO_ID).';
            summaryResult.style.display = 'block';
            return;
        }

        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            summaryResult.className = 'alert alert-warning';
            summaryResult.innerHTML = 'Video ID bulunamadı. Linki kontrol edin.';
            summaryResult.style.display = 'block';
            return;
        }

        if (loading) loading.style.display = 'block';

        try {
            const response = await fetch(`/api/youtube/video?id=${encodeURIComponent(videoId)}`);
            if (!response.ok) {
                const t = await response.json().catch(()=>null);
                throw new Error(t && t.error ? t.error : 'Video Detay Hatası');
            }
            const videoData = await response.json();
            const item = (videoData && videoData.items && videoData.items[0]) ? videoData.items[0] : null;
            if (!item) throw new Error('Video bilgisi alınamadı.');

            const title = item.snippet && item.snippet.title ? item.snippet.title : 'Başlık yok';
            const description = item.snippet && item.snippet.description ? item.snippet.description : '';
            const chunks = description ? description.split('. ').filter(Boolean).slice(0, 6) : [];

            // Gemini çağrısı
            const geminiResp = await fetch('/api/gemini/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Bu YouTube videosunun başlığı: "${title}". Anahtar parçalar: "${chunks.join('. ')}". Öğrenme planı bağlamında detaylı, motive edici ve güzel bir özet çıkar. RAG kullanarak vurgula.`,
                    model: 'gemini-2.0-flash-exp'
                })
            });

            if (!geminiResp.ok) {
                const t = await geminiResp.json().catch(()=>null);
                throw new Error(t && t.error ? t.error : 'Gemini Hatası');
            }

            const geminiData = await geminiResp.json();
            // farklı API şekillerine göre güvenli okuma
            let summary = null;
            try {
                summary = geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content && geminiData.candidates[0].content.parts && geminiData.candidates[0].content.parts[0] && geminiData.candidates[0].content.parts[0].text;
            } catch (e) {
                summary = null;
            }
            if (!summary) {
                // fallback: doğrudan dönen veriyi stringleştir
                summary = JSON.stringify(geminiData).slice(0, 800) + (JSON.stringify(geminiData).length > 800 ? '...' : '');
            }

            summaryResult.className = 'alert alert-success';
            summaryResult.innerHTML = `<strong>Detaylı Özet:</strong><div>${summary}</div>`;
        } catch (error) {
            console.error('Özet Hatası:', error);
            summaryResult.className = 'alert alert-danger';
            summaryResult.innerHTML = 'Özet alınırken hata oluştu. ' + (error.message ? error.message : '');
        } finally {
            if (loading) loading.style.display = 'none';
            summaryResult.style.display = 'block';
        }
    });
}

// --- Motivasyon
if (el('motivateBtn')) {
    el('motivateBtn').addEventListener('click', async () => {
        const loading = el('loadingMotivation');
        const motText = el('motivationText');
        if (loading) loading.style.display = 'block';
        try {
            const cached = getCachedData('motivationCache');
            let motivation;
            if (cached) {
                motivation = cached;
            } else {
                const response = await fetch('/api/gemini/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: "Bana günlük motivasyon mesajı ver: Öğrenme yolculuğunda başarı için." })
                });
                if (!response.ok) throw new Error('Motivasyon Hatası');
                const data = await response.json();
                motivation = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) || 'Sen yapabilirsin!';
                setCachedData('motivationCache', motivation);
            }
            if (motText) motText.innerHTML = `<p>${motivation}</p>`;
        } catch (error) {
            console.error('Motivasyon Hatası:', error);
            if (el('motivationText')) el('motivationText').innerHTML = '<p>Motivasyon yüklenirken hata oluştu. Alternatif: "Sen yapabilirsin!"</p>';
        } finally {
            if (loading) loading.style.display = 'none';
        }
    });
}

// --- Günlük Takip & Chart
let chartInstance = null;

if (el('dailyForm')) {
    el('dailyForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const water = el('water') ? el('water').value : '';
        const pushups = el('pushups') ? el('pushups').value : '';
        const stretch = el('stretch') ? el('stretch').value : '';
        const net = el('net') ? el('net').value : '';
        const data = { water, pushups, stretch, net, date: new Date().toLocaleDateString() };
        let tracks = JSON.parse(localStorage.getItem('dailyTracks') || '[]');
        tracks.push(data);
        localStorage.setItem('dailyTracks', JSON.stringify(tracks));
        displayTracks();
        updateChart();
        // temizle istersen:
        if (el('dailyForm')) el('dailyForm').reset();
    });
}

function displayTracks() {
    const tracks = JSON.parse(localStorage.getItem('dailyTracks') || '[]');
    const displayDiv = el('trackDisplay');
    if (!displayDiv) return;
    displayDiv.innerHTML = '<h4>Son Takip:</h4>';
    tracks.slice(-5).reverse().forEach(track => {
        displayDiv.innerHTML += `<p>${track.date}: Su ${track.water}L, Şınav ${track.pushups}, Esneme ${track.stretch}dk, Net ${track.net}</p>`;
    });
}

function updateChart() {
    const tracks = JSON.parse(localStorage.getItem('dailyTracks') || '[]');
    const canvas = el('progressChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Önceki chart varsa yok et
    if (chartInstance) {
        try { chartInstance.destroy(); } catch (e) { /* ignore */ }
        chartInstance = null;
    }

    const labels = tracks.map(t => t.date);
    const nets = tracks.map(t => Number(t.net) || 0);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Net Sayısı',
                data: nets,
                // Renkleri CSS'den veya Chart defaults kullan; explicit renk yerine bırakıyorum
                fill: false,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// İlk yükleme
displayTracks();
updateChart();
