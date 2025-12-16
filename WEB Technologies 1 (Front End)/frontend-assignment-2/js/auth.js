function getUsers() {
    const users = localStorage.getItem('gadgetstore_users');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('gadgetstore_users', JSON.stringify(users));
}

function getCurrentUser() {
    const user = localStorage.getItem('gadgetstore_current_user');
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('gadgetstore_current_user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('gadgetstore_current_user');
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function signUp(name, email, password) {
    const users = getUsers();
    
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password, 
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    return { success: true, message: 'Account created successfully!', user: newUser };
}

function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        const userWithoutPassword = {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        };
        setCurrentUser(userWithoutPassword);
        return { success: true, message: 'Login successful!', user: userWithoutPassword };
    } else {
        return { success: false, message: 'Invalid email or password' };
    }
}

if (document.getElementById('signup-form')) {
    document.getElementById('signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        const errorDiv = document.getElementById('error-message');
        const successDiv = document.getElementById('success-message');
        
        errorDiv.classList.add('d-none');
        successDiv.classList.add('d-none');
        
        if (name.length < 2) {
            errorDiv.textContent = 'Name must be at least 2 characters long';
            errorDiv.classList.remove('d-none');
            return;
        }
        
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters long';
            errorDiv.classList.remove('d-none');
            return;
        }
        
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.classList.remove('d-none');
            return;
        }
        
        const result = signUp(name, email, password);
        
        if (result.success) {
            successDiv.textContent = result.message + ' Redirecting to login...';
            successDiv.classList.remove('d-none');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.remove('d-none');
        }
    });
}

if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        const errorDiv = document.getElementById('error-message');
        
        errorDiv.classList.add('d-none');
        
        const result = login(email, password);
        
        if (result.success) {
            window.location.href = 'profile.html';
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.remove('d-none');
        }
    });
}

if (window.location.pathname.includes('profile.html')) {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

window.addEventListener('load', function() {
    const user = getCurrentUser();
    const authNavItem = document.getElementById('auth-nav-item');
    
    if (user && authNavItem) {
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        const profilePath = isInPagesFolder ? 'profile.html' : 'pages/profile.html';
        
        authNavItem.innerHTML = `
            <a class="nav-link" href="${profilePath}">
                <i class="fas fa-user-circle me-1"></i>${user.name}
            </a>
        `;
    }
});
