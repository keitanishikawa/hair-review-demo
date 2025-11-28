// Global variables
let stylistsData = [];
let reviewsData = [];
let currentStylist = null;
let currentChart = null;
let currentCategory = 'style';

// Initialize
async function init() {
    checkAuth();
    await loadData();
    setupEventListeners();
    updateDashboard();
}

// Check authentication
function checkAuth() {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        window.location.href = 'index.html';
        return;
    }
}

// Load CSV data
async function loadData() {
    try {
        // Load stylists data
        const stylistsResponse = await fetch('data/stylists.csv');
        const stylistsCsv = await stylistsResponse.text();
        stylistsData = Papa.parse(stylistsCsv, {
            header: true,
            skipEmptyLines: true
        }).data;

        // Load reviews data
        const reviewsResponse = await fetch('data/reviews.csv');
        const reviewsCsv = await reviewsResponse.text();
        reviewsData = Papa.parse(reviewsCsv, {
            header: true,
            skipEmptyLines: true
        }).data;

        // Find current stylist
        const userEmail = localStorage.getItem('userEmail');
        currentStylist = stylistsData.find(s => s.メールアドレス === userEmail);

        if (!currentStylist) {
            alert('美容師データが見つかりません');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error loading data:', error);
        alert('データの読み込みに失敗しました');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            updateChart();
        });
    });

    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            handleNavigation(page);
        });
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Handle navigation
function handleNavigation(page) {
    // Update active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');

    // Handle different pages
    if (page === 'mypage') {
        showMyPage();
    } else if (page === 'evaluation') {
        document.querySelector('.tabs-section').style.display = 'block';
        document.querySelector('.reviews-section').style.display = 'none';
    } else if (page === 'reviews') {
        document.querySelector('.tabs-section').style.display = 'none';
        document.querySelector('.reviews-section').style.display = 'block';
    } else if (page === 'popular') {
        alert('人気作品機能は準備中です');
    }
}

// Show my page modal
function showMyPage() {
    const modal = document.getElementById('mypageModal');
    document.getElementById('mypageName').textContent = currentStylist.姓名;
    document.getElementById('mypageEmail').textContent = currentStylist.メールアドレス;

    // Set profile images
    const imageUrl = `images/${currentStylist.アップロード画像ファイル名}`;
    document.getElementById('mypageProfileImage').src = imageUrl;

    modal.classList.add('show');
}

// Logout
function logout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginTime');
    window.location.href = 'index.html';
}

// Update dashboard
function updateDashboard() {
    if (!currentStylist) return;

    // Update header
    document.getElementById('stylistName').textContent = currentStylist.姓名;
    const imageUrl = `images/${currentStylist.アップロード画像ファイル名}`;
    document.getElementById('profileImage').src = imageUrl;

    // Update chart
    updateChart();

    // Update reviews
    updateReviews();
}

// Get stylist reviews
function getStylistReviews() {
    const imageFile = currentStylist.アップロード画像ファイル名;
    return reviewsData.filter(review => review.選択した画像ファイル === imageFile);
}

// Update chart based on category
function updateChart() {
    const reviews = getStylistReviews();

    let data, labels, colors;

    switch (currentCategory) {
        case 'style':
            data = analyzeStylePreferences(reviews);
            labels = ['カジュアル', 'フェミニン', 'エレガント', 'スタイリッシュ'];
            colors = ['#f4a5a5', '#f5c7d4', '#b87ba7', '#8b5a9e'];
            break;
        case 'age':
            data = analyzeAgeGroups(reviews);
            labels = Object.keys(data);
            colors = ['#ff9a8c', '#ffc0a6', '#c494c4', '#9b7bb5', '#6a5f96'];
            break;
        case 'occupation':
            data = analyzeMaritalStatus(reviews);
            labels = Object.keys(data);
            colors = ['#f4a5a5', '#c494c4', '#8b5a9e'];
            break;
        case 'children':
            data = analyzeChildren(reviews);
            labels = Object.keys(data);
            colors = ['#f5c7d4', '#b87ba7'];
            break;
    }

    renderChart(labels, Object.values(data), colors);
}

