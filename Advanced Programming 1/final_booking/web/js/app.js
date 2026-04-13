function navigateToPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const page = document.getElementById(pageName + 'Page');
    if (page) {
        page.classList.add('active');
    }

    const navLink = document.querySelector(`[data-page="${pageName}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }

    switch (pageName) {
        case 'home':
            loadFeaturedHotels();
            break;
        case 'hotels':
            loadAllHotels();
            break;
        case 'bookings':
            loadMyBookings();
            break;
        case 'owner':
            loadOwnerDashboard();
            break;
    }

    window.scrollTo(0, 0);
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        navigateToPage(page);
    });
});

document.querySelector('.nav-brand').addEventListener('click', () => {
    navigateToPage('home');
});

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function requireAuth(callback) {
    if (!api.isAuthenticated()) {
        showToast('Please login to continue', 'warning');
        openAuthModal(false);
        return false;
    }
    callback();
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    navigateToPage('home');

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const searchCheckIn = document.getElementById('searchCheckIn');
    const searchCheckOut = document.getElementById('searchCheckOut');

    if (searchCheckIn) {
        searchCheckIn.min = today;
        searchCheckIn.value = today;
    }

    if (searchCheckOut) {
        searchCheckOut.min = tomorrow.toISOString().split('T')[0];
        searchCheckOut.value = tomorrow.toISOString().split('T')[0];
    }
});

window.addEventListener('popstate', () => {
    const hash = window.location.hash.slice(1) || 'home';
    navigateToPage(hash);
});

document.addEventListener('click', (e) => {
    if (e.target.closest('.modal') && e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

const searchCityInput = document.getElementById('searchCity');
if (searchCityInput) {
    searchCityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });
}

console.log('%c🏨 Booking Platform', 'font-size: 24px; color: #667eea; font-weight: bold;');
console.log('%cWelcome to the Booking Platform!', 'font-size: 14px; color: #6b7280;');
console.log('%cAPI Base URL:', 'font-weight: bold;', API_BASE_URL);

if (api.isAuthenticated()) {
    const user = api.getCurrentUser();
    console.log('%cLogged in as:', 'font-weight: bold;', user?.name, `(${user?.email})`);
}
