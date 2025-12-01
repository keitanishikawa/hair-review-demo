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

function loadOwnerDashboard() {
    // Load data from localStorage
    hairdressers = JSON.parse(localStorage.getItem('hairdressers') || '[]');
    allSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');

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
            </div>
        `;
        return;
    }

    // Calculate stats
    document.getElementById('total-hairdressers').textContent = hairdressers.length;
    document.getElementById('total-reviews').textContent = allSurveys.length;
    document.getElementById('avg-reviews').textContent = Math.round(allSurveys.length / hairdressers.length);

    // Create charts
    createOverallWomanTypeChart();
    createOverallAgeChart();
    createHairdresserComparisonChart();
    displayHairdresserCards();
}

function createOverallWomanTypeChart() {
    const types = {};
    allSurveys.forEach(survey => {
        const type = survey.womanType || '未回答';
        types[type] = (types[type] || 0) + 1;
    });

    const ctx = document.getElementById('overall-woman-type-chart');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(types),
            datasets: [{
                label: '回答数',
                data: Object.values(types),
                backgroundColor: '#706fd3'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
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

        // Get top woman type
        const types = {};
        reviews.forEach(r => {
            const type = r.womanType || '未回答';
            types[type] = (types[type] || 0) + 1;
        });
        const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
        const topWomanType = topType ? topType[0] : '-';

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
                        <div class="hairdresser-stat-value" style="font-size: 16px;">${topWomanType}</div>
                        <div class="hairdresser-stat-label">最多像</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    grid.innerHTML = cards;
}
