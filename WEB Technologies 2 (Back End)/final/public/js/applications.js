// Applications page
requireAuth();

let currentPage = 1;
let currentStatus = '';

// Load applications
async function loadApplications(page = 1) {
    currentPage = page;
    showLoading('applicationsContainer');
    
    const params = { page, limit: 10 };
    if (currentStatus) params.status = currentStatus;
    
    try {
        console.log('Loading applications with params:', params);
        const data = await api.getMyApplications(params);
        console.log('Received applications data:', data);
        displayApplications(data);
    } catch (error) {
        console.error('Error loading applications:', error);
        showError('applicationsContainer', 'Failed to load applications: ' + error.message);
    }
}

// Display applications
function displayApplications(data) {
    const container = document.getElementById('applicationsContainer');
    
    console.log('Displaying applications:', data);
    console.log('Applications array length:', data.applications ? data.applications.length : 'undefined');
    
    if (!data.applications || data.applications.length === 0) {
        showEmpty('applicationsContainer', 'No applications found');
        return;
    }
    
    let html = '';
    data.applications.forEach(app => {
        const job = app.job;
        const company = job?.company;
        
        html += `
            <div class="card shadow-sm mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h5 class="card-title">
                                ${job ? `<a href="job-details.html?id=${job._id}" class="text-decoration-none">${job.title}</a>` : 'Job Deleted'}
                            </h5>
                            ${company ? `<p class="text-muted mb-2"><i class="bi bi-building"></i> ${company.name}</p>` : ''}
                            <p class="card-text small text-muted">Applied on ${formatDate(app.appliedAt)}</p>
                            ${app.coverLetter ? `<p class="card-text small"><strong>Cover Letter:</strong> ${app.coverLetter.substring(0, 100)}${app.coverLetter.length > 100 ? '...' : ''}</p>` : ''}
                        </div>
                        <div class="col-md-4 text-md-end">
                            <span class="badge ${getStatusBadgeClass(app.status)} mb-2">${app.status}</span>
                            <div>
                                ${app.resumeUrl ? `<a href="${app.resumeUrl}" target="_blank" class="btn btn-sm btn-outline-primary mb-2">View Resume</a>` : ''}
                                ${app.status === 'pending' ? `<button class="btn btn-sm btn-outline-danger d-block" onclick="withdrawApplication('${app._id}')">Withdraw</button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Create pagination
    createPagination('pagination', parseInt(data.currentPage), data.totalPages, loadApplications);
}

// Withdraw application
async function withdrawApplication(id) {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    
    try {
        await api.withdrawApplication(id);
        loadApplications(currentPage);
        showAlert('errorAlert', 'Application withdrawn successfully', 'success');
    } catch (error) {
        showAlert('errorAlert', 'Failed to withdraw application', 'danger');
    }
}

// Handle status filter
document.getElementById('filterStatus').addEventListener('change', (e) => {
    currentStatus = e.target.value;
    loadApplications(1);
});

// Load applications on page load
loadApplications(1);
