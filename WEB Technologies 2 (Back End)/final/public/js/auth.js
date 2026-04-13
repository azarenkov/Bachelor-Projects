// Authentication page logic
requireGuest();

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const spinner = document.getElementById('loginSpinner');
    const errorAlert = document.getElementById('errorAlert');
    
    errorAlert.classList.add('d-none');
    spinner.classList.remove('d-none');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const result = await api.login(email, password);
        console.log('Login result:', result);
        
        if (result.token) {
            api.setAuth(result.token, result.user);
            
            // Redirect based on role
            if (result.user.role === 'employer') {
                window.location.href = '/employer-dashboard.html';
            } else {
                window.location.href = '/jobs.html';
            }
        } else {
            errorAlert.textContent = result.message || 'Login failed';
            errorAlert.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorAlert.textContent = 'Network error. Please try again: ' + error.message;
        errorAlert.classList.remove('d-none');
    } finally {
        spinner.classList.add('d-none');
    }
});
