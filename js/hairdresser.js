// Hairdresser Dashboard JavaScript - Colorful Design

let currentUser = null;
let myReviews = [];
let charts = {};

// Colorful color schemes
const colors = {
    womanType: ['#FFB6C1', '#FFC0CB', '#C8A2C8', '#9370DB'],  // Pink, Light Pink, Lilac, Purple
    age: ['#FF9A76', '#FF7979', '#C56CF0', '#6C5CE7', '#A29BFE'],  // Oranges and Purples
    marital: ['#FF6B9D', '#C44569', '#A8E6CF'],  // Pinks and Green
    children: ['#4ECDC4', '#FF6B6B', '#95AAB4']  // Teal, Red, Gray
};

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
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');

            // Show corresponding content
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

    // Load and display profile image
    loadProfileImage();

    // Load reviews for this hairdresser's image
    const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    myReviews = surveys.filter(s => s.imageFile === currentUser.imageFile);

    document.getElementById('review-count').textContent = myReviews.length;

    // Analyze and display data
    if (myReviews.length > 0) {
        analyzeAndDisplay();
    } else {
        document.querySelector('.main-content').innerHTML += `
            <div style="text-align: center; padding: 60px 20px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                <p>まだレビューがありません</p>
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
        imgElement.src = `images/${currentUser.imageFile}`;
        imgElement.onerror = function() {
            this.src = 'https://via.placeholder.com/80/667eea/ffffff?text=' + encodeURIComponent(currentUser.name.charAt(0));
        };
    }
}

function analyzeAndDisplay() {
    // Analyze woman types
    const typeCounts = {};
    myReviews.forEach(review => {
        const type = review.womanType || '未回答';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    if (topType) {
        document.getElementById('top-type').textContent = topType[0];
    }

    // Create all charts
    createWomanTypeChart();
    createAgeChart();
    createMaritalChart();
    createChildrenChart();
    displayReviews();
}

function createWomanTypeChart() {
    const types = {};
    myReviews.forEach(review => {
        const type = review.womanType || '未回答';
        types[type] = (types[type] || 0) + 1;
    });

    const ctx = document.getElementById('woman-type-chart');
    charts.womanType = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(types),
            datasets: [{
                data: Object.values(types),
                backgroundColor: colors.womanType
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Create custom legend
    createLegend('woman-type-legend', Object.keys(types), colors.womanType);
}

function createAgeChart() {
    const ageGroups = {
        '20〜24歳': 0,
        '25〜29歳': 0,
        '30〜34歳': 0,
        '35〜39歳': 0,
        '40〜44歳': 0
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
        type: 'pie',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                data: Object.values(ageGroups),
                backgroundColor: colors.age
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            }
        }
    });

    createLegend('age-legend', Object.keys(ageGroups), colors.age);
}

function createMaritalChart() {
    const marital = {};
    myReviews.forEach(review => {
        const status = review.maritalStatus || '未回答';
        marital[status] = (marital[status] || 0) + 1;
    });

    const ctx = document.getElementById('marital-chart');
    charts.marital = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(marital),
            datasets: [{
                data: Object.values(marital),
                backgroundColor: colors.marital
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            }
        }
    });

    createLegend('marital-legend', Object.keys(marital), colors.marital);
}

function createChildrenChart() {
    const children = {};
    myReviews.forEach(review => {
        const has = review.hasChildren || '未回答';
        children[has] = (children[has] || 0) + 1;
    });

    const ctx = document.getElementById('children-chart');
    charts.children = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(children),
            datasets: [{
                data: Object.values(children),
                backgroundColor: colors.children
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            }
        }
    });

    createLegend('children-legend', Object.keys(children), colors.children);
}

function createLegend(elementId, labels, colors) {
    const legendEl = document.getElementById(elementId);
    legendEl.innerHTML = labels.map((label, i) => `
        <div class="legend-item">
            <div class="legend-color" style="background: ${colors[i]}"></div>
            <span>${label}</span>
        </div>
    `).join('');
}

function displayReviews() {
    const reviewsList = document.getElementById('reviews-list');

    if (myReviews.length === 0) {
        reviewsList.innerHTML = '<p style="text-align: center; color: #999;">まだレビューがありません</p>';
        return;
    }

    reviewsList.innerHTML = myReviews.slice(0, 10).map(review => `
        <div class="review-card">
            <div class="review-meta">
                ${review.age}歳 ${review.gender || ''} ${review.occupation || ''}
            </div>
            <div class="review-text">${review.comment || 'コメントなし'}</div>
        </div>
    `).join('');
}
