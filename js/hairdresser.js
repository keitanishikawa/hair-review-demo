// Hairdresser Dashboard JavaScript

let currentUser = null;
let myReviews = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
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

function loadDashboardData() {
    // Display user info
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('salon-name').textContent = currentUser.salon;
    document.getElementById('target-age').textContent = currentUser.targetAge || '-';

    // Load reviews for this hairdresser's image
    const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    myReviews = surveys.filter(s => s.imageFile === currentUser.imageFile);

    document.getElementById('review-count').textContent = myReviews.length;

    // Load and display image
    loadImage();

    // Analyze and display data
    if (myReviews.length > 0) {
        analyzeWomanTypes();
        createAgeChart();
        createOccupationChart();
        createWomanTypeChart();
        createMaritalChart();
        createChildrenChart();
        displayReviews();
    }
}

function loadImage() {
    const images = JSON.parse(localStorage.getItem('images') || '{}');
    const imageData = images[currentUser.imageFile];

    const imgElement = document.getElementById('design-image');
    if (imageData) {
        imgElement.src = imageData;
    } else {
        imgElement.src = `images/${currentUser.imageFile}`;
        imgElement.onerror = function() {
            this.src = 'https://via.placeholder.com/800x600/706fd3/ffffff?text=ヘアデザイン';
        };
    }
}

function analyzeWomanTypes() {
    const typeCounts = {};
    myReviews.forEach(review => {
        const type = review.womanType || '未回答';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    if (topType) {
        document.getElementById('top-woman-type').textContent = topType[0];
    }
}

function createAgeChart() {
    const ageGroups = {
        '20代': 0,
        '30代': 0,
        '40代': 0,
        '50代以上': 0
    };

    myReviews.forEach(review => {
        const age = parseInt(review.age);
        if (age >= 20 && age < 30) ageGroups['20代']++;
        else if (age >= 30 && age < 40) ageGroups['30代']++;
        else if (age >= 40 && age < 50) ageGroups['40代']++;
        else if (age >= 50) ageGroups['50代以上']++;
    });

    const ctx = document.getElementById('age-chart');
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
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function createOccupationChart() {
    const occupations = {};
    myReviews.forEach(review => {
        const occ = review.occupation || '未回答';
        occupations[occ] = (occupations[occ] || 0) + 1;
    });

    const ctx = document.getElementById('occupation-chart');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(occupations),
            datasets: [{
                data: Object.values(occupations),
                backgroundColor: ['#706fd3', '#ff6348', '#2ed573', '#ffa502', '#5f27cd', '#00d2d3']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function createWomanTypeChart() {
    const types = {};
    myReviews.forEach(review => {
        const type = review.womanType || '未回答';
        types[type] = (types[type] || 0) + 1;
    });

    const ctx = document.getElementById('woman-type-chart');
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

function createMaritalChart() {
    const marital = {};
    myReviews.forEach(review => {
        const status = review.maritalStatus || '未回答';
        marital[status] = (marital[status] || 0) + 1;
    });

    const ctx = document.getElementById('marital-chart');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(marital),
            datasets: [{
                data: Object.values(marital),
                backgroundColor: ['#706fd3', '#ff6348', '#95afc0']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function createChildrenChart() {
    const children = {};
    myReviews.forEach(review => {
        const has = review.hasChildren || '未回答';
        children[has] = (children[has] || 0) + 1;
    });

    const ctx = document.getElementById('children-chart');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(children),
            datasets: [{
                data: Object.values(children),
                backgroundColor: ['#2ed573', '#ff6348', '#95afc0']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function displayReviews() {
    const reviewsList = document.getElementById('reviews-list');

    if (myReviews.length === 0) {
        reviewsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">まだレビューがありません</p>';
        return;
    }

    reviewsList.innerHTML = myReviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div>
                    <span style="font-weight: 600;">${review.occupation || '未回答'}</span>
                    <span style="color: var(--text-secondary); margin-left: 8px;">${review.age}歳</span>
                    <span style="color: var(--text-secondary); margin-left: 8px;">・</span>
                    <span style="color: var(--secondary-color); margin-left: 8px;">${review.womanType || '未回答'}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">
                    ${review.maritalStatus || '未回答'} / ${review.hasChildren || '未回答'}
                </div>
            </div>
            <p class="review-text">${review.comment || 'コメントなし'}</p>
        </div>
    `).join('');
}
