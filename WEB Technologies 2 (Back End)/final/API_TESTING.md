# API Testing Guide

## Base URL
http://localhost:5000

## 1. Authentication

### Register a Job Seeker
POST /api/auth/register
{
  "username": "john_seeker",
  "email": "john@example.com",
  "password": "password123",
  "role": "jobseeker"
}

### Register an Employer
POST /api/auth/register
{
  "username": "company_hr",
  "email": "hr@company.com",
  "password": "password123",
  "role": "employer"
}

### Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

Response: { "token": "eyJhbGc..." }

## 2. User Profile (Protected Routes)

Headers: Authorization: Bearer YOUR_TOKEN

### Get Profile
GET /api/users/profile

### Update Profile
PUT /api/users/profile
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "location": "New York",
  "skills": ["JavaScript", "Node.js"]
}

### Delete Profile
DELETE /api/users/profile

## 3. Companies (Employer Only)

### Create Company
POST /api/companies
Headers: Authorization: Bearer EMPLOYER_TOKEN
{
  "name": "Tech Solutions Inc",
  "description": "Leading technology company",
  "website": "https://techsolutions.com",
  "industry": "Technology",
  "size": "51-200",
  "location": "San Francisco, CA"
}

### Get All Companies
GET /api/companies?page=1&limit=10&search=tech&industry=Technology

### Get Company by ID
GET /api/companies/{companyId}

### Update Company
PUT /api/companies/{companyId}
Headers: Authorization: Bearer EMPLOYER_TOKEN
{
  "description": "Updated description"
}

### Delete Company
DELETE /api/companies/{companyId}
Headers: Authorization: Bearer EMPLOYER_TOKEN

## 4. Jobs

### Create Job (Employer Only)
POST /api/jobs
Headers: Authorization: Bearer EMPLOYER_TOKEN
{
  "title": "Senior Software Engineer",
  "description": "We are looking for an experienced developer...",
  "company": "COMPANY_ID_HERE",
  "location": "Remote",
  "type": "full-time",
  "salary": {
    "min": 80000,
    "max": 120000,
    "currency": "USD"
  },
  "requirements": [
    "5+ years of experience",
    "Strong JavaScript skills"
  ],
  "responsibilities": [
    "Design and develop applications",
    "Code review"
  ],
  "skills": ["JavaScript", "Node.js", "React", "MongoDB"],
  "status": "active"
}

### Search Jobs
GET /api/jobs?page=1&limit=10&search=engineer&location=Remote&type=full-time&skills=JavaScript,Node.js&salaryMin=50000&salaryMax=150000

### Get Job by ID
GET /api/jobs/{jobId}

### Update Job (Employer Only)
PUT /api/jobs/{jobId}
Headers: Authorization: Bearer EMPLOYER_TOKEN
{
  "status": "closed"
}

### Delete Job (Employer Only)
DELETE /api/jobs/{jobId}
Headers: Authorization: Bearer EMPLOYER_TOKEN

### Get Jobs by Company
GET /api/jobs/company/{companyId}

## 5. Applications

### Apply for Job (Job Seeker)
POST /api/applications
Headers: Authorization: Bearer JOBSEEKER_TOKEN
{
  "job": "JOB_ID_HERE",
  "coverLetter": "I am very interested in this position because...",
  "resumeUrl": "https://example.com/resume.pdf"
}

### Get My Applications
GET /api/applications?page=1&limit=10&status=pending
Headers: Authorization: Bearer JOBSEEKER_TOKEN

### Get Application by ID
GET /api/applications/{applicationId}
Headers: Authorization: Bearer TOKEN

### Update Application Status (Employer Only)
PUT /api/applications/{applicationId}
Headers: Authorization: Bearer EMPLOYER_TOKEN
{
  "status": "reviewed"
}

Status options: pending, reviewed, accepted, rejected

### Withdraw Application
DELETE /api/applications/{applicationId}
Headers: Authorization: Bearer JOBSEEKER_TOKEN

### Get Applications for Job (Employer Only)
GET /api/applications/job/{jobId}
Headers: Authorization: Bearer EMPLOYER_TOKEN

## 6. Saved Jobs

### Save a Job
POST /api/saved
Headers: Authorization: Bearer JOBSEEKER_TOKEN
{
  "job": "JOB_ID_HERE"
}

### Get Saved Jobs
GET /api/saved?page=1&limit=10
Headers: Authorization: Bearer JOBSEEKER_TOKEN

### Remove Saved Job
DELETE /api/saved/{jobId}
Headers: Authorization: Bearer JOBSEEKER_TOKEN

---

## Example Workflow

1. Register as Employer
2. Login and get token
3. Create Company profile
4. Create Job posting
5. Register as Job Seeker
6. Login and get token
7. Search for jobs
8. Save interesting jobs
9. Apply for jobs
10. Check application status

---

## Response Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error
