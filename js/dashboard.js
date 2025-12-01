// Hair Design Review System - Dashboard Handler

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    loadDashboardData();
});

function checkAuthentication() {
    const currentUser = sessionStorage.getItem('currentUser');

    if (!currentUser) {
        // No user logged in, redirect to login
        window.location.href = 'index.html';
        return;
    }
}

function loadDashboardData() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (currentUser) {
        console.log('Logged in as:', currentUser.name);
        console.log('Salon:', currentUser.salon);
        console.log('Email:', currentUser.email);
    }
}

function logout() {
    if (confirm('ログアウトしますか？')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}
