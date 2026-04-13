// Saved jobs page
requireAuth();

let currentPage = 1;

// Load saved jobs
async function loadSavedJobs(page = 1) {
    currentPage = page;
    showLoading('savedJobsContainer');
    
    try {
        const data = await api.getSavedJobs({ page, limit: 10 });
        displaySavedJobs(data);
    } catch (error) {
        showError('savedJobsContainer', 'Failed to load saved jobs');
    }
}

// Display saved jobs
function displaySavedJobs(data) {
    const container = document.getElementById('savedJobsContainer');
    
    if (!data.savedJobs || data.savedJobs.length === 0) {
        showEmpty('savedJobsContainer', 'No saved jobs yet');
        return;
    }
    
    let html = '';
    data.savedJobs.forEach(saved => {
        const job = saved.job;
        if (!job) return;
        
        const company = job.company;
        
        html += `
            <div class="card shadow-sm mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h5 class="card-title">
                                <a href="job-details.html?id=${job._id}" class="text-decoration-none">
                                    ${job.title}
                                </a>
                            </h5>
                            <p class="text-muted mb-2">
                                ${company ? `<i class="bi bi-building"></i> ${company.name}` : ''}
                                ${job.location ? `<i class="bi bi-geo-alt ms-3"></i> ${job.location}` : ''}
                            </p>
                            <p class="card-text text-truncate">${job.description}</p>
                            <div class="d-flex gap-2 flex-wrap">
                                <span class="badge bg-primary">${job.type}</span>
                                ${job.skills ? job.skills.slice(0, 3).map(skill => 
                                    `<span class="badge bg-secondary">${skill}</span>`
                                ).join('') : ''}
                            </div>
                        </div>
                        <div class="col-md-4 text-md-end">
                            <p class="text-success fw-bold mb-2">${formatSalary(job.salary)}</p>
                            <small class="text-muted d-block mb-2">Saved on ${formatDate(saved.savedAt)}</small>
                            <a href="job-details.html?id=${job._id}" class="btn btn-outline-primary btn-sm me-2">View Details</a>
                            <button class="btn btn-outline-danger btn-sm" onclick="unsaveJob('${job._id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Create pagination
    createPagination('pagination', parseInt(data.currentPage), data.totalPages, loadSavedJobs);
}

// Unsave job
async function unsaveJob(jobId) {
    if (!confirm('Remove this job from saved?')) return;
    
    try {
        await api.unsaveJob(jobId);
        loadSavedJobs(currentPage);
    } catch (error) {
        alert('Failed to remove saved job');
    }
}

// Load saved jobs on page load
loadSavedJobs(1);
