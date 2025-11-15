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
    const startDate = new Date('2024-01-01');
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

// Öğrenme Planı Kartları
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
        <p><strong>İngiliz
