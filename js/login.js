// Hair Design Review System - Login Handler
const CSV_PATH = '美容師データ (1).csv';

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const demoAccounts = document.querySelectorAll('.demo-account');

    // Demo account click handlers
    demoAccounts.forEach(account => {
        account.addEventListener('click', () => {
            const email = account.textContent.split(': ')[1];
            emailInput.value = email;
            emailInput.focus();
        });
    });

    // Login button click handler
    loginBtn.addEventListener('click', handleLogin);

    // Enter key handler
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    async function handleLogin() {
        const email = emailInput.value.trim();

        if (!email) {
            showError('メールアドレスを入力してください');
            return;
        }

        if (!isValidEmail(email)) {
            showError('有効なメールアドレスを入力してください');
            return;
        }

        // Show loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="btn-text">ログイン中...</span>';

        try {
            const hairdressers = await loadHairdressers();
            const hairdresser = hairdressers.find(h => h.email === email);

            if (hairdresser) {
                // Store user data
                sessionStorage.setItem('currentUser', JSON.stringify(hairdresser));

                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                showError('このメールアドレスは登録されていません');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<span class="btn-text">ログイン</span><span class="btn-arrow">→</span>';
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('ログイン中にエラーが発生しました');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span class="btn-text">ログイン</span><span class="btn-arrow">→</span>';
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');

        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 5000);
    }

    async function loadHairdressers() {
        return new Promise((resolve, reject) => {
            Papa.parse(CSV_PATH, {
                download: true,
                header: true,
                complete: (results) => {
                    const hairdressers = results.data
                        .filter(row => row.メールアドレス)
                        .map(row => ({
                            name: row.姓名,
                            kana: row.セイメイ,
                            salon: row.勤務サロン名,
                            email: row.メールアドレス,
                            image: row.アップロード画像ファイル名
                        }));
                    resolve(hairdressers);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    }
});
