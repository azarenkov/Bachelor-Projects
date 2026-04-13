// Employer dashboard
requireAuth();

const user = api.getUser();
if (user && user.role !== 'employer' && user.role !== 'admin') {
    window.location.href = '/jobs.html';
}

let userCompanies = [];
let currentJobId = null;
let currentViewingJobId = null;

// Load companies for dropdown
async function loadCompanies() {
    try {
        const data = await api.getCompanies();
        userCompanies = data.companies || [];
        
        if (userCompanies.length === 0) {
            document.getElementById('companyWarning').classList.remove('d-none');
        } else {
            populateCompanySelect();
        }
    } catch (error) {
        console.error('Failed to load companies');
    }
}

// Populate company select
function populateCompanySelect() {
    const select = document.getElementById('company');
    select.innerHTML = '<option value="">Select company...</option>';
    
    userCompanies.forEach(company => {
        select.innerHTML += `<option value="${company._id}">${company.name}</option>`;
    });
}

// Load jobs
async function loadJobs() {
    showLoading('jobsContainer');
    
    try {
        const data = await api.getJobs();
        console.log('All jobs:', data.jobs);
        console.log('Current user:', user);
        const userId = user._id || user.id;
        const myJobs = data.jobs.filter(job => {
            const jobPosterId = job.postedBy?._id || job.postedBy;
            return jobPosterId === userId;
        });
        console.log('My jobs:', myJobs);
        displayJobs(myJobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
        showError('jobsContainer', 'Failed to load jobs');
    }
}

// Display jobs
function displayJobs(jobs) {
    const container = document.getElementById('jobsContainer');
    
    if (!jobs || jobs.length === 0) {
        showEmpty('jobsContainer', 'No jobs posted yet. Create your first job posting!');
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Title</th><th>Company</th><th>Type</th><th>Status</th><th>Applications</th><th>Posted</th><th>Actions</th></tr></thead><tbody>';
    
    jobs.forEach(job => {
        html += `
            <tr>
                <td><strong>${job.title}</strong></td>
                <td>${job.company?.name || 'N/A'}</td>
                <td><span class="badge bg-primary">${job.type}</span></td>
                <td><span class="badge ${getStatusBadgeClass(job.status)}">${job.status}</span></td>
                <td>
                    <button class="btn btn-link btn-sm p-0" onclick="viewApplicants('${job._id}')">
                        ${job.applicationsCount || 0} applicants
                    </button>
                </td>
                <td>${formatDate(job.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editJob('${job._id}')" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteJob('${job._id}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Open job modal
function openJobModal(jobId = null) {
    currentJobId = jobId;
    const modal = document.getElementById('jobModal');
    const form = document.getElementById('jobForm');
    form.reset();
    
    if (jobId) {
        document.getElementById('jobModalTitle').textContent = 'Edit Job Posting';
        loadJobData(jobId);
    } else {
        document.getElementById('jobModalTitle').textContent = 'Create Job Posting';
        document.getElementById('jobId').value = '';
    }
}

// Load job data for editing
async function loadJobData(jobId) {
    try {
        const job = await api.getJob(jobId);
        document.getElementById('jobId').value = job._id;
        document.getElementById('company').value = job.company._id || job.company;
        document.getElementById('title').value = job.title;
        document.getElementById('description').value = job.description;
        document.getElementById('location').value = job.location || '';
        document.getElementById('type').value = job.type;
        document.getElementById('salaryMin').value = job.salary?.min || '';
        document.getElementById('salaryMax').value = job.salary?.max || '';
        document.getElementById('currency').value = job.salary?.currency || 'USD';
        document.getElementById('skills').value = job.skills ? job.skills.join(', ') : '';
        document.getElementById('requirements').value = job.requirements ? job.requirements.join('\n') : '';
        document.getElementById('responsibilities').value = job.responsibilities ? job.responsibilities.join('\n') : '';
        document.getElementById('status').value = job.status;
    } catch (error) {
        showAlert('jobAlert', 'Failed to load job data', 'danger');
    }
}

// Edit job
async function editJob(jobId) {
    openJobModal(jobId);
    new bootstrap.Modal(document.getElementById('jobModal')).show();
}

// Delete job
async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    
    try {
        await api.deleteJob(jobId);
        loadJobs();
    } catch (error) {
        alert('Failed to delete job');
    }
}

// Handle job form submission
document.getElementById('jobForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const spinner = document.getElementById('jobSpinner');
    const alertEl = document.getElementById('jobAlert');
    alertEl.classList.add('d-none');
    spinner.classList.remove('d-none');
    
    const skills = document.getElementById('skills').value;
    const requirements = document.getElementById('requirements').value;
    const responsibilities = document.getElementById('responsibilities').value;
    
    const data = {
        company: document.getElementById('company').value,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        location: document.getElementById('location').value,
        type: document.getElementById('type').value,
        salary: {
            min: parseFloat(document.getElementById('salaryMin').value) || undefined,
            max: parseFloat(document.getElementById('salaryMax').value) || undefined,
            currency: document.getElementById('currency').value
        },
        skills: skills ? skills.split(',').map(s => s.trim()) : [],
        requirements: requirements ? requirements.split('\n').filter(r => r.trim()) : [],
        responsibilities: responsibilities ? responsibilities.split('\n').filter(r => r.trim()) : [],
        status: document.getElementById('status').value
    };
    
    try {
        const jobId = document.getElementById('jobId').value;
        if (jobId) {
            await api.updateJob(jobId, data);
        } else {
            await api.createJob(data);
        }
        
        bootstrap.Modal.getInstance(document.getElementById('jobModal')).hide();
        loadJobs();
    } catch (error) {
        alertEl.className = 'alert alert-danger';
        alertEl.textContent = 'Failed to save job';
        alertEl.classList.remove('d-none');
    } finally {
        spinner.classList.add('d-none');
    }
});

// View applicants
async function viewApplicants(jobId) {
    console.log('Loading applicants for job:', jobId);
    currentViewingJobId = jobId;  // Save for reload after status update
    showLoading('applicantsContainer');
    new bootstrap.Modal(document.getElementById('applicantsModal')).show();
    
    try {
        const data = await api.getJobApplications(jobId);
        console.log('Applicants data:', data);
        displayApplicants(data.applications || []);
    } catch (error) {
        console.error('Error loading applicants:', error);
        showError('applicantsContainer', 'Failed to load applicants: ' + error.message);
    }
}

// Display applicants
function displayApplicants(applications) {
    const container = document.getElementById('applicantsContainer');
    
    console.log('Displaying applicants:', applications);
    
    if (!applications || applications.length === 0) {
        showEmpty('applicantsContainer', 'No applications yet');
        return;
    }
    
    let html = '';
    applications.forEach(app => {
        const applicant = app.applicant;
        if (!applicant) {
            console.warn('Application without applicant:', app);
            return;
        }
        html += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6>${applicant.firstName || ''} ${applicant.lastName || ''} (@${applicant.username || 'N/A'})</h6>
                            <p class="small text-muted mb-2">${applicant.email || 'No email'}</p>
                            ${app.coverLetter ? `<p class="small"><strong>Cover Letter:</strong><br>${app.coverLetter}</p>` : ''}
                            <p class="small text-muted">Applied: ${formatDate(app.appliedAt)}</p>
                        </div>
                        <div class="col-md-4">
                            <span class="badge ${getStatusBadgeClass(app.status)} mb-2">${app.status}</span>
                            ${app.resumeUrl ? `<a href="${app.resumeUrl}" target="_blank" class="btn btn-sm btn-outline-primary d-block mb-2">View Resume</a>` : ''}
                            <select class="form-select form-select-sm" onchange="updateApplicationStatus('${app._id}', this.value)">
                                <option value="">Update Status...</option>
                                <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="reviewed" ${app.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                                <option value="accepted" ${app.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                                <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Update application status
async function updateApplicationStatus(appId, status) {
    if (!status) return;
    
    try {
        await api.updateApplicationStatus(appId, status);
        alert('Status updated successfully');
        // Reload applicants if we know which job they're from
        if (currentViewingJobId) {
            viewApplicants(currentViewingJobId);
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status: ' + error.message);
    }
}

// Initialize
loadCompanies();
loadJobs();
