// Job details page
requireAuth();

const urlParams = new URLSearchParams(window.location.search);
const jobId = urlParams.get('id');

if (!jobId) {
    window.location.href = '/jobs.html';
}

let currentJob = null;

// Load job details
async function loadJobDetails() {
    try {
        const job = await api.getJob(jobId);
        currentJob = job;
        displayJobDetails(job);
        displayCompanyInfo(job.company);
    } catch (error) {
        showError('jobDetails', 'Failed to load job details');
    }
}

// Display job details
function displayJobDetails(job) {
    const container = document.getElementById('jobDetails');
    
    let html = `
        <h2 class="mb-3">${job.title}</h2>
        <div class="mb-4">
            <span class="badge ${getStatusBadgeClass(job.status)}">${job.status}</span>
            <span class="badge bg-primary ms-2">${job.type}</span>
        </div>
        
        <div class="mb-4">
            <h5><i class="bi bi-cash-stack"></i> Salary</h5>
            <p class="text-success fw-bold">${formatSalary(job.salary)}</p>
        </div>
        
        ${job.location ? `
            <div class="mb-4">
                <h5><i class="bi bi-geo-alt"></i> Location</h5>
                <p>${job.location}</p>
            </div>
        ` : ''}
        
        <div class="mb-4">
            <h5><i class="bi bi-file-text"></i> Description</h5>
            <p>${job.description}</p>
        </div>
    `;
    
    if (job.requirements && job.requirements.length > 0) {
        html += `
            <div class="mb-4">
                <h5><i class="bi bi-list-check"></i> Requirements</h5>
                <ul>
                    ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (job.responsibilities && job.responsibilities.length > 0) {
        html += `
            <div class="mb-4">
                <h5><i class="bi bi-clipboard-check"></i> Responsibilities</h5>
                <ul>
                    ${job.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (job.skills && job.skills.length > 0) {
        html += `
            <div class="mb-4">
                <h5><i class="bi bi-tools"></i> Required Skills</h5>
                <div class="d-flex gap-2 flex-wrap">
                    ${job.skills.map(skill => `<span class="badge bg-secondary">${skill}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="text-muted">
            <small>Posted on ${formatDate(job.createdAt)}</small>
        </div>
    `;
    
    container.innerHTML = html;
}

// Display company info
function displayCompanyInfo(company) {
    if (!company) return;
    
    const container = document.getElementById('companyCard');
    
    const html = `
        <div class="card-body">
            <h5 class="card-title">About Company</h5>
            ${company.logo ? `<img src="${company.logo}" alt="${company.name}" class="img-fluid mb-3" style="max-height: 80px;">` : ''}
            <h6>${company.name}</h6>
            ${company.description ? `<p class="small">${company.description}</p>` : ''}
            ${company.industry ? `<p class="small mb-1"><strong>Industry:</strong> ${company.industry}</p>` : ''}
            ${company.size ? `<p class="small mb-1"><strong>Size:</strong> ${company.size}</p>` : ''}
            ${company.location ? `<p class="small mb-1"><strong>Location:</strong> ${company.location}</p>` : ''}
            ${company.website ? `<p class="small mb-0"><a href="${company.website}" target="_blank">Visit Website</a></p>` : ''}
        </div>
    `;
    
    container.innerHTML = html;
}

// Handle save job
document.getElementById('saveJobBtn').addEventListener('click', async () => {
    try {
        await api.saveJob(jobId);
        showAlert('applyAlert', 'Job saved successfully!', 'success');
    } catch (error) {
        showAlert('applyAlert', 'Failed to save job or already saved', 'danger');
    }
});

// Handle application form
document.getElementById('applyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const alertEl = document.getElementById('applyAlert');
    alertEl.classList.add('d-none');
    
    const data = {
        job: jobId,
        resumeUrl: document.getElementById('resumeUrl').value,
        coverLetter: document.getElementById('coverLetter').value
    };
    
    console.log('Submitting application with data:', data);
    
    try {
        const result = await api.applyToJob(data);
        console.log('Application submitted successfully:', result);
        alertEl.className = 'alert alert-success';
        alertEl.textContent = 'Application submitted successfully!';
        alertEl.classList.remove('d-none');
        
        setTimeout(() => {
            bootstrap.Modal.getInstance(document.getElementById('applyModal')).hide();
            document.getElementById('applyForm').reset();
        }, 2000);
    } catch (error) {
        console.error('Error submitting application:', error);
        alertEl.className = 'alert alert-danger';
        alertEl.textContent = error.message || 'Failed to submit application. You may have already applied.';
        alertEl.classList.remove('d-none');
    }
});

// Load job on page load
loadJobDetails();