// Analyze style preferences (mock data based on comments)
function analyzeStylePreferences(reviews) {
    const styles = {
        'カジュアル': 0,
        'フェミニン': 0,
        'エレガント': 0,
        'スタイリッシュ': 0
    };

    reviews.forEach(review => {
        const comment = review.コメント.toLowerCase();
        if (comment.includes('カジュアル') || comment.includes('ナチュラル') || comment.includes('普段使い')) {
            styles['カジュアル']++;
        } else if (comment.includes('フェミニン') || comment.includes('女性らしい') || comment.includes('可愛い') || comment.includes('柔らか')) {
            styles['フェミニン']++;
        } else if (comment.includes('エレガント') || comment.includes('上品') || comment.includes('洗練')) {
            styles['エレガント']++;
        } else if (comment.includes('スタイリッシュ') || comment.includes('クール') || comment.includes('活動的')) {
            styles['スタイリッシュ']++;
        } else {
            // Default distribution
            const random = Math.random();
            if (random < 0.35) styles['カジュアル']++;
            else if (random < 0.6) styles['フェミニン']++;
            else if (random < 0.8) styles['エレガント']++;
            else styles['スタイリッシュ']++;
        }
    });

    return styles;
}

// Analyze age groups
function analyzeAgeGroups(reviews) {
    const ageGroups = {
        '20~24歳': 0,
        '25~29歳': 0,
        '30~34歳': 0,
        '35~39歳': 0,
        '40~44歳': 0
    };

    reviews.forEach(review => {
        const age = parseInt(review.年齢);
        if (age >= 20 && age <= 24) ageGroups['20~24歳']++;
        else if (age >= 25 && age <= 29) ageGroups['25~29歳']++;
        else if (age >= 30 && age <= 34) ageGroups['30~34歳']++;
        else if (age >= 35 && age <= 39) ageGroups['35~39歳']++;
        else if (age >= 40 && age <= 44) ageGroups['40~44歳']++;
    });

    return ageGroups;
}

// Analyze marital status (mock data)
function analyzeMaritalStatus(reviews) {
    const maritalStatus = {
        '既婚': 0,
        '未婚': 0,
        '不明': 0
    };

    reviews.forEach(review => {
        const occupation = review.職業;
        if (occupation === '主婦') {
            maritalStatus['既婚']++;
        } else if (occupation === '学生') {
            maritalStatus['未婚']++;
        } else {
            // Random distribution for others
            const random = Math.random();
            if (random < 0.4) maritalStatus['既婚']++;
            else if (random < 0.7) maritalStatus['未婚']++;
            else maritalStatus['不明']++;
        }
    });

    return maritalStatus;
}

// Analyze children (mock data)
function analyzeChildren(reviews) {
    const children = {
        'あり': 0,
        'なし': 0
    };

    reviews.forEach(review => {
        const occupation = review.職業;
        const age = parseInt(review.年齢);

        if (occupation === '主婦' || age >= 35) {
            children['あり']++;
        } else {
            children['なし']++;
        }
    });

    return children;
}

// Render chart
function renderChart(labels, data, colors) {
    const ctx = document.getElementById('demographicChart');

    // Destroy existing chart
    if (currentChart) {
        currentChart.destroy();
    }

    // Create new chart
    currentChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value}人 (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update reviews list
function updateReviews() {
    const reviews = getStylistReviews();
    const reviewsList = document.getElementById('reviewsList');

    if (reviews.length === 0) {
        reviewsList.innerHTML = '<p class="no-reviews">まだレビューがありません</p>';
        return;
    }

    reviewsList.innerHTML = reviews.map((review, index) => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-meta">
                    <span>${review.年齢}歳</span>
                    <span>${review.性別}</span>
                </div>
            </div>
            <div class="review-comment">${review.コメント}</div>
        </div>
    `).join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
