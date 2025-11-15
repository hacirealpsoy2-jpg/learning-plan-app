// Cache ve Yardımcı Fonksiyonlar
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
function getCachedData(key) {
    const cached = localStorage.getItem(key);
    if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_EXPIRY) return parsed.data;
    }
    return null;
}
function setCachedData(key, data) {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}
function validateYouTubeUrl(url) {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return regex.test(url);
}
function getCurrentWeek() {
    const startDate = new Date('2024-01-01'); // Plan başlangıç tarihi (ayarlayın)
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.ceil(diffDays / 7);
    if (week <= 4) return '1-4';
    if (week <= 8) return '5-8';
    if (week <= 12) return '9-12';
    if (week <= 16) return '13-16';
    if (week <= 20) return '17-20';
    return '21-24';
}

// Tarih ve Hafta Güncelleme
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('tr-TR');
const currentWeek = getCurrentWeek();
document.getElementById('currentWeek').textContent = `Bugünkü Hafta: ${currentWeek} - Odaklan!`;

// Öğrenme Planı Kartları (Günlük Yenileme ile)
const plans = [
    { week: '1-4', tyt: 'Temel konular (Türkçe, Matematik, Fizik)', eng: 'A1: Temel kelimeler', py: 'Değişkenler, döngüler', routine: 'Su: 1L, Şınav: 10, Esneme: 10dk', icon: 'fas fa-seedling' },
    { week: '5-8', tyt: 'Derinlik (Fizik, Kimya)', eng: 'A2: Zamanlar', py: 'Listeler, projeler', routine: 'Su: 1.5L, Şınav: 15, Esneme: 12dk', icon: 'fas fa-tree' },
    { week: '9-12', tyt: 'Tamamlanma (Tarih, Coğrafya)', eng: 'B1: Karmaşık cümleler', py: 'Dosya işlemleri', routine: 'Su: 2L, Şınav: 20, Esneme: 15dk', icon: 'fas fa-mountain' },
    { week: '13-16', tyt: 'Gözden geçirme', eng: 'B1+: Yazma pratiği', py: 'Veri analizi', routine: 'Su: 2.5L, Şınav: 20, Esneme: 15dk', icon: 'fas fa-eye' },
    { week: '17-20', tyt: 'Final hazırlık', eng: 'Sertifika hazırlık', py: 'Kişisel projeler', routine: 'Su: 3L, Şınav: 20, Esneme: 15dk', icon: 'fas fa-rocket' },
    { week: '21-24', tyt: 'Sınav günü', eng: 'Test', py: 'Portföy', routine: 'Su: 3L, Şınav: 20, Esneme: 15dk', icon: 'fas fa-trophy' }
];
const planGrid = document.getElementById('planGrid');
plans.forEach(plan => {
    const card = document.createElement('div');
    card.className = `card plan-card ${plan.week === currentWeek ? 'current' : ''}`;
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

// YouTube Arama
document.getElementById('searchBtn').addEventListener('click', async () => {
    const query = document.getElementById('videoSearch').value.trim();
    if (!query) {
        alert('Arama terimi girin.');
        return;
    }
    const loading = document.getElementById('loadingVideo');
    loading.style.display = 'block';
    try {
        const cached = getCachedData('videoCache_' + query);
        let data;
        if (cached) {
            data = cached;
        } else {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('API Hatası');
            data = await response.json();
            setCachedData('videoCache_' + query, data);
        }
        const resultsDiv = document.getElementById('videoResults');
        resultsDiv.innerHTML = '';
        data.items.forEach(item => {
            const videoId = item.id.videoId;
            const title = item.snippet.title;
            resultsDiv.innerHTML += `
                <div class="mb-3">
                    <h5>${title}</h5>
                    <iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen aria-label="${title} videosu"></iframe>
                </div>
            `;
        });
    } catch (error) {
        console.error('YouTube Arama Hatası:', error);
        document.getElementById('videoResults').innerHTML = '<div class="alert alert-danger">Video yüklenirken hata oluştu. API anahtarınızı kontrol edin.</div>';
    } finally {
        loading.style.display = 'none';
    }
});

// Video Özeti
document.getElementById('summarizeBtn').addEventListener('click', async () => {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const summaryResult = document.getElementById('summaryResult');
    const loading = document.getElementById('loadingSummary');
    summaryResult.style.display = 'none';
    if (!videoUrl || !validateYouTubeUrl(videoUrl)) {
        summaryResult.className = 'alert alert-warning alert-custom';
        summaryResult.innerHTML = 'Lütfen geçerli bir YouTube URL girin (örn. https://www.youtube.com/watch?v=VIDEO_ID).';
        summaryResult.style.display = 'block';
        return;
    }
    loading.style.display = 'block';
    try {
        const urlParts = videoUrl.split('v=');
        if (urlParts.length < 2) throw new Error('Geçersiz URL formatı');
        const videoId = urlParts[1].split('&')[0];
        if (!videoId) throw new Error('Video ID bulunamadı');
        console.log('Fetching video details for ID:', videoId);
        const response = await fetch(`/api/youtube/video?id=${videoId}`);
        if (!response.ok) throw new Error(`Video Detay Hatası: ${response.status}`);
        const videoData = await response.json();
        if (!videoData.items || videoData.items.length === 0) throw new Error('Video bulunamadı');
        const title = videoData.items[0].snippet.title;
        const description = videoData.items[0].snippet.description;
        const chunks = description.split('. ').slice(0, 5);
        console.log('Generating summary with Gemini...');
        const geminiResponse = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `Bu YouTube videosunun başlığı: "${title}". Anahtar parçalar: "${chunks.join('. ')}". Öğrenme planı bağlamında detaylı, motive edici ve güzel bir özet çıkar. RAG kullanarak vurgula.`,
                model: 'gemini-2.0-flash-exp'
            })
        });
        if (!geminiResponse.ok) throw new Error(`Gemini Hatası: ${geminiResponse.status}`);
        const geminiData = await geminiResponse.json();
        if (!geminiData.candidates || geminiData.candidates.length === 0) throw new Error('Özet üretilemedi');
        const summary = geminiData.candidates[0].content.parts[0].text;
        summaryResult.className = 'alert alert-success alert-custom';
        summaryResult.innerHTML = `<strong>Detaylı Özet:</strong> ${summary}`;
    } catch (error) {
        console.error('Özet Hatası:', error);
        summaryResult.className = 'alert alert-danger alert-custom';
        summaryResult.innerHTML = 'Özet alınırken hata oluştu. API anahtarınızı veya bağlantınızı kontrol edin. Detay: ' + error.message;
    } finally {
        loading.style.display = 'none';
        summaryResult.style.display = 'block';
    }
});

