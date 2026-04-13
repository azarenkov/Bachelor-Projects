// API Base URL
const API_URL = '/api';

// API Helper Functions
const api = {
    // Get token from localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // Get user from localStorage
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Set auth data
    setAuth(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Clear auth data
    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Make authenticated request
    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['x-access-token'] = token;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            this.clearAuth();
            window.location.href = '/index.html';
            throw new Error('Unauthorized');
        }

        return response;
    },

    // Auth endpoints
    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        console.log('API login response:', response.status, data);
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        return data;
    },

    async register(data) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // User endpoints
    async getProfile() {
        const response = await this.request('/users/profile');
        return response.json();
    },

    async updateProfile(data) {
        const response = await this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Jobs endpoints
    async getJobs(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await this.request(`/jobs?${query}`);
        return response.json();
    },

    async getJob(id) {
        const response = await this.request(`/jobs/${id}`);
        return response.json();
    },

    async createJob(data) {
        const response = await this.request('/jobs', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async updateJob(id, data) {
        const response = await this.request(`/jobs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async deleteJob(id) {
        const response = await this.request(`/jobs/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    },

    // Applications endpoints
    async applyToJob(data) {
        console.log('Applying to job with data:', data);
        const response = await this.request('/applications', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        console.log('Apply response status:', response.status);
        if (!response.ok) {
            const error = await response.json();
            console.error('Error applying to job:', error);
            throw new Error(error.message || 'Failed to apply to job');
        }
        const result = await response.json();
        console.log('Apply response data:', result);
        return result;
    },

    async getMyApplications(params = {}) {
        const query = new URLSearchParams(params).toString();
        console.log('Fetching applications with query:', query);
        const response = await this.request(`/applications?${query}`);
        console.log('Applications response status:', response.status);
        if (!response.ok) {
            const error = await response.json();
            console.error('Error fetching my applications:', error);
            throw new Error(error.message || 'Failed to fetch applications');
        }
        const data = await response.json();
        console.log('Applications response data:', data);
        return data;
    },

    async getJobApplications(jobId) {
        const response = await this.request(`/applications/job/${jobId}`);
        if (!response.ok) {
            const error = await response.json();
            console.error('Error fetching applications:', error);
            throw new Error(error.message || 'Failed to fetch applications');
        }
        return response.json();
    },

    async updateApplicationStatus(id, status) {
        const response = await this.request(`/applications/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        return response.json();
    },

    async withdrawApplication(id) {
        const response = await this.request(`/applications/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    },

    // Saved jobs endpoints
    async saveJob(jobId) {
        const response = await this.request('/saved', {
            method: 'POST',
            body: JSON.stringify({ job: jobId })
        });
        return response.json();
    },

    async getSavedJobs(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await this.request(`/saved?${query}`);
        return response.json();
    },

    async unsaveJob(jobId) {
        const response = await this.request(`/saved/${jobId}`, {
            method: 'DELETE'
        });
        return response.json();
    },

    // Company endpoints
    async getCompanies(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await this.request(`/companies?${query}`);
        return response.json();
    },

    async getCompany(id) {
        const response = await this.request(`/companies/${id}`);
        return response.json();
    },

    async createCompany(data) {
        const response = await this.request('/companies', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async updateCompany(id, data) {
        const response = await this.request(`/companies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    }
};
