// Profile page
requireAuth();

const user = api.getUser();

// Redirect employers to company page
if (user && (user.role === 'employer' || user.role === 'admin')) {
    window.location.href = '/my-company.html';
}

// Load profile data
async function loadProfile() {
    try {
        const user = await api.getProfile();
        populateForm(user);
    } catch (error) {
        showAlert('errorAlert', 'Failed to load profile', 'danger');
    }
}

// Populate form with user data
function populateForm(user) {
    document.getElementById('username').value = user.username || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('firstName').value = user.firstName || '';
    document.getElementById('lastName').value = user.lastName || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('location').value = user.location || '';
    document.getElementById('resumeUrl').value = user.resumeUrl || '';
    document.getElementById('skills').value = user.skills ? user.skills.join(', ') : '';
    document.getElementById('experience').value = user.experience || '';
    document.getElementById('education').value = user.education || '';
}

// Handle profile update
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const spinner = document.getElementById('saveSpinner');
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    
    errorAlert.classList.add('d-none');
    successAlert.classList.add('d-none');
    spinner.classList.remove('d-none');
    
    const skills = document.getElementById('skills').value;
    
    const data = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        resumeUrl: document.getElementById('resumeUrl').value,
        skills: skills ? skills.split(',').map(s => s.trim()) : [],
        experience: document.getElementById('experience').value,
        education: document.getElementById('education').value
    };
    
    try {
        const result = await api.updateProfile(data);
        
        // Update stored user data
        const currentUser = api.getUser();
        api.setAuth(api.getToken(), { ...currentUser, ...result.user });
        
        successAlert.textContent = 'Profile updated successfully!';
        successAlert.classList.remove('d-none');
    } catch (error) {
        errorAlert.textContent = 'Failed to update profile';
        errorAlert.classList.remove('d-none');
    } finally {
        spinner.classList.add('d-none');
    }
});

// Load profile on page load
loadProfile();
