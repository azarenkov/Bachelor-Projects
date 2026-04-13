// Company management page
requireAuth();

const user = api.getUser();
if (user && user.role !== 'employer' && user.role !== 'admin') {
    window.location.href = '/jobs.html';
}

let currentCompanyId = null;
let currentCompany = null;

// Load company data
async function loadCompany() {
    try {
        const data = await api.getCompanies();
        const companies = data.companies || [];
        
        // Find user's company
        const userId = user._id || user.id;
        const userCompany = companies.find(c => {
            const companyUserId = c.userId?._id || c.userId;
            return companyUserId === userId;
        });
        
        if (userCompany) {
            currentCompanyId = userCompany._id;
            currentCompany = userCompany;
            showViewMode(userCompany);
        } else {
            showEditMode(true); // Show create mode
        }
    } catch (error) {
        showAlert('errorAlert', 'Failed to load company data', 'danger');
        showEditMode(true);
    }
}

// Show view mode
function showViewMode(company) {
    document.getElementById('viewMode').style.display = 'block';
    document.getElementById('editMode').style.display = 'none';
    
    const viewContainer = document.getElementById('companyView');
    
    let html = '';
    
    if (company.logo) {
        html += `
            <div class="text-center mb-4">
                <img src="${company.logo}" alt="${company.name}" class="img-fluid" style="max-height: 120px;">
            </div>
        `;
    }
    
    html += `
        <div class="mb-4">
            <h4>${company.name}</h4>
        </div>
    `;
    
    if (company.description) {
        html += `
            <div class="mb-3">
                <h6 class="text-muted">Description</h6>
                <p>${company.description}</p>
            </div>
        `;
    }
    
    html += '<div class="row">';
    
    if (company.industry) {
        html += `
            <div class="col-md-6 mb-3">
                <h6 class="text-muted">Industry</h6>
                <p class="mb-0">${company.industry}</p>
            </div>
        `;
    }
    
    if (company.size) {
        html += `
            <div class="col-md-6 mb-3">
                <h6 class="text-muted">Company Size</h6>
                <p class="mb-0">${company.size} employees</p>
            </div>
        `;
    }
    
    if (company.location) {
        html += `
            <div class="col-md-6 mb-3">
                <h6 class="text-muted">Location</h6>
                <p class="mb-0"><i class="bi bi-geo-alt"></i> ${company.location}</p>
            </div>
        `;
    }
    
    if (company.website) {
        html += `
            <div class="col-md-6 mb-3">
                <h6 class="text-muted">Website</h6>
                <p class="mb-0"><a href="${company.website}" target="_blank"><i class="bi bi-link-45deg"></i> ${company.website}</a></p>
            </div>
        `;
    }
    
    html += '</div>';
    
    viewContainer.innerHTML = html;
}

// Show edit mode
function showEditMode(isCreate = false) {
    document.getElementById('viewMode').style.display = 'none';
    document.getElementById('editMode').style.display = 'block';
    
    if (isCreate) {
        document.getElementById('formTitle').textContent = 'Create Company Profile';
        document.getElementById('submitBtnText').textContent = 'Create Company';
        document.getElementById('cancelBtn').classList.add('d-none');
    } else {
        document.getElementById('formTitle').textContent = 'Edit Company Profile';
        document.getElementById('submitBtnText').textContent = 'Update Company';
        document.getElementById('cancelBtn').classList.remove('d-none');
        populateForm(currentCompany);
    }
}

// Toggle edit mode
function toggleEditMode() {
    if (document.getElementById('editMode').style.display === 'none') {
        showEditMode(false);
    } else {
        if (currentCompany) {
            showViewMode(currentCompany);
        }
    }
}

// Populate form
function populateForm(company) {
    document.getElementById('companyId').value = company._id;
    document.getElementById('name').value = company.name;
    document.getElementById('description').value = company.description || '';
    document.getElementById('website').value = company.website || '';
    document.getElementById('industry').value = company.industry || '';
    document.getElementById('size').value = company.size || '';
    document.getElementById('location').value = company.location || '';
    document.getElementById('logo').value = company.logo || '';
}

// Handle form submission
document.getElementById('companyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const spinner = document.getElementById('saveSpinner');
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    
    errorAlert.classList.add('d-none');
    successAlert.classList.add('d-none');
    spinner.classList.remove('d-none');
    
    const data = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        website: document.getElementById('website').value,
        industry: document.getElementById('industry').value,
        size: document.getElementById('size').value,
        location: document.getElementById('location').value,
        logo: document.getElementById('logo').value
    };
    
    try {
        const companyId = document.getElementById('companyId').value;
        
        if (companyId) {
            const result = await api.updateCompany(companyId, data);
            currentCompany = result.company;
            successAlert.textContent = 'Company updated successfully!';
        } else {
            const result = await api.createCompany(data);
            currentCompanyId = result.company._id;
            currentCompany = result.company;
            document.getElementById('companyId').value = currentCompanyId;
            successAlert.textContent = 'Company created successfully!';
        }
        
        successAlert.classList.remove('d-none');
        
        // Switch to view mode after 1 second
        setTimeout(() => {
            showViewMode(currentCompany);
        }, 1000);
        
    } catch (error) {
        errorAlert.textContent = 'Failed to save company';
        errorAlert.classList.remove('d-none');
    } finally {
        spinner.classList.add('d-none');
    }
});

// Load company on page load
loadCompany();
