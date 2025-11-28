// Demo accounts configuration
const DEMO_ACCOUNTS = [
    'ito.jun@example.com',
    'sato.misaki@example.com',
    'tanaka.kenta@example.com'
];

// DOM elements
const emailInput = document.getElementById('email');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const demoAccountElements = document.querySelectorAll('.demo-account');

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Initialize event listeners
function init() {
    // Login button click handler
    loginBtn.addEventListener('click', handleLogin);

    // Enter key handler for email input
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    // Clear error message when user starts typing
    emailInput.addEventListener('input', () => {
        hideError();
    });

    // Demo account click handlers
    demoAccountElements.forEach(element => {
        element.addEventListener('click', () => {
            const email = element.textContent.trim();
            if (email) {
                emailInput.value = email;
                emailInput.focus();
                hideError();
            }
        });
    });
}

// Handle login
function handleLogin() {
    const email = emailInput.value.trim().toLowerCase();

    // Validate email format
    if (!email) {
        showError('メールアドレスを入力してください。');
        return;
    }

    if (!EMAIL_REGEX.test(email)) {
        showError('有効なメールアドレスを入力してください。');
        return;
    }

    // Check if email is in demo accounts
    if (!DEMO_ACCOUNTS.includes(email)) {
        showError('このメールアドレスは登録されていません。デモアカウントをご利用ください。');
        return;
    }

    // Login successful
    hideError();
    showSuccessAndRedirect(email);
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

// Hide error message
function hideError() {
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
}

// Show success and redirect
function showSuccessAndRedirect(email) {
    // Disable button and show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="btn-text">ログイン中...</span>';

    // Save login information to localStorage
    localStorage.setItem('userEmail', email);
    localStorage.setItem('loginTime', new Date().toISOString());

    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

// Check if user is already logged in
function checkExistingLogin() {
    const userEmail = localStorage.getItem('userEmail');
    const loginTime = localStorage.getItem('loginTime');

    if (userEmail && loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursSinceLogin = (now - loginDate) / (1000 * 60 * 60);

        // Auto-logout after 24 hours
        if (hoursSinceLogin < 24) {
            console.log('User already logged in:', userEmail);
            // Optionally redirect to dashboard
            // window.location.href = 'dashboard.html';
        } else {
            // Clear expired login
            localStorage.removeItem('userEmail');
            localStorage.removeItem('loginTime');
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    init();
    checkExistingLogin();
});

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleLogin,
        DEMO_ACCOUNTS,
        EMAIL_REGEX
    };
}
