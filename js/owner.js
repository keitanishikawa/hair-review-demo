// Owner Dashboard JavaScript

let hairdressers = [];
let allSurveys = [];
let staffStats = [];
let allCharts = {};
let staffImages = {};

// Color Palette - Purple Gradient Theme
const COLOR_PALETTE = {
    primary: ['#667eea', '#764ba2', '#9b59b6', '#8e44ad'],
    gradient: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
    accent: ['#f093fb', '#ff6b9d', '#ffa8a8', '#20e3b2'],
    full: ['#667eea', '#764ba2', '#9b59b6', '#f093fb', '#ff6b9d', '#20e3b2', '#feca57']
};

// Helper function to normalize child status display
function normalizeChildStatus(status) {
    if (!status) return '-';
    if (status === '有' || status === 'いる') return 'いる';
    if (status === '無' || status === 'いない') return 'いない';
    return status;
}

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

// Tab Switching
function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Add active class to selected tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Load tab-specific content
    if (tabName === 'staff-list') {
        displayStaffCards();
        populateSalonFilter();
    } else if (tabName === 'comparison') {
        populateComparisonSelector();
    } else if (tabName === 'demographics') {
        populateDemographicsFilter();
        updateDemographics();
    }
}

function loadOwnerDashboard() {
    // Load data from localStorage
    hairdressers = JSON.parse(localStorage.getItem('hairdressers') || '[]');
    allSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    staffImages = JSON.parse(localStorage.getItem('images') || '{}');

    console.log('🔍 オーナーダッシュボード - データ読み込み結果:');
    console.log('- 美容師数:', hairdressers.length);
    console.log('- アンケート数:', allSurveys.length);
    console.log('- 画像数:', Object.keys(staffImages).length);

    if (hairdressers.length === 0) {
        document.querySelector('.main-container').innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 24px;">📊</div>
                <h2 style="font-size: 24px; color: #333; margin-bottom: 12px;">
                    データがまだ登録されていません
                </h2>
                <p style="color: #666; margin-bottom: 24px;">
                    管理者にデータのアップロードを依頼してください
                </p>
            </div>
        `;
        return;
    }

    // Calculate staff stats
    calculateStaffStats();

    // Display overview stats
    document.getElementById('total-hairdressers').textContent = hairdressers.length;
    document.getElementById('total-reviews').textContent = allSurveys.length;
    document.getElementById('avg-reviews').textContent = Math.round(allSurveys.length / hairdressers.length);

    // Create overview charts
    createOverallAgeChart();
    createHairdresserComparisonChart();
}

function calculateStaffStats() {
    staffStats = hairdressers.map(hairdresser => {
        const reviews = allSurveys.filter(s => s.imageFile === hairdresser.imageFile);
        const reviewCount = reviews.length;

        // Calculate average age
        const totalAge = reviews.reduce((sum, r) => sum + (parseInt(r.age) || 0), 0);
        const avgAge = reviewCount > 0 ? (totalAge / reviewCount).toFixed(1) : 0;

        // Count married/has children
        const marriedCount = reviews.filter(r => r.maritalStatus === '既婚').length;
        const hasChildrenCount = reviews.filter(r => r.hasChildren === '有' || r.hasChildren === 'いる').length;

        // Find most popular woman type
        const womanTypeCounts = {};
        reviews.forEach(r => {
            if (r.womanType) {
                womanTypeCounts[r.womanType] = (womanTypeCounts[r.womanType] || 0) + 1;
            }
        });
        const popularStyle = Object.entries(womanTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
        const popularStyleCount = womanTypeCounts[popularStyle] || 0;

        // Find most popular occupation
        const occupationCounts = {};
        reviews.forEach(r => {
            if (r.occupation) {
                occupationCounts[r.occupation] = (occupationCounts[r.occupation] || 0) + 1;
            }
        });
        const popularOccupation = Object.entries(occupationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

        // Calculate age difference from target
        const targetAge = hairdresser.targetAge;
        let ageDiff = 0;
        if (targetAge && avgAge > 0) {
            // Extract numbers from target age (e.g., "30代" -> 35)
            const targetMatch = targetAge.match(/(\d+)/);
            if (targetMatch) {
                const targetNum = parseInt(targetMatch[1]);
                const targetMidpoint = targetNum + 5; // 30代 -> 35
                ageDiff = (parseFloat(avgAge) - targetMidpoint).toFixed(1);
            }
        }

        return {
            ...hairdresser,
            reviewCount,
            avgAge: parseFloat(avgAge),
            marriedCount,
            hasChildrenCount,
            popularStyle,
            popularStyleCount,
            popularOccupation,
            ageDiff: parseFloat(ageDiff),
            reviews
        };
    });
}

// Overview Charts
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
    if (allCharts['overall-age']) allCharts['overall-age'].destroy();
    allCharts['overall-age'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                data: Object.values(ageGroups),
                backgroundColor: COLOR_PALETTE.gradient
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
    const reviewCounts = staffStats
        .map(s => ({ name: s.name, count: s.reviewCount }))
        .sort((a, b) => b.count - a.count);

    const ctx = document.getElementById('hairdresser-comparison-chart');
    if (allCharts['comparison']) allCharts['comparison'].destroy();

    // Create gradient colors for each bar
    const colors = reviewCounts.map((_, i) => COLOR_PALETTE.primary[i % COLOR_PALETTE.primary.length]);

    allCharts['comparison'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: reviewCounts.map(r => r.name),
            datasets: [{
                label: 'レビュー数',
                data: reviewCounts.map(r => r.count),
                backgroundColor: colors
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

// Staff List Tab
function displayStaffCards() {
    const grid = document.getElementById('staff-grid');
    if (!grid) return;

    const cards = staffStats.map(staff => {
        const imageUrl = staffImages[staff.imageFile] || '';
        const initials = staff.name.substring(0, 2);
        const ageDiffDisplay = staff.ageDiff > 0 ? `+${staff.ageDiff}歳` : `${staff.ageDiff}歳`;
        const ageDiffColor = Math.abs(staff.ageDiff) > 5 ? '#f5576c' : '#20e3b2';

        // Calculate percentages
        const marriedRate = staff.reviewCount > 0 ? Math.round((staff.marriedCount / staff.reviewCount) * 100) : 0;
        const childrenRate = staff.reviewCount > 0 ? Math.round((staff.hasChildrenCount / staff.reviewCount) * 100) : 0;

        // Calculate target matching rate
        const targetMatchRate = staff.targetAge && staff.avgAge > 0
            ? Math.max(0, 100 - Math.abs(staff.ageDiff) * 10)
            : 0;

        // Avatar with image or initials fallback
        const avatarHtml = imageUrl
            ? `<div class="staff-avatar" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"></div>`
            : `<div class="staff-avatar">${initials}</div>`;

        return `
            <div class="staff-card" onclick="showStaffDetail('${staff.email}')" style="cursor: pointer;">
                <div class="staff-header">
                    ${avatarHtml}
                    <div class="staff-info">
                        <div class="staff-name">${staff.name}</div>
                        <div class="staff-salon">${staff.salon}</div>
                    </div>
                </div>
                <div class="staff-metrics">
                    <div class="metric-box">
                        <div class="metric-value">${staff.reviewCount}</div>
                        <div class="metric-label">レビュー</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value" style="font-size: 20px;">${staff.avgAge}歳</div>
                        <div class="metric-label">獲得レビュー平均</div>
                    </div>
                </div>
                <div class="staff-details">
                    <div class="detail-item">
                        <div class="detail-label">人気属性</div>
                        <div class="detail-value">${staff.popularStyle}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">既婚者</div>
                        <div class="detail-value">${staff.marriedCount}人 (${marriedRate}%)</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">子供いる</div>
                        <div class="detail-value">${staff.hasChildrenCount}人 (${childrenRate}%)</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">主な職業</div>
                        <div class="detail-value">${staff.popularOccupation}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">マッチング率</div>
                        <div class="detail-value" style="color: ${ageDiffColor};">${targetMatchRate}%</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    grid.innerHTML = cards;
}

// Staff Detail View
function showStaffDetail(staffEmail) {
    const staff = staffStats.find(s => s.email === staffEmail);
    if (!staff) return;

    // Create detailed analysis view
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };

    const imageUrl = staffImages[staff.imageFile] || '';
    const initials = staff.name.substring(0, 2);
    const ageDiffDisplay = staff.ageDiff > 0 ? `+${staff.ageDiff}歳` : `${staff.ageDiff}歳`;
    const ageDiffColor = Math.abs(staff.ageDiff) > 5 ? '#f5576c' : '#20e3b2';

    // Calculate satisfaction score (based on review count and age match)
    const satisfactionScore = Math.min(100, (staff.reviewCount * 5) + (10 - Math.abs(staff.ageDiff)) * 3);

    // Age distribution
    const ageDistribution = {};
    staff.reviews.forEach(r => {
        const ageGroup = Math.floor(parseInt(r.age) / 10) * 10;
        const key = `${ageGroup}代`;
        ageDistribution[key] = (ageDistribution[key] || 0) + 1;
    });

    const avatarHtml = imageUrl
        ? `<div style="width: 80px; height: 80px; border-radius: 50%; background-image: url('${imageUrl}'); background-size: cover; background-position: center; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"></div>`
        : `<div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 28px; font-weight: bold; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">${initials}</div>`;

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; border-radius: 20px 20px 0 0; color: white; position: relative;">
                <button onclick="this.closest('div').parentElement.parentElement.remove()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center;">×</button>
                <div style="display: flex; align-items: center; gap: 24px;">
                    ${avatarHtml}
                    <div>
                        <h2 style="font-size: 28px; margin-bottom: 8px;">${staff.name}</h2>
                        <p style="font-size: 16px; opacity: 0.9; margin-bottom: 4px;">${staff.salon}</p>
                        <p style="font-size: 14px; opacity: 0.8;">ターゲット: ${staff.targetAge || '-'}</p>
                    </div>
                </div>
            </div>

            <div style="padding: 32px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; margin-bottom: 4px;">${staff.reviewCount}</div>
                        <div style="font-size: 13px; opacity: 0.9;">レビュー数</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; margin-bottom: 4px;">${staff.avgAge}歳</div>
                        <div style="font-size: 13px; opacity: 0.9;">平均年齢</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #20e3b2 0%, #2ed573 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; margin-bottom: 4px;">${satisfactionScore}</div>
                        <div style="font-size: 13px; opacity: 0.9;">満足度スコア</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px; color: ${ageDiffColor};">${ageDiffDisplay}</div>
                        <div style="font-size: 13px; opacity: 0.9;">年齢差</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                    <div style="background: #f8f9fc; padding: 20px; border-radius: 12px;">
                        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #667eea;">👥 顧客属性</h3>
                        <div style="display: grid; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">
                                <span style="color: #666;">既婚者数</span>
                                <span style="font-weight: 600; color: #667eea;">${staff.marriedCount}人</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">
                                <span style="color: #666;">子供あり</span>
                                <span style="font-weight: 600; color: #667eea;">${staff.hasChildrenCount}人</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">
                                <span style="color: #666;">人気スタイル</span>
                                <span style="font-weight: 600; color: #667eea;">${staff.popularStyle}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #666;">主な職業</span>
                                <span style="font-weight: 600; color: #667eea;">${staff.popularOccupation}</span>
                            </div>
                        </div>
                    </div>

                    <div style="background: #f8f9fc; padding: 20px; border-radius: 12px;">
                        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #667eea;">📊 年齢層カバレッジ</h3>
                        <div style="display: grid; gap: 8px;">
                            ${Object.entries(ageDistribution).map(([age, count]) => `
                                <div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px;">
                                        <span style="color: #666;">${age}</span>
                                        <span style="font-weight: 600; color: #667eea;">${count}人</span>
                                    </div>
                                    <div style="background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden;">
                                        <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${(count / staff.reviewCount) * 100}%;"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div style="background: #f0f4ff; padding: 20px; border-radius: 12px; border-left: 4px solid #667eea;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #667eea;">📈 分析サマリー</h3>
                    <p style="color: #666; line-height: 1.6; margin: 0;">
                        ${staff.name}さんは<strong style="color: #667eea;">${staff.reviewCount}件のレビュー</strong>を獲得しており、
                        顧客の平均年齢は<strong style="color: #667eea;">${staff.avgAge}歳</strong>です。
                        ターゲット年齢との差は<strong style="color: ${ageDiffColor};">${ageDiffDisplay}</strong>で、
                        ${Math.abs(staff.ageDiff) <= 5 ? '理想的なターゲティングができています。' : '若干のズレがあります。マーケティング戦略の見直しを検討してください。'}
                        主なスタイルは<strong style="color: #667eea;">${staff.popularStyle}</strong>で、
                        <strong style="color: #667eea;">${staff.popularOccupation}</strong>の顧客に人気です。
                    </p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function populateSalonFilter() {
    const salonFilter = document.getElementById('salon-filter');
    if (!salonFilter) return;

    const salons = [...new Set(hairdressers.map(h => h.salon))];
    salonFilter.innerHTML = '<option value="">すべてのサロン</option>' +
        salons.map(salon => `<option value="${salon}">${salon}</option>`).join('');
}

function filterStaff() {
    const searchTerm = document.getElementById('staff-search').value.toLowerCase();
    const salonFilter = document.getElementById('salon-filter').value;
    const sortBy = document.getElementById('sort-select').value;

    let filtered = [...staffStats];

    // Apply filters
    if (searchTerm) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(searchTerm) ||
            s.salon.toLowerCase().includes(searchTerm)
        );
    }

    if (salonFilter) {
        filtered = filtered.filter(s => s.salon === salonFilter);
    }

    // Apply sorting
    switch (sortBy) {
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'reviews-desc':
            filtered.sort((a, b) => b.reviewCount - a.reviewCount);
            break;
        case 'reviews-asc':
            filtered.sort((a, b) => a.reviewCount - b.reviewCount);
            break;
        case 'age-desc':
            filtered.sort((a, b) => b.avgAge - a.avgAge);
            break;
        case 'age-asc':
            filtered.sort((a, b) => a.avgAge - b.avgAge);
            break;
    }

    // Display filtered results
    const grid = document.getElementById('staff-grid');
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">該当するスタッフが見つかりませんでした</p>';
        return;
    }

    const cards = filtered.map(staff => {
        const initials = staff.name.substring(0, 2);
        const ageDiffDisplay = staff.ageDiff > 0 ? `+${staff.ageDiff}歳` : `${staff.ageDiff}歳`;
        const ageDiffColor = Math.abs(staff.ageDiff) > 5 ? '#ff6348' : '#2ed573';

        return `
            <div class="staff-card">
                <div class="staff-header">
                    <div class="staff-avatar">${initials}</div>
                    <div class="staff-info">
                        <div class="staff-name">${staff.name} (${staff.avgAge}歳)</div>
                        <div class="staff-salon">${staff.salon}</div>
                    </div>
                </div>
                <div class="staff-metrics">
                    <div class="metric-box">
                        <div class="metric-value">${staff.reviewCount}</div>
                        <div class="metric-label">レビュー</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value" style="font-size: 20px;">${staff.avgAge}歳</div>
                        <div class="metric-label">顧客平均年齢</div>
                    </div>
                </div>
                <div class="staff-details">
                    <div class="detail-item">
                        <div class="detail-label">人気スタイル</div>
                        <div class="detail-value">${staff.popularStyle}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">既婚者数</div>
                        <div class="detail-value">${staff.marriedCount}人</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">子供あり</div>
                        <div class="detail-value">${staff.hasChildrenCount}人</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">主な職業</div>
                        <div class="detail-value">${staff.popularOccupation}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">年齢差</div>
                        <div class="detail-value" style="color: ${ageDiffColor};">${ageDiffDisplay}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    grid.innerHTML = cards;
}

// Comparison Tab
function populateComparisonSelector() {
    const grid = document.getElementById('comparison-selector-grid');
    if (!grid) return;

    const selectors = staffStats.map(staff => `
        <select class="filter-select comparison-select" data-staff-id="${staff.email}">
            <option value="">-- 選択 --</option>
            ${staffStats.map(s => `<option value="${s.email}">${s.name}</option>`).join('')}
        </select>
    `).slice(0, 4).join('');

    grid.innerHTML = selectors;
}

function runComparison() {
    const selects = document.querySelectorAll('.comparison-select');
    const selectedStaff = Array.from(selects)
        .map(s => s.value)
        .filter(v => v)
        .map(email => staffStats.find(s => s.email === email));

    if (selectedStaff.length < 2) {
        alert('比較するには最低2人のスタッフを選択してください');
        return;
    }

    const resultsDiv = document.getElementById('comparison-results');
    resultsDiv.style.display = 'block';

    resultsDiv.innerHTML = `
        <div class="comparison-results">
            <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">総合比較</h3>
            <canvas id="radar-chart" style="max-height: 400px; margin-bottom: 32px;"></canvas>
            <div class="comparison-stats-grid" id="comparison-stats"></div>
        </div>
    `;

    createRadarChart(selectedStaff);
    displayComparisonStats(selectedStaff);
}

function createRadarChart(staffList) {
    const ctx = document.getElementById('radar-chart');
    if (allCharts['radar']) allCharts['radar'].destroy();

    const datasets = staffList.map((staff, index) => {
        const color = COLOR_PALETTE.gradient[index % COLOR_PALETTE.gradient.length];

        return {
            label: staff.name,
            data: [
                staff.reviewCount,
                staff.avgAge,
                staff.popularStyleCount,
                Math.round((staff.marriedCount / staff.reviewCount) * 10),
                Math.round((staff.hasChildrenCount / staff.reviewCount) * 10)
            ],
            backgroundColor: color + '20',
            borderColor: color,
            borderWidth: 2
        };
    });

    allCharts['radar'] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['レビュー数', '平均年齢', 'スタイル多様性', '既婚率', '子供あり'],
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function displayComparisonStats(staffList) {
    const statsGrid = document.getElementById('comparison-stats');

    const cards = staffList.map(staff => {
        const ageDiffDisplay = staff.ageDiff > 0 ? `+${staff.ageDiff}歳` : `${staff.ageDiff}歳`;

        return `
            <div class="comparison-stat-card">
                <h4 style="font-size: 18px; font-weight: 600; color: #667eea; margin-bottom: 16px;">
                    ${staff.name} (${staff.avgAge}歳)
                </h4>
                <div style="display: grid; gap: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #666;">レビュー数</span>
                        <span style="font-weight: 600; color: #667eea;">${staff.reviewCount}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #666;">顧客平均年齢</span>
                        <span style="font-weight: 600; color: #667eea;">${staff.avgAge}歳</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #666;">年齢差</span>
                        <span style="font-weight: 600;">${ageDiffDisplay}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #666;">既婚者数</span>
                        <span style="font-weight: 600;">${staff.marriedCount}人</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #666;">子供あり</span>
                        <span style="font-weight: 600;">${staff.hasChildrenCount}人</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #666;">人気スタイル</span>
                        <span style="font-weight: 600; color: #667eea;">${staff.popularStyle}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #666;">主な職業</span>
                        <span style="font-weight: 600; color: #667eea;">${staff.popularOccupation}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    statsGrid.innerHTML = cards;
}

// Demographics Tab
function populateDemographicsFilter() {
    const filter = document.getElementById('demographics-staff-filter');
    if (!filter) return;

    filter.innerHTML = '<option value="">全体</option>' +
        staffStats.map(s => `<option value="${s.email}">${s.name}</option>`).join('');
}

function updateDemographics() {
    const selectedEmail = document.getElementById('demographics-staff-filter').value;
    const surveys = selectedEmail
        ? allSurveys.filter(s => {
            const staff = hairdressers.find(h => h.email === selectedEmail);
            return staff && s.imageFile === staff.imageFile;
        })
        : allSurveys;

    createDemographicsCharts(surveys);
}

function createDemographicsCharts(surveys) {
    // Age Distribution
    const ageGroups = { '30-34歳': 0, '40-44歳': 0, '25-29歳': 0, '20-24歳': 0, '35-39歳': 0 };
    surveys.forEach(s => {
        const age = parseInt(s.age);
        if (age >= 30 && age < 35) ageGroups['30-34歳']++;
        else if (age >= 40 && age < 45) ageGroups['40-44歳']++;
        else if (age >= 25 && age < 30) ageGroups['25-29歳']++;
        else if (age >= 20 && age < 25) ageGroups['20-24歳']++;
        else if (age >= 35 && age < 40) ageGroups['35-39歳']++;
    });

    const ageCtx = document.getElementById('demo-age-chart');
    if (allCharts['demo-age']) allCharts['demo-age'].destroy();
    allCharts['demo-age'] = new Chart(ageCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                data: Object.values(ageGroups),
                backgroundColor: COLOR_PALETTE.primary
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Occupation Distribution
    const occupations = {};
    surveys.forEach(s => {
        if (s.occupation) occupations[s.occupation] = (occupations[s.occupation] || 0) + 1;
    });

    const occCtx = document.getElementById('demo-occupation-chart');
    if (allCharts['demo-occ']) allCharts['demo-occ'].destroy();
    allCharts['demo-occ'] = new Chart(occCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(occupations),
            datasets: [{
                data: Object.values(occupations),
                backgroundColor: COLOR_PALETTE.full
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // Marital Status Distribution
    const maritalStatus = { '既婚': 0, '未婚': 0 };
    surveys.forEach(s => {
        if (s.maritalStatus === '既婚') maritalStatus['既婚']++;
        else if (s.maritalStatus === '未婚') maritalStatus['未婚']++;
    });

    const maritalCtx = document.getElementById('demo-marital-chart');
    if (allCharts['demo-marital']) allCharts['demo-marital'].destroy();
    allCharts['demo-marital'] = new Chart(maritalCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(maritalStatus),
            datasets: [{
                data: Object.values(maritalStatus),
                backgroundColor: ['#667eea', '#ff6b9d']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // Children Distribution
    const children = { 'いない': 0, 'いる': 0 };
    surveys.forEach(s => {
        if (s.hasChildren === '有' || s.hasChildren === 'いる') children['いる']++;
        else if (s.hasChildren === '無' || s.hasChildren === 'いない') children['いない']++;
    });

    const childrenCtx = document.getElementById('demo-children-chart');
    if (allCharts['demo-children']) allCharts['demo-children'].destroy();
    allCharts['demo-children'] = new Chart(childrenCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(children),
            datasets: [{
                data: Object.values(children),
                backgroundColor: ['#764ba2', '#ffa8a8']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // Cross Analysis: Occupation × Woman Type
    const crossData = {};
    surveys.forEach(s => {
        if (s.occupation && s.womanType) {
            if (!crossData[s.occupation]) crossData[s.occupation] = {};
            crossData[s.occupation][s.womanType] = (crossData[s.occupation][s.womanType] || 0) + 1;
        }
    });

    const womanTypes = [...new Set(surveys.map(s => s.womanType).filter(Boolean))];
    const datasets = womanTypes.map((type, index) => {
        return {
            label: type,
            data: Object.keys(crossData).map(occ => crossData[occ][type] || 0),
            backgroundColor: COLOR_PALETTE.full[index % COLOR_PALETTE.full.length]
        };
    });

    const crossCtx = document.getElementById('demo-cross-chart');
    if (allCharts['demo-cross']) allCharts['demo-cross'].destroy();
    allCharts['demo-cross'] = new Chart(crossCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(crossData),
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });
}
