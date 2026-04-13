// Jobs listing page
requireAuth();

let currentPage = 1;
let currentFilters = {};

// Load jobs
async function loadJobs(page = 1) {
    currentPage = page;
    showLoading('jobsContainer');
    
    const params = {
        page,
        limit: 10,
        ...currentFilters
    };
    
    try {
        const data = await api.getJobs(params);
        displayJobs(data);
    } catch (error) {
        showError('jobsContainer', 'Failed to load jobs');
    }
}

// Display jobs
function displayJobs(data) {
    const container = document.getElementById('jobsContainer');
    const countEl = document.getElementById('jobCount');
    
    if (!data.jobs || data.jobs.length === 0) {
        showEmpty('jobsContainer', 'No jobs found matching your criteria');
        countEl.textContent = '0 jobs found';
        return;
    }
    
    countEl.textContent = `${data.total} jobs found`;
    
    let html = '';
    data.jobs.forEach(job => {
        html += `
            <div class="card shadow-sm mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-9">
                            <h5 class="card-title">
                                <a href="job-details.html?id=${job._id}" class="text-decoration-none">
                                    ${job.title}
                                </a>
                            </h5>
                            <p class="text-muted mb-2">
                                <i class="bi bi-building"></i> ${job.company?.name || 'Company'}
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
                        <div class="col-md-3 text-md-end">
                            <p class="text-success fw-bold mb-2">${formatSalary(job.salary)}</p>
                            <small class="text-muted d-block mb-2">${formatDate(job.createdAt)}</small>
                            <a href="job-details.html?id=${job._id}" class="btn btn-outline-primary btn-sm">View Details</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Create pagination
    createPagination('pagination', parseInt(data.currentPage), data.totalPages, loadJobs);
}

// Handle filter form
document.getElementById('filterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    currentFilters = {};
    
    const search = document.getElementById('searchInput').value.trim();
    const location = document.getElementById('locationInput').value.trim();
    const type = document.getElementById('typeSelect').value;
    const salaryMin = document.getElementById('salaryMinInput').value;
    const salaryMax = document.getElementById('salaryMaxInput').value;
    
    if (search) currentFilters.search = search;
    if (location) currentFilters.location = location;
    if (type) currentFilters.type = type;
    if (salaryMin) currentFilters.salaryMin = salaryMin;
    if (salaryMax) currentFilters.salaryMax = salaryMax;
    
    loadJobs(1);
});

// Clear filters
function clearFilters() {
    document.getElementById('filterForm').reset();
    currentFilters = {};
    loadJobs(1);
}

// Initial load
loadJobs(1);
