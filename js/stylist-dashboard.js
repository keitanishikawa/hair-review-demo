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
            renderChart(labels, Object.values(data), colors);
            break;
        case 'age':
            data = analyzeAgeGroups(reviews);
            labels = Object.keys(data);
            colors = ['#ff9a8c', '#ffc0a6', '#c494c4', '#9b7bb5', '#6a5f96'];
            renderChart(labels, Object.values(data), colors);
            break;
        case 'occupation':
            data = analyzeMaritalStatus(reviews);
            labels = Object.keys(data);
            colors = ['#f4a5a5', '#c494c4'];
            renderChart(labels, Object.values(data), colors);
            break;
        case 'children':
            data = analyzeChildren(reviews);
            labels = Object.keys(data);
            colors = ['#f5c7d4', '#b87ba7'];
            renderChart(labels, Object.values(data), colors);
            break;
        case 'job':
            data = analyzeJobs(reviews);
            labels = Object.keys(data);
            colors = ['#ff9a8c', '#ffc0a6', '#c494c4', '#9b7bb5', '#6a5f96', '#8b7ba7'];
            renderChart(labels, Object.values(data), colors);
            break;
        case 'job-style':
            renderJobStyleChart(reviews);
            break;
        case 'comparison':
            renderComparisonChart();
            break;
    }
}

// Analyze style preferences from CSV data
function analyzeStylePreferences(reviews) {
    const styles = {
        'カジュアル': 0,
        'フェミニン': 0,
        'エレガント': 0,
        'スタイリッシュ': 0
    };

    reviews.forEach(review => {
        const style = review.女性像;
        if (styles.hasOwnProperty(style)) {
            styles[style]++;
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

// Analyze marital status from CSV data
function analyzeMaritalStatus(reviews) {
    const maritalStatus = {
        '既婚': 0,
        '未婚': 0
    };

    reviews.forEach(review => {
        const status = review.既婚未婚;
        if (status === '既婚') {
            maritalStatus['既婚']++;
        } else if (status === '未婚') {
            maritalStatus['未婚']++;
        }
    });

    return maritalStatus;
}

// Analyze children from CSV data
function analyzeChildren(reviews) {
    const children = {
        'あり': 0,
        'なし': 0
    };

    reviews.forEach(review => {
        const hasChildren = review.子供の有無;
        if (hasChildren === 'あり') {
            children['あり']++;
        } else if (hasChildren === 'なし') {
            children['なし']++;
        }
    });

    return children;
}

// Analyze jobs from CSV data
function analyzeJobs(reviews) {
    const jobs = {};

    reviews.forEach(review => {
        const job = review.職業;
        if (job && job !== '職業') {
            jobs[job] = (jobs[job] || 0) + 1;
        }
    });

    // Sort by count
    const sortedJobs = Object.fromEntries(
        Object.entries(jobs).sort(([,a], [,b]) => b - a)
    );

    return sortedJobs;
}

// Render job-style cross analysis chart
function renderJobStyleChart(reviews) {
    const ctx = document.getElementById('demographicChart');

    // Prepare data for job x style
    const jobs = ['会社員', 'パート', '主婦', '自営業', '学生', 'アルバイト'];
    const styles = ['カジュアル', 'フェミニン', 'エレガント', 'スタイリッシュ'];

    const datasets = styles.map((style, index) => {
        const colors = ['#f4a5a5', '#f5c7d4', '#b87ba7', '#8b5a9e'];
        const data = jobs.map(job => {
            return reviews.filter(r => r.職業 === job && r.女性像 === style).length;
        });

        return {
            label: style,
            data: data,
            backgroundColor: colors[index],
            borderColor: colors[index],
            borderWidth: 1
        };
    });

    // Destroy existing chart
    if (currentChart) {
        currentChart.destroy();
    }

    // Create stacked bar chart
    currentChart = new Chart(ctx, {
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
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${value}人`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 12
                        },
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Render comparison chart with other stylists
function renderComparisonChart() {
    const ctx = document.getElementById('demographicChart');

    // Get all stylists' statistics
    const stylistStats = stylistsData.map(stylist => {
        const reviews = reviewsData.filter(r => r.選択した画像ファイル === stylist.アップロード画像ファイル名);
        return {
            name: stylist.姓名,
            reviewCount: reviews.length,
            styles: analyzeStylePreferences(reviews),
            avgAge: reviews.length > 0 ? reviews.reduce((sum, r) => sum + parseInt(r.年齢 || 0), 0) / reviews.length : 0
        };
    });

    // Calculate average stats
    const avgReviewCount = stylistStats.reduce((sum, s) => sum + s.reviewCount, 0) / stylistStats.length;

    // Get current stylist stats
    const currentReviews = getStylistReviews();
    const currentStats = {
        reviewCount: currentReviews.length,
        styles: analyzeStylePreferences(currentReviews),
        avgAge: currentReviews.length > 0 ? currentReviews.reduce((sum, r) => sum + parseInt(r.年齢 || 0), 0) / currentReviews.length : 0
    };

    // Prepare radar chart data
    const labels = ['レビュー数', 'カジュアル', 'フェミニン', 'エレガント', 'スタイリッシュ'];

    // Normalize data for radar chart (0-10 scale)
    const currentData = [
        (currentStats.reviewCount / avgReviewCount) * 5, // Normalized review count
        currentStats.styles['カジュアル'] || 0,
        currentStats.styles['フェミニン'] || 0,
        currentStats.styles['エレガント'] || 0,
        currentStats.styles['スタイリッシュ'] || 0
    ];

    // Calculate salon average
    const salonAvgData = labels.map((label, index) => {
        if (index === 0) return 5; // Average baseline
        const styleName = label;
        const total = stylistStats.reduce((sum, s) => sum + (s.styles[styleName] || 0), 0);
        return total / stylistStats.length;
    });

    // Destroy existing chart
    if (currentChart) {
        currentChart.destroy();
    }

    // Create radar chart
    currentChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'あなた',
                    data: currentData,
                    backgroundColor: 'rgba(244, 165, 165, 0.2)',
                    borderColor: '#f4a5a5',
                    borderWidth: 2,
                    pointBackgroundColor: '#f4a5a5',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#f4a5a5'
                },
                {
                    label: 'サロン平均',
                    data: salonAvgData,
                    backgroundColor: 'rgba(155, 123, 181, 0.2)',
                    borderColor: '#9b7bb5',
                    borderWidth: 2,
                    pointBackgroundColor: '#9b7bb5',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#9b7bb5'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.r || 0;
                            return `${label}: ${value.toFixed(1)}`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    pointLabels: {
                        font: {
                            size: 13
                        }
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        stepSize: 2
                    }
                }
            }
        }
    });
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
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 14
                    },
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
