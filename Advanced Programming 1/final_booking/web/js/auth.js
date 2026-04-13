const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const navAuth = document.getElementById('navAuth');
const navUser = document.getElementById('navUser');
const userName = document.getElementById('userName');
const myBookingsLink = document.getElementById('myBookingsLink');
const ownerDashboardLink = document.getElementById('ownerDashboardLink');

function openAuthModal(showRegister = false) {
    authModal.classList.add('active');
    if (showRegister) {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    } else {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    }
}

function closeAuthModal() {
    authModal.classList.remove('active');
    loginFormElement.reset();
    registerFormElement.reset();
}

loginBtn.addEventListener('click', () => openAuthModal(false));
registerBtn.addEventListener('click', () => openAuthModal(true));
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
});
showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
});

authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        closeAuthModal();
    }
});

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    });
});

loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        await api.login(email, password);
        showToast('Welcome back!', 'success');
        closeAuthModal();
        updateAuthUI();
        navigateToPage('home');
    } catch (error) {
        showToast(error.message || 'Login failed', 'error');
    }
});

registerFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        await api.register(name, email, password);
        showToast('Account created successfully!', 'success');
        closeAuthModal();
        updateAuthUI();
        navigateToPage('home');
    } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
    }
});

logoutBtn.addEventListener('click', () => {
    api.clearAuth();
    showToast('Logged out successfully', 'success');
    updateAuthUI();
    navigateToPage('home');
});

function updateAuthUI() {
    const user = api.getCurrentUser();

    if (api.isAuthenticated() && user) {
        navAuth.style.display = 'none';
        navUser.style.display = 'flex';
        userName.textContent = user.name;
        myBookingsLink.style.display = 'block';
        ownerDashboardLink.style.display = 'block';
    } else {
        navAuth.style.display = 'flex';
        navUser.style.display = 'none';
        myBookingsLink.style.display = 'none';
        ownerDashboardLink.style.display = 'none';
    }
}

updateAuthUI();