// Motivasyon
document.getElementById('motivateBtn').addEventListener('click', async () => {
    const loading = document.getElementById('loadingMotivation');
    loading.style.display = 'block';
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
            motivation = data.candidates[0].content.parts[0].text;
            setCachedData('motivationCache', motivation);
        }
        document.getElementById('motivationText').innerHTML = `<p>${motivation}</p>`;
    } catch (error) {
        console.error('Motivasyon Hatası:', error);
        document.getElementById('motivationText').innerHTML = '<p>Motivasyon yüklenirken hata oluştu. Alternatif: "Sen yapabilirsin!"</p>';
    } finally {
        loading.style.display = 'none';
    }
});

// Günlük Takip
document.getElementById('dailyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const water = document.getElementById('water').value;
    const pushups = document.getElementById('pushups').value;
    const stretch = document.getElementById('stretch').value;
    const net = document.getElementById('net').value;
    const data = { water, pushups, stretch, net, date: new Date().toLocaleDateString() };
    let tracks = JSON.parse(localStorage.getItem('dailyTracks')) || [];
    tracks.push(data);
    localStorage.setItem('dailyTracks', JSON.stringify(tracks));
    displayTracks();
    updateChart();
});

function displayTracks() {
    const tracks = JSON.parse(localStorage.getItem('dailyTracks')) || [];
    const displayDiv = document.getElementById('trackDisplay');
    displayDiv.innerHTML = '<h4>Son Takip:</h4>';
    tracks.slice(-5).forEach(track => {
        displayDiv.innerHTML += `<p>${track.date}: Su ${track.water}L, Şınav ${track.pushups}, Esneme ${track.stretch}dk, Net ${track.net}</p>`;
    });
}

function updateChart() {
    const tracks = JSON.parse(localStorage.getItem('dailyTracks')) || [];
    const ctx = document.getElementById('progressChart').getContext('2d');
    const labels = tracks.map(t => t.date);
    const nets = tracks.map(t => t.net);
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Net Sayısı',
                data: nets,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
            }]
        }
    });
}
displayTracks();
updateChart();
