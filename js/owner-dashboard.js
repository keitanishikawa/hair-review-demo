// Owner Dashboard JavaScript

// Global data storage
let stylistsData = [];
let reviewsData = [];
let currentCharts = {};

// Check authentication before loading dashboard
function checkAuthentication() {
    const isAuthenticated = sessionStorage.getItem('ownerAuthenticated');
    const authTime = sessionStorage.getItem('ownerAuthTime');

    if (!isAuthenticated || !authTime) {
        alert('アクセスが拒否されました。ログインページからパスワードを入力してください。');
        window.location.href = 'index.html';
        return false;
    }

    // Check if authentication is expired (24 hours)
    const authDate = new Date(authTime);
    const now = new Date();
    const hoursSinceAuth = (now - authDate) / (1000 * 60 * 60);

    if (hoursSinceAuth >= 24) {
        alert('認証が期限切れです。再度ログインしてください。');
        sessionStorage.removeItem('ownerAuthenticated');
        sessionStorage.removeItem('ownerAuthTime');
        window.location.href = 'index.html';
        return false;
    }

    return true;
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuthentication()) {
        return;
    }

    initializeDashboard();
});

// Initialize the dashboard
async function initializeDashboard() {
    try {
        // Load data
        await loadData();

        // Setup event listeners
        setupEventListeners();

        // Initialize overview tab
        initializeOverviewTab();

        // Initialize staff tab
        initializeStaffTab();

        // Initialize comparison tab
        initializeComparisonTab();

        // Initialize demographics tab
        initializeDemographicsTab();

        // Initialize highlights tab
        initializeHighlightsTab();

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('ダッシュボードの初期化に失敗しました。');
    }
}

// Load CSV data
async function loadData() {
    try {
        // Load stylists data
        const stylistsResponse = await fetch('data/stylists.csv');
        const stylistsText = await stylistsResponse.text();
        const stylistsParsed = Papa.parse(stylistsText, { header: true });
        stylistsData = stylistsParsed.data.filter(row => row['姓名'] && row['姓名'].trim());

        // Load reviews data
        const reviewsResponse = await fetch('data/reviews.csv');
        const reviewsText = await reviewsResponse.text();
        const reviewsParsed = Papa.parse(reviewsText, { header: true });
        reviewsData = reviewsParsed.data.filter(row => row['回答者番号']);

        console.log('Loaded:', stylistsData.length, 'stylists and', reviewsData.length, 'reviews');
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// Helper function to calculate stylist layer based on review count
function getStylistLayer(stylist) {
    const imageFile = stylist['アップロード画像ファイル名'];
    const reviewCount = reviewsData.filter(r => r['選択した画像ファイル'] === imageFile).length;

    if (reviewCount >= 30) return 1;  // Layer 1: 30+ reviews
    if (reviewCount >= 20) return 2;  // Layer 2: 20-29 reviews
    if (reviewCount >= 10) return 3;  // Layer 3: 10-19 reviews
    return 4;  // Layer 4: <10 reviews
}

// Helper function to get review count for a stylist
function getReviewCount(stylist) {
    const imageFile = stylist['アップロード画像ファイル名'];
    return reviewsData.filter(r => r['選択した画像ファイル'] === imageFile).length;
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('ログアウトしますか？')) {
            sessionStorage.removeItem('ownerAuthenticated');
            sessionStorage.removeItem('ownerAuthTime');
            window.location.href = 'index.html';
        }
    });

    // Staff search
    document.getElementById('staffSearchInput').addEventListener('input', filterStaff);
    document.getElementById('salonFilter').addEventListener('change', filterStaff);
    document.getElementById('sortBy').addEventListener('change', filterStaff);

    // Comparison button
    document.getElementById('compareBtn').addEventListener('click', performComparison);

    // Demographics stylist selection
    document.getElementById('demographicsStylistSelect').addEventListener('change', updateDemographicsCharts);

    // Modal close
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('staffModal').style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        const modal = document.getElementById('staffModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Password change button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', handlePasswordChange);
    }
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Initialize Overview Tab
function initializeOverviewTab() {
    // Calculate overview stats
    const totalStylists = stylistsData.length;
    const totalReviews = reviewsData.length;
    const avgReviewsPerStylist = (totalReviews / totalStylists).toFixed(1);
    const uniqueSalons = new Set(stylistsData.map(s => s['勤務サロン名'])).size;

    // Update stat cards
    document.getElementById('totalStylists').textContent = totalStylists;
    document.getElementById('totalReviews').textContent = totalReviews;
    document.getElementById('avgReviewsPerStylist').textContent = avgReviewsPerStylist;
    document.getElementById('totalSalons').textContent = uniqueSalons;

    // Create charts
    createTopStaffChart();
    createSalonDistributionChart();
    createOverallDemographicsChart();
    createStylePreferencesChart();
}

