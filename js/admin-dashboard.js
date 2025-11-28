// Hair designs data
const hairDesigns = [
    { id: 1, title: 'エレガントボブ', image: 'images/hair_design_001.jpg', category: 'short', rating: 4.8, reviews: [], views: 24 },
    { id: 2, title: 'ナチュラルロング', image: 'images/hair_design_002.jpg', category: 'long', rating: 4.5, reviews: [], views: 18 },
    { id: 3, title: 'レイヤードミディアム', image: 'images/hair_design_003.jpg', category: 'medium', rating: 4.7, reviews: [], views: 21 },
    { id: 4, title: 'カジュアルショート', image: 'images/hair_design_004.jpg', category: 'short', rating: 4.3, reviews: [], views: 15 },
    { id: 5, title: 'ウェーブロング', image: 'images/hair_design_005.jpg', category: 'long', rating: 4.9, reviews: [], views: 32 },
    { id: 6, title: 'モダンボブ', image: 'images/hair_design_006.jpg', category: 'short', rating: 4.6, reviews: [], views: 19 },
    { id: 7, title: 'フェミニンミディアム', image: 'images/hair_design_007.jpg', category: 'medium', rating: 4.4, reviews: [], views: 16 },
    { id: 8, title: 'グラマラスロング', image: 'images/hair_design_008.jpg', category: 'long', rating: 4.8, reviews: [], views: 28 },
    { id: 9, title: 'スタイリッシュショート', image: 'images/hair_design_009.jpg', category: 'short', rating: 4.5, reviews: [], views: 20 },
    { id: 10, title: 'エレガントミディアム', image: 'images/hair_design_010.jpg', category: 'medium', rating: 4.7, reviews: [], views: 23 }
];

// Current state
let currentFilter = 'all';
let currentDesignId = null;
let selectedRating = 0;

// DOM elements
const userEmailEl = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const galleryGrid = document.getElementById('galleryGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('designModal');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalStars = document.getElementById('modalStars');
const modalRatingValue = document.getElementById('modalRatingValue');
const reviewsContainer = document.getElementById('reviewsContainer');
const starInputs = document.querySelectorAll('.star-input');
const reviewComment = document.getElementById('reviewComment');
const submitReview = document.getElementById('submitReview');

// Initialize
function init() {
    checkAuth();
    loadUserData();
    loadDesignsFromStorage();
    renderGallery();
    updateStats();
    attachEventListeners();
}

// Check authentication
function checkAuth() {
    const userEmail = localStorage.getItem('userEmail');
    const loginTime = localStorage.getItem('loginTime');

    if (!userEmail || !loginTime) {
        window.location.href = 'index.html';
        return;
    }

    const loginDate = new Date(loginTime);
    const now = new Date();
    const hoursSinceLogin = (now - loginDate) / (1000 * 60 * 60);

    // Auto-logout after 24 hours
    if (hoursSinceLogin >= 24) {
        logout();
    }
}

// Load user data
function loadUserData() {
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        userEmailEl.textContent = userEmail;
    }
}

// Load designs from localStorage
function loadDesignsFromStorage() {
    const stored = localStorage.getItem('hairDesigns');
    if (stored) {
        const storedDesigns = JSON.parse(stored);
        // Merge stored data with default data
        storedDesigns.forEach(storedDesign => {
            const design = hairDesigns.find(d => d.id === storedDesign.id);
            if (design) {
                design.reviews = storedDesign.reviews || [];
                design.rating = calculateAverageRating(design.reviews);
            }
        });
    }
}

// Save designs to localStorage
function saveDesignsToStorage() {
    localStorage.setItem('hairDesigns', JSON.stringify(hairDesigns));
}

// Calculate average rating
function calculateAverageRating(reviews) {
    if (reviews.length === 0) return 4.5; // Default rating
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
}

// Attach event listeners
function attachEventListeners() {
    // Logout button
    logoutBtn.addEventListener('click', logout);

    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderGallery();
        });
    });

    // Modal close
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Star rating input
    starInputs.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            updateStarInput();
        });
    });

    // Submit review
    submitReview.addEventListener('click', handleSubmitReview);
}

// Logout
function logout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginTime');
    window.location.href = 'index.html';
}

