// Hairdresser Dashboard JavaScript - Premium Design

let currentUser = null;
let myReviews = [];
let allHairdressers = [];
let allSurveys = [];
let charts = {};

// Premium Color Palette
const COLOR_PALETTE = {
    primary: ['#667eea', '#764ba2', '#9b59b6', '#8e44ad', '#6C5CE7'],
    gradient: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#feca57'],
    accent: ['#f093fb', '#ff6b9d', '#ffa8a8', '#20e3b2', '#48dbfb'],
    full: ['#667eea', '#764ba2', '#9b59b6', '#f093fb', '#ff6b9d', '#20e3b2', '#feca57', '#48dbfb', '#0abde3'],
    occupation: ['#667eea', '#764ba2', '#f093fb', '#ff6b9d', '#feca57', '#48dbfb', '#0abde3', '#00d2d3'],
    womanType: ['#FFB6C1', '#FFC0CB', '#C8A2C8', '#9370DB', '#DDA0DD', '#E6E6FA']
};

// Helper function to normalize child status display
function normalizeChildStatus(status) {
    if (!status || status === '未回答') return '未回答';
    if (status === '有' || status === 'いる') return 'いる';
    if (status === '無' || status === 'いない') return 'いない';
    return status;
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
    setupTabs();
});

function checkAuth() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user || user.role !== 'hairdresser') {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

function loadDashboardData() {
    // Display user info
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('salon-name').textContent = currentUser.salon;
    document.getElementById('target-age').textContent = currentUser.targetAge || '-';

    // Load profile image
    loadProfileImage();

    // Load all data
    allHairdressers = JSON.parse(localStorage.getItem('hairdressers') || '[]');
    allSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    myReviews = allSurveys.filter(s => s.imageFile === currentUser.imageFile);

    document.getElementById('review-count').textContent = myReviews.length;

    if (myReviews.length > 0) {
        analyzeAndDisplay();
    } else {
        document.querySelector('.main-content').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <div class="empty-text">まだレビューがありません</div>
            </div>
        `;
    }
}

function loadProfileImage() {
    const images = JSON.parse(localStorage.getItem('images') || '{}');
    const imageData = images[currentUser.imageFile];
    const imgElement = document.getElementById('profile-img');

    if (imageData) {
        imgElement.src = imageData;
    } else {
        imgElement.src = 'https://via.placeholder.com/80/667eea/ffffff?text=' + encodeURIComponent(currentUser.name.charAt(0));
    }
}

function analyzeAndDisplay() {
    // Calculate average age
    const totalAge = myReviews.reduce((sum, r) => sum + (parseInt(r.age) || 0), 0);
    const avgAge = Math.round(totalAge / myReviews.length);
    document.getElementById('avg-age').textContent = avgAge || '-';

    // Generate target recommendation
    generateTargetRecommendation();

    // Create all charts - ALL DOUGHNUT/PIE CHARTS
    createAgeChart();
    createWomanTypeChart();
    createOccupationChart();
    createMaritalChart();
    createChildrenChart();
    createComparisonAnalysis();
}

function generateTargetRecommendation() {
    const analysis = {
        topAge: getTopCategory(myReviews, 'age', true),
        topWomanType: getTopCategory(myReviews, 'womanType'),
        topOccupation: getTopCategory(myReviews, 'occupation'),
        topMarital: getTopCategory(myReviews, 'maritalStatus'),
        topChildren: getTopCategory(myReviews, 'hasChildren')
    };

    const avgAge = Math.round(myReviews.reduce((sum, r) => sum + (parseInt(r.age) || 0), 0) / myReviews.length);
    const targetAge = currentUser.targetAge ? parseInt(currentUser.targetAge) : avgAge;
    const ageDiff = Math.abs(avgAge - targetAge);

    let recommendationHtml = '';

    // Main insight
    recommendationHtml += `
        <div style="font-size: 17px; margin-bottom: 20px; font-weight: 500;">
            あなたの作品は主に<span class="insight-highlight">${analysis.topAge.label}</span>の`;

    if (analysis.topWomanType.value) {
        recommendationHtml += `<span class="insight-highlight">${analysis.topWomanType.value}</span>タイプの女性に支持されています。`;
    } else {
        recommendationHtml += `女性に支持されています。`;
    }
    recommendationHtml += '</div>';

    // Insight boxes
    recommendationHtml += '<div class="insight-boxes">';

    // Target alignment
    if (ageDiff <= 3) {
        recommendationHtml += `
            <div class="insight-box">
                <div class="insight-box-title">✅ ターゲット適合度</div>
                <div class="insight-box-value">優秀！ (差: ${ageDiff}歳)</div>
            </div>
        `;
    } else {
        recommendationHtml += `
            <div class="insight-box">
                <div class="insight-box-title">💡 改善の機会</div>
                <div class="insight-box-value">差: ${ageDiff}歳</div>
            </div>
        `;
    }

    // Top occupation
    if (analysis.topOccupation.value && analysis.topOccupation.value !== '未回答') {
        recommendationHtml += `
            <div class="insight-box">
                <div class="insight-box-title">💼 主な職業</div>
                <div class="insight-box-value">${analysis.topOccupation.value}</div>
            </div>
        `;
    }

    // Top marital status
    if (analysis.topMarital.value && analysis.topMarital.value !== '未回答') {
        recommendationHtml += `
            <div class="insight-box">
                <div class="insight-box-title">💍 主な層</div>
                <div class="insight-box-value">${analysis.topMarital.value}</div>
            </div>
        `;
    }

    recommendationHtml += '</div>';

    document.getElementById('target-recommendation').innerHTML = recommendationHtml;
}

function getTopCategory(reviews, field, isAge = false) {
    if (isAge) {
        const ageGroups = {};
        reviews.forEach(r => {
            const age = parseInt(r.age);
            let group = '';
            if (age >= 20 && age < 25) group = '20〜24歳';
            else if (age >= 25 && age < 30) group = '25〜29歳';
            else if (age >= 30 && age < 35) group = '30〜34歳';
            else if (age >= 35 && age < 40) group = '35〜39歳';
            else if (age >= 40 && age < 45) group = '40〜44歳';
            if (group) ageGroups[group] = (ageGroups[group] || 0) + 1;
        });
        const topGroup = Object.entries(ageGroups).sort((a, b) => b[1] - a[1])[0];
        return { label: topGroup ? topGroup[0] : '不明', count: topGroup ? topGroup[1] : 0 };
    }

    const counts = {};
    reviews.forEach(r => {
        const value = r[field] || '未回答';
        counts[value] = (counts[value] || 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { value: top ? top[0] : '', count: top ? top[1] : 0 };
}

function createAgeChart() {
    const ageGroups = {
        '20〜24歳': 0, '25〜29歳': 0, '30〜34歳': 0, '35〜39歳': 0, '40〜44歳': 0
    };

    myReviews.forEach(review => {
        const age = parseInt(review.age);
        if (age >= 20 && age < 25) ageGroups['20〜24歳']++;
        else if (age >= 25 && age < 30) ageGroups['25〜29歳']++;
        else if (age >= 30 && age < 35) ageGroups['30〜34歳']++;
        else if (age >= 35 && age < 40) ageGroups['35〜39歳']++;
        else if (age >= 40 && age < 45) ageGroups['40〜44歳']++;
    });

    const ctx = document.getElementById('age-chart');
    charts.age = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                data: Object.values(ageGroups),
                backgroundColor: COLOR_PALETTE.gradient,
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    cornerRadius: 8
                }
            },
            cutout: '60%'
        }
    });

    createLegend('age-legend', Object.keys(ageGroups), COLOR_PALETTE.gradient);
}

function createWomanTypeChart() {
    const womanTypes = {};
    myReviews.forEach(review => {
        const type = review.womanType || '未回答';
        womanTypes[type] = (womanTypes[type] || 0) + 1;
    });

    const ctx = document.getElementById('womanType-chart');
    charts.womanType = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(womanTypes),
            datasets: [{
                data: Object.values(womanTypes),
                backgroundColor: COLOR_PALETTE.womanType,
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    cornerRadius: 8
                }
            },
            cutout: '60%'
        }
    });

    createLegend('womanType-legend', Object.keys(womanTypes), COLOR_PALETTE.womanType);
}

function createOccupationChart() {
    const occupations = {};
    myReviews.forEach(review => {
        const occ = review.occupation || '未回答';
        occupations[occ] = (occupations[occ] || 0) + 1;
    });

    const ctx = document.getElementById('occupation-chart');
    charts.occupation = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(occupations),
            datasets: [{
                data: Object.values(occupations),
                backgroundColor: COLOR_PALETTE.occupation,
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    cornerRadius: 8
                }
            },
            cutout: '60%'
        }
    });

    createLegend('occupation-legend', Object.keys(occupations), COLOR_PALETTE.occupation);
}

function createMaritalChart() {
    const marital = {};
    myReviews.forEach(review => {
        const status = review.maritalStatus || '未回答';
        marital[status] = (marital[status] || 0) + 1;
    });

    const ctx = document.getElementById('marital-chart');
    charts.marital = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(marital),
            datasets: [{
                data: Object.values(marital),
                backgroundColor: COLOR_PALETTE.primary,
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    cornerRadius: 8
                }
            },
            cutout: '60%'
        }
    });

    createLegend('marital-legend', Object.keys(marital), COLOR_PALETTE.primary);
}

function createChildrenChart() {
    const children = {};
    myReviews.forEach(review => {
        const has = normalizeChildStatus(review.hasChildren);
        children[has] = (children[has] || 0) + 1;
    });

    const ctx = document.getElementById('children-chart');
    charts.children = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(children),
            datasets: [{
                data: Object.values(children),
                backgroundColor: COLOR_PALETTE.accent,
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    cornerRadius: 8
                }
            },
            cutout: '60%'
        }
    });

    createLegend('children-legend', Object.keys(children), COLOR_PALETTE.accent);
}

function createComparisonAnalysis() {
    const container = document.getElementById('comparison-content');

    // Calculate stats for all hairdressers
    const hairdresserStats = allHairdressers.map(h => {
        const reviews = allSurveys.filter(s => s.imageFile === h.imageFile);
        const avgAge = reviews.length > 0
            ? Math.round(reviews.reduce((sum, r) => sum + (parseInt(r.age) || 0), 0) / reviews.length)
            : 0;
        const targetAge = parseInt(h.targetAge) || 0;
        const ageDiff = targetAge > 0 ? Math.abs(avgAge - targetAge) : 999;

        return {
            name: h.name,
            salon: h.salon,
            reviewCount: reviews.length,
            avgAge: avgAge,
            targetAge: targetAge,
            ageDiff: ageDiff,
            isMe: h.email === currentUser.email
        };
    });

    const myStats = hairdresserStats.find(s => s.isMe);
    if (!myStats) return;

    // Review count ranking
    const sortedByReviews = [...hairdresserStats].sort((a, b) => b.reviewCount - a.reviewCount);
    const reviewRank = sortedByReviews.findIndex(s => s.isMe) + 1;
    const maxReviews = sortedByReviews[0].reviewCount;

    // Target accuracy ranking
    const sortedByAccuracy = [...hairdresserStats]
        .filter(s => s.targetAge > 0)
        .sort((a, b) => a.ageDiff - b.ageDiff);
    const accuracyRank = sortedByAccuracy.findIndex(s => s.isMe) + 1;

    let html = '';

    // Review count comparison
    html += `
        <div class="comparison-item">
            <div class="comparison-label">📊 レビュー数</div>
            <div class="comparison-bar">
                <div class="comparison-bar-fill" style="width: ${(myStats.reviewCount / maxReviews * 100)}%">
                    ${myStats.reviewCount}件
                </div>
            </div>
            <div class="comparison-detail">
                ${allHairdressers.length}人中 ${reviewRank}位 (平均: ${Math.round(sortedByReviews.reduce((sum, s) => sum + s.reviewCount, 0) / sortedByReviews.length)}件)
            </div>
        </div>
    `;

    // Target accuracy comparison
    if (myStats.targetAge > 0) {
        html += `
            <div class="comparison-item">
                <div class="comparison-label">🎯 ターゲット適合度</div>
                <div class="comparison-bar">
                    <div class="comparison-bar-fill" style="width: ${Math.max(10, 100 - myStats.ageDiff * 10)}%">
                        差: ${myStats.ageDiff}歳
                    </div>
                </div>
                <div class="comparison-detail">
                    ${sortedByAccuracy.length}人中 ${accuracyRank}位
                    ${myStats.ageDiff <= 3 ? '✅ 優秀！' : myStats.ageDiff <= 5 ? '⚠️ 改善の余地あり' : '💡 要改善'}
                </div>
            </div>
        `;
    }

    // Learning insights
    html += `
        <div class="comparison-item" style="border-left-color: #f093fb;">
            <div class="comparison-label">💡 改善のヒント</div>
            <div style="font-size: 14px; line-height: 1.7; color: #4a5568; margin-top: 8px;">
                ${reviewRank === 1 ? '🏆 レビュー数1位！この調子でキープしましょう。' :
                  reviewRank <= 3 ? '⭐ 上位のパフォーマンス！さらなる成長を目指しましょう。' :
                  'より多くのレビューを獲得するため、顧客層に合わせたスタイル提案を強化しましょう。'}
                ${myStats.targetAge > 0 && myStats.ageDiff <= 3 ? '<br>✅ ターゲット設定が的確です！' :
                  myStats.targetAge > 0 && myStats.ageDiff > 5 ? '<br>💡 ターゲット層の見直しを検討してみましょう。' : ''}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function createLegend(elementId, labels, colors) {
    const legendEl = document.getElementById(elementId);
    legendEl.innerHTML = labels.map((label, i) => `
        <div class="legend-item">
            <div class="legend-color" style="background: ${colors[i % colors.length]}"></div>
            <span>${label}</span>
        </div>
    `).join('');
}