// Create Top Staff Chart
function createTopStaffChart() {
    const stylistReviewCounts = stylistsData.map(stylist => {
        const imageFile = stylist['アップロード画像ファイル名'];
        const reviewCount = reviewsData.filter(r => r['選択した画像ファイル'] === imageFile).length;
        return {
            name: stylist['姓名'],
            count: reviewCount
        };
    });

    // Sort and get top 10
    stylistReviewCounts.sort((a, b) => b.count - a.count);
    const top10 = stylistReviewCounts.slice(0, 10);

    const ctx = document.getElementById('topStaffChart');
    if (currentCharts.topStaff) currentCharts.topStaff.destroy();

    currentCharts.topStaff = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(s => s.name),
            datasets: [{
                label: 'レビュー数',
                data: top10.map(s => s.count),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Create Salon Distribution Chart
function createSalonDistributionChart() {
    const salonCounts = {};
    stylistsData.forEach(stylist => {
        const salon = stylist['勤務サロン名'];
        salonCounts[salon] = (salonCounts[salon] || 0) + 1;
    });

    const ctx = document.getElementById('salonDistributionChart');
    if (currentCharts.salonDistribution) currentCharts.salonDistribution.destroy();

    currentCharts.salonDistribution = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(salonCounts),
            datasets: [{
                data: Object.values(salonCounts),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(237, 100, 166, 0.8)',
                    'rgba(255, 154, 158, 0.8)',
                    'rgba(250, 208, 196, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Create Overall Demographics Chart
function createOverallDemographicsChart() {
    const ageGroups = {};
    reviewsData.forEach(review => {
        const age = review['年齢'];
        if (!age) return;

        let group;
        if (age >= 20 && age <= 24) group = '20~24歳';
        else if (age >= 25 && age <= 29) group = '25~29歳';
        else if (age >= 30 && age <= 34) group = '30~34歳';
        else if (age >= 35 && age <= 39) group = '35~39歳';
        else if (age >= 40 && age <= 44) group = '40~44歳';
        else return;

        ageGroups[group] = (ageGroups[group] || 0) + 1;
    });

    const ctx = document.getElementById('overallDemographicsChart');
    if (currentCharts.overallDemographics) currentCharts.overallDemographics.destroy();

    currentCharts.overallDemographics = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                data: Object.values(ageGroups),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(237, 100, 166, 0.8)',
                    'rgba(255, 154, 158, 0.8)',
                    'rgba(250, 208, 196, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Create Style Preferences Chart
function createStylePreferencesChart() {
    const styles = {};
    reviewsData.forEach(review => {
        const style = review['女性像'];
        if (style) {
            styles[style] = (styles[style] || 0) + 1;
        }
    });

    const ctx = document.getElementById('stylePreferencesChart');
    if (currentCharts.stylePreferences) currentCharts.stylePreferences.destroy();

    currentCharts.stylePreferences = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: Object.keys(styles),
            datasets: [{
                data: Object.values(styles),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.7)',
                    'rgba(118, 75, 162, 0.7)',
                    'rgba(237, 100, 166, 0.7)',
                    'rgba(255, 154, 158, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Initialize Staff Tab
function initializeStaffTab() {
    // Populate salon filter
    const salons = [...new Set(stylistsData.map(s => s['勤務サロン名']))].sort();
    const salonFilter = document.getElementById('salonFilter');
    salons.forEach(salon => {
        const option = document.createElement('option');
        option.value = salon;
        option.textContent = salon;
        salonFilter.appendChild(option);
    });

    // Display all staff
    displayStaff(stylistsData);
}

// Display staff cards
function displayStaff(stylists) {
    const staffGrid = document.getElementById('staffGrid');
    staffGrid.innerHTML = '';

    if (stylists.length === 0) {
        staffGrid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>該当するスタッフが見つかりませんでした</p></div>';
        return;
    }

    stylists.forEach(stylist => {
        const imageFile = stylist['アップロード画像ファイル名'];
        const reviewCount = reviewsData.filter(r => r['選択した画像ファイル'] === imageFile).length;
        const stylistReviews = reviewsData.filter(r => r['選択した画像ファイル'] === imageFile);

        // Get stylist age
        const stylistAge = parseInt(stylist['年齢']) || 'N/A';

        // Calculate average customer age
        const ages = stylistReviews.map(r => parseInt(r['年齢'])).filter(a => !isNaN(a));
        const avgCustomerAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 'N/A';

        // Find most popular style
        const styles = {};
        stylistReviews.forEach(r => {
            const style = r['女性像'];
            if (style) styles[style] = (styles[style] || 0) + 1;
        });
        const topStyle = Object.keys(styles).sort((a, b) => styles[b] - styles[a])[0] || 'N/A';

        const card = document.createElement('div');
        card.className = 'staff-card';
        card.innerHTML = `
            <div class="staff-card-header">
                <img src="images/${imageFile}" alt="${stylist['姓名']}" class="staff-avatar">
                <div class="staff-basic-info">
                    <h3>${stylist['姓名']} (${stylistAge}歳)</h3>
                    <p>${stylist['勤務サロン名']}</p>
                </div>
            </div>
            <div class="staff-stats">
                <div class="staff-stat">
                    <strong>${reviewCount}</strong>
                    <span>レビュー</span>
                </div>
                <div class="staff-stat">
                    <strong>${avgCustomerAge}</strong>
                    <span>顧客平均年齢</span>
                </div>
                <div class="staff-stat">
                    <strong>${topStyle}</strong>
                    <span>人気スタイル</span>
                </div>
                <div class="staff-stat">
                    <strong>${stylistReviews.filter(r => r['既婚未婚'] === '既婚').length}</strong>
                    <span>既婚者</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => showStaffModal(stylist));
        staffGrid.appendChild(card);
    });
}

// Filter staff
function filterStaff() {
    const searchTerm = document.getElementById('staffSearchInput').value.toLowerCase();
    const selectedSalon = document.getElementById('salonFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    let filtered = stylistsData.filter(stylist => {
        const matchesSearch = stylist['姓名'].toLowerCase().includes(searchTerm) ||
                            stylist['勤務サロン名'].toLowerCase().includes(searchTerm);
        const matchesSalon = !selectedSalon || stylist['勤務サロン名'] === selectedSalon;
        return matchesSearch && matchesSalon;
    });

    // Sort
    if (sortBy === 'name') {
        filtered.sort((a, b) => a['姓名'].localeCompare(b['姓名']));
    } else if (sortBy === 'reviews-desc' || sortBy === 'reviews-asc') {
        filtered.sort((a, b) => {
            const aCount = reviewsData.filter(r => r['選択した画像ファイル'] === a['アップロード画像ファイル名']).length;
            const bCount = reviewsData.filter(r => r['選択した画像ファイル'] === b['アップロード画像ファイル名']).length;
            return sortBy === 'reviews-desc' ? bCount - aCount : aCount - bCount;
        });
    }

    displayStaff(filtered);
}

// Show staff modal
function showStaffModal(stylist) {
    const imageFile = stylist['アップロード画像ファイル名'];
    const stylistReviews = reviewsData.filter(r => r['選択した画像ファイル'] === imageFile);

    // Calculate rank
    const allCounts = stylistsData.map(s => {
        return reviewsData.filter(r => r['選択した画像ファイル'] === s['アップロード画像ファイル名']).length;
    }).sort((a, b) => b - a);
    const rank = allCounts.indexOf(stylistReviews.length) + 1;

    // Get stylist age
    const stylistAge = parseInt(stylist['年齢']) || 0;

    // Calculate age insights
    const ageInsights = calculateAgeInsights(stylist, stylistReviews);

    // Update modal content
    document.getElementById('modalStaffImage').src = `images/${imageFile}`;
    document.getElementById('modalStaffName').textContent = `${stylist['姓名']} (${stylistAge}歳)`;
    document.getElementById('modalStaffSalon').textContent = stylist['勤務サロン名'];
    document.getElementById('modalStaffEmail').textContent = stylist['メールアドレス'];
    document.getElementById('modalReviewCount').textContent = stylistReviews.length;
    document.getElementById('modalRank').textContent = `#${rank}`;

    // Display age insights
    displayAgeInsights(ageInsights);

    // Create age chart
    createModalAgeChart(stylistReviews);

    // Create style chart
    createModalStyleChart(stylistReviews);

    // Display recent reviews
    displayModalReviews(stylistReviews);

    // Show modal
    document.getElementById('staffModal').style.display = 'block';
}

// Calculate age-based insights
function calculateAgeInsights(stylist, reviews) {
    const stylistAge = parseInt(stylist['年齢']) || 0;
    const insights = [];

    if (reviews.length === 0 || stylistAge === 0) {
        return insights;
    }

    // Calculate customer age distribution
    const customerAges = reviews.map(r => parseInt(r['年齢'])).filter(a => !isNaN(a));
    if (customerAges.length === 0) return insights;

    const avgCustomerAge = customerAges.reduce((a, b) => a + b, 0) / customerAges.length;
    const ageDiff = avgCustomerAge - stylistAge;

    // Count customers by age groups relative to stylist
    const sameAge = customerAges.filter(a => Math.abs(a - stylistAge) <= 3).length;
    const younger = customerAges.filter(a => a < stylistAge - 3).length;
    const older = customerAges.filter(a => a > stylistAge + 3).length;

    const sameAgePercent = (sameAge / customerAges.length) * 100;
    const youngerPercent = (younger / customerAges.length) * 100;
    const olderPercent = (older / customerAges.length) * 100;

    // Generate insights
    if (olderPercent >= 50) {
        insights.push(`💡 年齢の割に年上に支持されている (${olderPercent.toFixed(0)}%が年上)`);
    }

    if (sameAgePercent >= 40) {
        insights.push(`👥 同年代に人気 (${sameAgePercent.toFixed(0)}%が同年代)`);
    }

    if (youngerPercent >= 50) {
        insights.push(`⭐ 若い世代に人気 (${youngerPercent.toFixed(0)}%が年下)`);
    }

    if (ageDiff >= 5) {
        insights.push(`📈 平均${ageDiff.toFixed(1)}歳年上の顧客層に支持されている`);
    } else if (ageDiff <= -5) {
        insights.push(`📉 平均${Math.abs(ageDiff).toFixed(1)}歳年下の顧客層に支持されている`);
    } else {
        insights.push(`🎯 幅広い年齢層から支持されている`);
    }

    // Age diversity
    const ageGroups = {
        '20代前半': customerAges.filter(a => a >= 20 && a <= 24).length,
        '20代後半': customerAges.filter(a => a >= 25 && a <= 29).length,
        '30代前半': customerAges.filter(a => a >= 30 && a <= 34).length,
        '30代後半': customerAges.filter(a => a >= 35 && a <= 39).length,
        '40代': customerAges.filter(a => a >= 40 && a <= 49).length
    };

    const nonZeroGroups = Object.values(ageGroups).filter(v => v > 0).length;
    if (nonZeroGroups >= 4) {
        insights.push(`🌟 幅広い年齢層から支持を獲得 (${nonZeroGroups}つの年齢層)`);
    }

    return insights;
}

// Display age insights
function displayAgeInsights(insights) {
    // Find or create insights container
    let insightsContainer = document.getElementById('ageInsightsContainer');

    if (!insightsContainer) {
        // Create container if it doesn't exist
        const modalStats = document.querySelector('.modal-stats');
        insightsContainer = document.createElement('div');
        insightsContainer.id = 'ageInsightsContainer';
        insightsContainer.style.cssText = 'margin: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;';
        modalStats.insertAdjacentElement('afterend', insightsContainer);
    }

    if (insights.length === 0) {
        insightsContainer.style.display = 'none';
        return;
    }

    insightsContainer.style.display = 'block';
    insightsContainer.innerHTML = `
        <h4 style="margin: 0 0 0.75rem 0; color: #333; font-size: 1rem;">年齢層分析インサイト</h4>
        ${insights.map(insight => `<div style="padding: 0.5rem 0; color: #555; font-size: 0.9rem;">${insight}</div>`).join('')}
    `;
}

// Create modal age chart
function createModalAgeChart(reviews) {
    const ageGroups = {};
    reviews.forEach(review => {
        const age = review['年齢'];
        if (!age) return;

        let group;
        if (age >= 20 && age <= 24) group = '20~24歳';
        else if (age >= 25 && age <= 29) group = '25~29歳';
        else if (age >= 30 && age <= 34) group = '30~34歳';
        else if (age >= 35 && age <= 39) group = '35~39歳';
        else if (age >= 40 && age <= 44) group = '40~44歳';
        else return;

        ageGroups[group] = (ageGroups[group] || 0) + 1;
    });

    const ctx = document.getElementById('modalAgeChart');
    if (currentCharts.modalAge) currentCharts.modalAge.destroy();

    currentCharts.modalAge = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                label: '人数',
                data: Object.values(ageGroups),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Create modal style chart
function createModalStyleChart(reviews) {
    const styles = {};
    reviews.forEach(review => {
        const style = review['女性像'];
        if (style) {
            styles[style] = (styles[style] || 0) + 1;
        }
    });

    const ctx = document.getElementById('modalStyleChart');
    if (currentCharts.modalStyle) currentCharts.modalStyle.destroy();

    currentCharts.modalStyle = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(styles),
            datasets: [{
                data: Object.values(styles),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(237, 100, 166, 0.8)',
                    'rgba(255, 154, 158, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Display modal reviews
function displayModalReviews(reviews) {
    const reviewsList = document.getElementById('modalReviewsList');
    reviewsList.innerHTML = '';

    // Get last 5 reviews
    const recentReviews = reviews.slice(-5).reverse();

    if (recentReviews.length === 0) {
        reviewsList.innerHTML = '<p style="color: #666; text-align: center;">まだレビューがありません</p>';
        return;
    }

    recentReviews.forEach(review => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <div class="review-header">
                <span>${review['年齢']}歳 | ${review['性別']} | ${review['職業']}</span>
                <span>${review['女性像']}</span>
            </div>
            <div class="review-comment">${review['コメント'] || 'コメントなし'}</div>
        `;
        reviewsList.appendChild(reviewItem);
    });
}

// Initialize Comparison Tab
function initializeComparisonTab() {
    const selectorsContainer = document.getElementById('staffSelectors');
    selectorsContainer.innerHTML = '';

    // Get all stylists and sort by review count (descending)
    const sortedStylists = [...stylistsData].sort((a, b) => getReviewCount(b) - getReviewCount(a));

    for (let i = 1; i <= 4; i++) {
        const select = document.createElement('select');
        select.id = `comparisonSelect${i}`;
        select.innerHTML = '<option value="">選択してください</option>';

        sortedStylists.forEach(stylist => {
            const option = document.createElement('option');
            option.value = stylist['アップロード画像ファイル名'];
            const reviewCount = getReviewCount(stylist);
            const stylistAge = parseInt(stylist['年齢']) || '';
            const ageText = stylistAge ? ` ${stylistAge}歳` : '';
            option.textContent = `${stylist['姓名']}${ageText} (${reviewCount}件)`;
            select.appendChild(option);
        });

        selectorsContainer.appendChild(select);
    }
}

// Perform comparison
function performComparison() {
    const selectedStylists = [];

    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparisonSelect${i}`);
        const imageFile = select.value;
        if (imageFile) {
            const stylist = stylistsData.find(s => s['アップロード画像ファイル名'] === imageFile);
            if (stylist) {
                selectedStylists.push(stylist);
            }
        }
    }

    if (selectedStylists.length < 2) {
        alert('比較するには最低2人のスタッフを選択してください。');
        return;
    }

    // Show results section
    document.getElementById('comparisonResults').classList.add('active');

    // Create radar chart
    createComparisonRadarChart(selectedStylists);

    // Create comparison details
    createComparisonDetails(selectedStylists);
}

// Create comparison radar chart
function createComparisonRadarChart(stylists) {
    const datasets = stylists.map((stylist, index) => {
        const imageFile = stylist['アップロード画像ファイル名'];
        const reviews = reviewsData.filter(r => r['選択した画像ファイル'] === imageFile);

        const ages = reviews.map(r => parseInt(r['年齢'])).filter(a => !isNaN(a));
        const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

        const married = reviews.filter(r => r['既婚未婚'] === '既婚').length;
        const withChildren = reviews.filter(r => r['子供の有無'] === 'あり').length;

        const styles = {};
        reviews.forEach(r => {
            const style = r['女性像'];
            if (style) styles[style] = (styles[style] || 0) + 1;
        });
        const styleVariety = Object.keys(styles).length;

        const colors = [
            'rgba(102, 126, 234, 1)',
            'rgba(118, 75, 162, 1)',
            'rgba(237, 100, 166, 1)',
            'rgba(255, 154, 158, 1)'
        ];

        return {
            label: stylist['姓名'],
            data: [
                reviews.length,
                avgAge,
                married,
                withChildren,
                styleVariety * 10
            ],
            backgroundColor: 'rgba(0, 0, 0, 0)',  // Transparent fill
            borderColor: colors[index],
            borderWidth: 3,
            pointBackgroundColor: colors[index],
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6
        };
    });

    const ctx = document.getElementById('comparisonRadarChart');
    if (currentCharts.comparisonRadar) currentCharts.comparisonRadar.destroy();

    currentCharts.comparisonRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['レビュー数', '平均年齢', '既婚者数', '子供あり', 'スタイル多様性'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    display: true,
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5
                    }
                }
            }
        }
    });
}

// Create comparison details
function createComparisonDetails(stylists) {
    const detailsContainer = document.getElementById('comparisonDetails');
    detailsContainer.innerHTML = '';

    stylists.forEach(stylist => {
        const imageFile = stylist['アップロード画像ファイル名'];
        const reviews = reviewsData.filter(r => r['選択した画像ファイル'] === imageFile);

        // Get stylist age
        const stylistAge = parseInt(stylist['年齢']) || 'N/A';

        // Calculate average customer age
        const customerAges = reviews.map(r => parseInt(r['年齢'])).filter(a => !isNaN(a));
        const avgCustomerAge = customerAges.length > 0 ? (customerAges.reduce((a, b) => a + b, 0) / customerAges.length).toFixed(1) : 'N/A';

        // Calculate age difference
        let ageDiffText = 'N/A';
        if (stylistAge !== 'N/A' && avgCustomerAge !== 'N/A') {
            const diff = parseFloat(avgCustomerAge) - stylistAge;
            if (diff > 0) {
                ageDiffText = `+${diff.toFixed(1)}歳`;
            } else {
                ageDiffText = `${diff.toFixed(1)}歳`;
            }
        }

        const married = reviews.filter(r => r['既婚未婚'] === '既婚').length;
        const withChildren = reviews.filter(r => r['子供の有無'] === 'あり').length;

        const styles = {};
        reviews.forEach(r => {
            const style = r['女性像'];
            if (style) styles[style] = (styles[style] || 0) + 1;
        });
        const topStyle = Object.keys(styles).sort((a, b) => styles[b] - styles[a])[0] || 'N/A';

        const jobs = {};
        reviews.forEach(r => {
            const job = r['職業'];
            if (job) jobs[job] = (jobs[job] || 0) + 1;
        });
        const topJob = Object.keys(jobs).sort((a, b) => jobs[b] - jobs[a])[0] || 'N/A';

        const card = document.createElement('div');
        card.className = 'comparison-card';
        card.innerHTML = `
            <h4>${stylist['姓名']} (${stylistAge}歳)</h4>
            <div class="comparison-metric">
                <span>レビュー数</span>
                <span>${reviews.length}</span>
            </div>
            <div class="comparison-metric">
                <span>顧客平均年齢</span>
                <span>${avgCustomerAge}歳</span>
            </div>
            <div class="comparison-metric">
                <span>年齢差</span>
                <span>${ageDiffText}</span>
            </div>
            <div class="comparison-metric">
                <span>既婚者</span>
                <span>${married}人</span>
            </div>
            <div class="comparison-metric">
                <span>子供あり</span>
                <span>${withChildren}人</span>
            </div>
            <div class="comparison-metric">
                <span>人気スタイル</span>
                <span>${topStyle}</span>
            </div>
            <div class="comparison-metric">
                <span>主な職業</span>
                <span>${topJob}</span>
            </div>
        `;

        detailsContainer.appendChild(card);
    });
}

// Initialize Demographics Tab
function initializeDemographicsTab() {
    // Populate stylist select
    const select = document.getElementById('demographicsStylistSelect');
    stylistsData.forEach(stylist => {
        const option = document.createElement('option');
        option.value = stylist['アップロード画像ファイル名'];
        option.textContent = stylist['姓名'];
        select.appendChild(option);
    });

    // Show overall demographics initially
    updateDemographicsCharts();
}

// Update demographics charts
function updateDemographicsCharts() {
    const selectedImageFile = document.getElementById('demographicsStylistSelect').value;

    let filteredReviews = reviewsData;
    if (selectedImageFile && selectedImageFile !== 'all') {
        filteredReviews = reviewsData.filter(r => r['選択した画像ファイル'] === selectedImageFile);
    }

    createAgeDistributionChart(filteredReviews);
    createJobDistributionChart(filteredReviews);
    createMaritalStatusChart(filteredReviews);
    createChildrenChart(filteredReviews);
    createJobStyleCrossChart(filteredReviews);
}

// Create age distribution chart
function createAgeDistributionChart(reviews) {
    const ageGroups = {};
    reviews.forEach(review => {
        const age = review['年齢'];
        if (!age) return;

        let group;
        if (age >= 20 && age <= 24) group = '20~24歳';
        else if (age >= 25 && age <= 29) group = '25~29歳';
        else if (age >= 30 && age <= 34) group = '30~34歳';
        else if (age >= 35 && age <= 39) group = '35~39歳';
        else if (age >= 40 && age <= 44) group = '40~44歳';
        else return;

        ageGroups[group] = (ageGroups[group] || 0) + 1;
    });

    const ctx = document.getElementById('ageDistributionChart');
    if (currentCharts.ageDistribution) currentCharts.ageDistribution.destroy();

    currentCharts.ageDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                label: '人数',
                data: Object.values(ageGroups),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Create job distribution chart
function createJobDistributionChart(reviews) {
    const jobs = {};
    reviews.forEach(review => {
        const job = review['職業'];
        if (job) {
            jobs[job] = (jobs[job] || 0) + 1;
        }
    });

    const ctx = document.getElementById('jobDistributionChart');
    if (currentCharts.jobDistribution) currentCharts.jobDistribution.destroy();

    currentCharts.jobDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(jobs),
            datasets: [{
                data: Object.values(jobs),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(237, 100, 166, 0.8)',
                    'rgba(255, 154, 158, 0.8)',
                    'rgba(250, 208, 196, 0.8)',
                    'rgba(163, 228, 215, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Create marital status chart
function createMaritalStatusChart(reviews) {
    const statuses = {};
    reviews.forEach(review => {
        const status = review['既婚未婚'];
        if (status) {
            statuses[status] = (statuses[status] || 0) + 1;
        }
    });

    const ctx = document.getElementById('maritalStatusChart');
    if (currentCharts.maritalStatus) currentCharts.maritalStatus.destroy();

    currentCharts.maritalStatus = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(statuses),
            datasets: [{
                data: Object.values(statuses),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(237, 100, 166, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Create children chart
function createChildrenChart(reviews) {
    const children = {};
    reviews.forEach(review => {
        const hasChildren = review['子供の有無'];
        if (hasChildren) {
            children[hasChildren] = (children[hasChildren] || 0) + 1;
        }
    });

    const ctx = document.getElementById('childrenChart');
    if (currentCharts.children) currentCharts.children.destroy();

    currentCharts.children = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(children),
            datasets: [{
                data: Object.values(children),
                backgroundColor: [
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(255, 154, 158, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Create job-style cross chart
function createJobStyleCrossChart(reviews) {
    const jobStyleData = {};

    reviews.forEach(review => {
        const job = review['職業'];
        const style = review['女性像'];

        if (job && style) {
            if (!jobStyleData[job]) {
                jobStyleData[job] = {};
            }
            jobStyleData[job][style] = (jobStyleData[job][style] || 0) + 1;
        }
    });

    const jobs = Object.keys(jobStyleData).sort((a, b) => {
        const aTotal = Object.values(jobStyleData[a]).reduce((sum, val) => sum + val, 0);
        const bTotal = Object.values(jobStyleData[b]).reduce((sum, val) => sum + val, 0);
        return bTotal - aTotal;
    }).slice(0, 6);

    const styles = ['カジュアル', 'フェミニン', 'エレガント', 'スタイリッシュ'];

    const datasets = styles.map((style, index) => {
        const colors = [
            'rgba(102, 126, 234, 0.8)',
            'rgba(118, 75, 162, 0.8)',
            'rgba(237, 100, 166, 0.8)',
            'rgba(255, 154, 158, 0.8)'
        ];

        return {
            label: style,
            data: jobs.map(job => jobStyleData[job][style] || 0),
            backgroundColor: colors[index]
        };
    });

    const ctx = document.getElementById('jobStyleCrossChart');
    if (currentCharts.jobStyleCross) currentCharts.jobStyleCross.destroy();

    currentCharts.jobStyleCross = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: jobs,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Initialize Highlights Tab
function initializeHighlightsTab() {
    createTopPerformers();
    createPopularWith20s();
    createPopularWith30s();
    createPopularWithWorking();
    createPopularWithMoms();
    createPopularByStyle();
}

// Create top performers
function createTopPerformers() {
    const stylistReviewCounts = stylistsData.map(stylist => {
        const imageFile = stylist['アップロード画像ファイル名'];
        const reviewCount = reviewsData.filter(r => r['選択した画像ファイル'] === imageFile).length;
        return {
            stylist: stylist,
            count: reviewCount
        };
    });

    stylistReviewCounts.sort((a, b) => b.count - a.count);
    const top5 = stylistReviewCounts.slice(0, 5);

    const container = document.getElementById('topPerformers');
    container.innerHTML = '';

    top5.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'highlight-item';
        div.innerHTML = `
            <div class="highlight-rank">${index + 1}</div>
            <img src="images/${item.stylist['アップロード画像ファイル名']}" class="highlight-avatar">
            <div class="highlight-info">
                <strong>${item.stylist['姓名']}</strong>
                <small>${item.stylist['勤務サロン名']}</small>
            </div>
            <div class="highlight-value">${item.count}</div>
        `;
        container.appendChild(div);
    });
}

// Create popular with 20s
function createPopularWith20s() {
    const stylistCounts = stylistsData.map(stylist => {
        const imageFile = stylist['アップロード画像ファイル名'];
        const count = reviewsData.filter(r => {
            return r['選択した画像ファイル'] === imageFile &&
                   r['年齢'] >= 20 && r['年齢'] <= 29;
        }).length;
        return { stylist, count };
    });

    stylistCounts.sort((a, b) => b.count - a.count);
    const top3 = stylistCounts.slice(0, 3);

    displayHighlightList('popularWith20s', top3);
}

// Create popular with 30s
function createPopularWith30s() {
    const stylistCounts = stylistsData.map(stylist => {
        const imageFile = stylist['アップロード画像ファイル名'];
        const count = reviewsData.filter(r => {
            return r['選択した画像ファイル'] === imageFile &&
                   r['年齢'] >= 30 && r['年齢'] <= 39;
        }).length;
        return { stylist, count };
    });

    stylistCounts.sort((a, b) => b.count - a.count);
    const top3 = stylistCounts.slice(0, 3);

    displayHighlightList('popularWith30s', top3);
}

// Create popular with working women
function createPopularWithWorking() {
    const stylistCounts = stylistsData.map(stylist => {
        const imageFile = stylist['アップロード画像ファイル名'];
        const count = reviewsData.filter(r => {
            return r['選択した画像ファイル'] === imageFile &&
                   (r['職業'] === '会社員' || r['職業'] === '自営業');
        }).length;
        return { stylist, count };
    });

    stylistCounts.sort((a, b) => b.count - a.count);
    const top3 = stylistCounts.slice(0, 3);

    displayHighlightList('popularWithWorking', top3);
}

// Create popular with moms
function createPopularWithMoms() {
    const stylistCounts = stylistsData.map(stylist => {
        const imageFile = stylist['アップロード画像ファイル名'];
        const count = reviewsData.filter(r => {
            return r['選択した画像ファイル'] === imageFile &&
                   r['子供の有無'] === 'あり';
        }).length;
        return { stylist, count };
    });

    stylistCounts.sort((a, b) => b.count - a.count);
    const top3 = stylistCounts.slice(0, 3);

    displayHighlightList('popularWithMoms', top3);
}

// Create popular by style
function createPopularByStyle() {
    const styles = ['カジュアル', 'フェミニン', 'エレガント', 'スタイリッシュ'];
    const styleIds = {
        'カジュアル': 'popularCasual',
        'フェミニン': 'popularFeminine',
        'エレガント': 'popularElegant',
        'スタイリッシュ': 'popularStylish'
    };

    styles.forEach(style => {
        const stylistCounts = stylistsData.map(stylist => {
            const imageFile = stylist['アップロード画像ファイル名'];
            const count = reviewsData.filter(r => {
                return r['選択した画像ファイル'] === imageFile &&
                       r['女性像'] === style;
            }).length;
            return { stylist, count };
        });

        stylistCounts.sort((a, b) => b.count - a.count);
        const top3 = stylistCounts.slice(0, 3);

        displayHighlightList(styleIds[style], top3);
    });
}

// Display highlight list
function displayHighlightList(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    items.forEach((item, index) => {
        if (item.count === 0) return;

        const div = document.createElement('div');
        div.className = 'highlight-item';
        div.innerHTML = `
            <div class="highlight-rank">${index + 1}</div>
            <img src="images/${item.stylist['アップロード画像ファイル名']}" class="highlight-avatar">
            <div class="highlight-info">
                <strong>${item.stylist['姓名']}</strong>
                <small>${item.stylist['勤務サロン名']}</small>
            </div>
            <div class="highlight-value">${item.count}</div>
        `;
        container.appendChild(div);
    });

    if (container.children.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 0.5rem; font-size: 0.85rem;">データなし</p>';
    }
}

// Handle password change
function handlePasswordChange() {
    // Step 1: Verify "secret phrase" (takara1234)
    const secretPhrase = prompt('パスワードを変更するには「合言葉」を入力してください:');

    if (secretPhrase === null) {
        return; // User cancelled
    }

    if (secretPhrase !== 'takara1234') {
        alert('合言葉が正しくありません。パスワード変更できませんでした。');
        return;
    }

    // Step 2: Enter new password
    const newPassword = prompt('新しいパスワードを入力してください:');

    if (newPassword === null || newPassword.trim() === '') {
        alert('パスワード変更がキャンセルされました。');
        return;
    }

    // Step 3: Confirm new password
    const confirmPassword = prompt('新しいパスワードをもう一度入力してください:');

    if (confirmPassword === null) {
        alert('パスワード変更がキャンセルされました。');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('パスワードが一致しません。もう一度お試しください。');
        return;
    }

    // Step 4: Save new password to localStorage
    localStorage.setItem('ownerPassword', newPassword);
    alert('パスワードが正常に変更されました。\n新しいパスワード: ' + newPassword);

    // Update display (still show masked)
    document.getElementById('currentPasswordDisplay').textContent = '••••••••';
}