// Render gallery
function renderGallery() {
    const filteredDesigns = currentFilter === 'all'
        ? hairDesigns
        : hairDesigns.filter(d => d.category === currentFilter);

    galleryGrid.innerHTML = filteredDesigns.map(design => `
        <div class="gallery-item" data-id="${design.id}">
            <img src="${design.image}" alt="${design.title}" class="gallery-image">
            <div class="gallery-info">
                <h3 class="gallery-title">${design.title}</h3>
                <div class="gallery-meta">
                    <div class="gallery-rating">
                        <span class="stars">${renderStars(design.rating)}</span>
                        <span>${design.rating}</span>
                    </div>
                    <div class="gallery-views">
                        <span>👁️</span>
                        <span>${design.views}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Attach click handlers to gallery items
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const designId = parseInt(item.dataset.id);
            openModal(designId);
        });
    });
}

// Render stars
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '☆';
    const emptyStars = 5 - Math.ceil(rating);
    stars += '☆'.repeat(emptyStars);
    return stars;
}

// Open modal
function openModal(designId) {
    currentDesignId = designId;
    const design = hairDesigns.find(d => d.id === designId);

    if (!design) return;

    // Increment views
    design.views++;
    saveDesignsToStorage();
    updateStats();

    // Update modal content
    modalImage.src = design.image;
    modalTitle.textContent = design.title;
    modalStars.textContent = renderStars(design.rating);
    modalRatingValue.textContent = `${design.rating} (${design.reviews.length}件のレビュー)`;

    // Reset review form
    selectedRating = 0;
    reviewComment.value = '';
    updateStarInput();

    // Render reviews
    renderReviews(design.reviews);

    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    currentDesignId = null;
}

// Update star input
function updateStarInput() {
    starInputs.forEach(star => {
        const rating = parseInt(star.dataset.rating);
        if (rating <= selectedRating) {
            star.textContent = '★';
            star.classList.add('active');
        } else {
            star.textContent = '☆';
            star.classList.remove('active');
        }
    });
}

// Handle submit review
function handleSubmitReview() {
    if (selectedRating === 0) {
        alert('評価を選択してください。');
        return;
    }

    const comment = reviewComment.value.trim();
    if (!comment) {
        alert('コメントを入力してください。');
        return;
    }

    const design = hairDesigns.find(d => d.id === currentDesignId);
    if (!design) return;

    const userEmail = localStorage.getItem('userEmail');
    const review = {
        id: Date.now(),
        author: userEmail,
        rating: selectedRating,
        comment: comment,
        date: new Date().toISOString()
    };

    design.reviews.push(review);
    design.rating = calculateAverageRating(design.reviews);

    // Save to localStorage
    saveDesignsToStorage();

    // Update display
    renderReviews(design.reviews);
    modalRatingValue.textContent = `${design.rating} (${design.reviews.length}件のレビュー)`;
    modalStars.textContent = renderStars(design.rating);

    // Reset form
    selectedRating = 0;
    reviewComment.value = '';
    updateStarInput();

    // Update gallery and stats
    renderGallery();
    updateStats();

    alert('レビューを投稿しました！');
}

// Render reviews
function renderReviews(reviews) {
    if (reviews.length === 0) {
        reviewsContainer.innerHTML = '<p class="no-reviews">まだレビューがありません。最初のレビューを投稿しましょう！</p>';
        return;
    }

    reviewsContainer.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div>
                    <div class="review-author">${maskEmail(review.author)}</div>
                    <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                </div>
                <div class="review-date">${formatDate(review.date)}</div>
            </div>
            <div class="review-comment">${review.comment}</div>
        </div>
    `).join('');
}

// Mask email for privacy
function maskEmail(email) {
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;
    const masked = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
    return `${masked}@${domain}`;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP');
}

// Update stats
function updateStats() {
    const totalDesigns = hairDesigns.length;
    const totalReviews = hairDesigns.reduce((sum, d) => sum + d.reviews.length, 0);
    const totalViews = hairDesigns.reduce((sum, d) => sum + d.views, 0);
    const avgRating = (hairDesigns.reduce((sum, d) => sum + parseFloat(d.rating), 0) / totalDesigns).toFixed(1);

    document.getElementById('totalDesigns').textContent = totalDesigns;
    document.getElementById('avgRating').textContent = avgRating;
    document.getElementById('totalReviews').textContent = totalReviews;
    document.getElementById('totalViews').textContent = totalViews;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
