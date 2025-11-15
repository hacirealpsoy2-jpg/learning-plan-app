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

// Tarih Güncelleme
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('tr-TR');

// Öğrenme Planı Kartları
const plans = [
    { week: '1-4', tyt: 'Temel konular (Türkçe, Matematik, Fizik)', eng: 'A1: Temel kelimeler', py: 'Değişkenler, döngüler', routine: 'Su: 1L, Şınav: 10, Esneme: 10dk', icon: 'fas fa-seedling' },
    { week: '5-8', tyt: 'Derinlik (Fizik, Kimya)', eng: 'A2: Zamanlar', py: 'Listeler, projeler', routine: 'Su: 1.5L, Şınav: 15, Esneme: 12dk', icon: 'fas fa-tree' },
    { week: '9-12', tyt: 'Tamamlanma (Tarih, Coğrafya)', eng: 'B1: Karmaşık cümleler', py: 'Dosya işlemleri', routine: 'Su: 2L, Şınav: 20, Esneme: 15dk', icon: 'fas fa-mountain' },
    { week: '13-16', tyt: 'Gözden geçirme', eng: 'B1+: Yazma pratiği', py
