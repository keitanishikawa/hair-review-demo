// Owner Dashboard JavaScript

let hairdressers = [];
let allSurveys = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadOwnerDashboard();
});

function checkAuth() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user || user.role !== 'owner') {
        window.location.href = 'login.html';
        return;
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

function refreshData() {
    location.reload();
}

function loadOwnerDashboard() {
    // Load data from localStorage
    hairdressers = JSON.parse(localStorage.getItem('hairdressers') || '[]');
    allSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');

    // デバッグ情報をコンソールに出力
    console.log('🔍 オーナーダッシュボード - データ読み込み結果:');
    console.log('- 美容師数:', hairdressers.length);
    console.log('- アンケート数:', allSurveys.length);
    console.log('- 美容師データ:', hairdressers);

    if (hairdressers.length === 0) {
        document.querySelector('.main-container').innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 24px;">📊</div>
                <h2 style="font-size: 24px; color: var(--text-primary); margin-bottom: 12px;">
                    データがまだ登録されていません
                </h2>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">
                    管理者にデータのアップロードを依頼してください
                </p>
                <div style="background: #f0f4ff; padding: 16px; border-radius: 8px; margin: 20px auto; max-width: 500px;">
                    <div style="font-size: 14px; color: #666; text-align: left;">
                        <strong>📝 確認事項：</strong><br><br>
                        1. 管理者画面でCSVをアップロードしましたか？<br>
                        2. アップロード後、「🔄 更新」ボタンを押してください<br>
                        3. ブラウザのコンソール（F12キー）でデータを確認できます
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Calculate stats
    document.getElementById('total-hairdressers').textContent = hairdressers.length;
    document.getElementById('total-reviews').textContent = allSurveys.length;
    document.getElementById('avg-reviews').textContent = Math.round(allSurveys.length / hairdressers.length);

    // Create charts
    createOverallAgeChart();
    createHairdresserComparisonChart();
    displayHairdresserCards();
}

function createOverallAgeChart() {
    const ageGroups = {
        '20代': 0,
        '30代': 0,
        '40代': 0,
        '50代以上': 0
    };

    allSurveys.forEach(survey => {
        const age = parseInt(survey.age);
        if (age >= 20 && age < 30) ageGroups['20代']++;
        else if (age >= 30 && age < 40) ageGroups['30代']++;
        else if (age >= 40 && age < 50) ageGroups['40代']++;
        else if (age >= 50) ageGroups['50代以上']++;
    });

    const ctx = document.getElementById('overall-age-chart');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                data: Object.values(ageGroups),
                backgroundColor: ['#706fd3', '#ff6348', '#2ed573', '#ffa502']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function createHairdresserComparisonChart() {
    const reviewCounts = hairdressers.map(h => {
        return {
            name: h.name,
            count: allSurveys.filter(s => s.imageFile === h.imageFile).length
        };
    }).sort((a, b) => b.count - a.count);

    const ctx = document.getElementById('hairdresser-comparison-chart');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: reviewCounts.map(r => r.name),
            datasets: [{
                label: 'レビュー数',
                data: reviewCounts.map(r => r.count),
                backgroundColor: '#706fd3'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

function displayHairdresserCards() {
    const grid = document.getElementById('hairdresser-grid');

    const cards = hairdressers.map(hairdresser => {
        const reviews = allSurveys.filter(s => s.imageFile === hairdresser.imageFile);
        const reviewCount = reviews.length;

        // Calculate average age
        const totalAge = reviews.reduce((sum, r) => sum + (parseInt(r.age) || 0), 0);
        const avgAge = reviewCount > 0 ? Math.round(totalAge / reviewCount) : 0;

        return `
            <div class="hairdresser-card">
                <div class="hairdresser-name">${hairdresser.name}</div>
                <div class="hairdresser-salon">${hairdresser.salon}</div>
                <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
                    ターゲット: ${hairdresser.targetAge || '-'}
                </div>
                <div class="hairdresser-stats">
                    <div class="hairdresser-stat">
                        <div class="hairdresser-stat-value">${reviewCount}</div>
                        <div class="hairdresser-stat-label">レビュー</div>
                    </div>
                    <div class="hairdresser-stat">
                        <div class="hairdresser-stat-value" style="font-size: 16px;">${avgAge}歳</div>
                        <div class="hairdresser-stat-label">平均年齢</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    grid.innerHTML = cards;
}
