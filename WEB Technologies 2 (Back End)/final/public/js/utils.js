// Utility Functions

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Redirect if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/index.html';
    }
}

// Redirect if authenticated
function requireGuest() {
    if (isAuthenticated()) {
        const user = api.getUser();
        if (user && user.role === 'employer') {
            window.location.href = '/employer-dashboard.html';
        } else {
            window.location.href = '/jobs.html';
        }
    }
}

// Logout function
function logout() {
    api.clearAuth();
    window.location.href = '/index.html';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format salary
function formatSalary(salary) {
    if (!salary || (!salary.min && !salary.max)) {
        return 'Salary not specified';
    }
    
    const currency = salary.currency || 'USD';
    if (salary.min && salary.max) {
        return `${currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
    } else if (salary.min) {
        return `From ${currency} ${salary.min.toLocaleString()}`;
    } else {
        return `Up to ${currency} ${salary.max.toLocaleString()}`;
    }
}

// Get status badge class
function getStatusBadgeClass(status) {
    const badges = {
        'pending': 'bg-warning',
        'reviewed': 'bg-info',
        'accepted': 'bg-success',
        'rejected': 'bg-danger',
        'active': 'bg-success',
        'closed': 'bg-secondary',
        'draft': 'bg-warning'
    };
    return badges[status] || 'bg-secondary';
}

// Show alert
function showAlert(elementId, message, type = 'success') {
    const alert = document.getElementById(elementId);
    if (alert) {
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.classList.remove('d-none');
        
        setTimeout(() => {
            alert.classList.add('d-none');
        }, 5000);
    }
}

// Create pagination
function createPagination(containerId, currentPage, totalPages, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    let html = '<ul class="pagination justify-content-center">';
    
    // Previous button
    html += `<li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
    </li>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Next button
    html += `<li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
    </li>`;
    
    html += '</ul>';
    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('a[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.dataset.page);
            if (page >= 1 && page <= totalPages && page !== currentPage) {
                onPageChange(page);
            }
        });
    });
}

// Show loading spinner
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }
}

// Show empty state
function showEmpty(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                <p class="mt-3">${message}</p>
            </div>
        `;
    }
}

// Show error state
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> ${message}
            </div>
        `;
    }
}
