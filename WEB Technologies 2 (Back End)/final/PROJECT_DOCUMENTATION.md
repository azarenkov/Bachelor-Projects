# Job Finding Platform - Project Documentation

## 1. Project Proposal

**Project Title:** Job Finding Platform API

**Topic:** A comprehensive job search and application platform built with Node.js, Express, and MongoDB. It connects job seekers with employers, allowing companies to post job listings and candidates to search and apply for positions.

**Why did you choose it?**
The job market needs efficient digital solutions to connect talent with opportunities. This platform addresses real-world needs by streamlining the hiring process for both employers and job seekers.

**Main Features:**
- User authentication with role-based access (Job Seeker, Employer, Admin)
- Job posting and management for employers
- Advanced job search and filtering for job seekers
- Application submission and tracking
- User profile management with resume upload
- Saved jobs functionality
- Application status updates
- Company profiles

**Team Members and Responsibilities:**
- Developer 1: Authentication, User Management
- Developer 2: Job Listings, Search & Filtering
- Developer 3: Applications, Company Profiles

---

## 2. Database Design (Schemas)

### User Collection
- username: String (required, unique)
- email: String (required, unique)
- password: String (required, hashed)
- role: String (jobseeker, employer, admin)
- firstName: String
- lastName: String
- phone: String
- location: String
- resumeUrl: String
- skills: [String]
- experience: String
- education: String
- createdAt: Date
- updatedAt: Date

### Company Collection
- name: String (required)
- description: String
- website: String
- industry: String
- size: String (1-10, 11-50, 51-200, 201-500, 501-1000, 1000+)
- location: String
- logo: String
- userId: ObjectId (reference to User)
- createdAt: Date
- updatedAt: Date

### Job Collection
- title: String (required)
- description: String (required)
- company: ObjectId (reference to Company)
- location: String
- type: String (full-time, part-time, contract, internship, remote)
- salary: { min: Number, max: Number, currency: String }
- requirements: [String]
- responsibilities: [String]
- skills: [String]
- status: String (active, closed, draft)
- postedBy: ObjectId (reference to User)
- applicationsCount: Number
- createdAt: Date
- updatedAt: Date

### Application Collection
- job: ObjectId (reference to Job)
- applicant: ObjectId (reference to User)
- status: String (pending, reviewed, accepted, rejected)
- coverLetter: String
- resumeUrl: String
- appliedAt: Date
- updatedAt: Date

### SavedJob Collection
- user: ObjectId (reference to User)
- job: ObjectId (reference to Job)
- savedAt: Date

---

## 3. API Endpoints List

### Auth
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user

### Users
- GET /api/users/profile - Get current user profile
- PUT /api/users/profile - Update user profile
- DELETE /api/users/profile - Delete user account

### Companies
- POST /api/companies - Create company profile (Employer only)
- GET /api/companies - Get all companies
- GET /api/companies/:id - Get company by ID
- PUT /api/companies/:id - Update company (Owner/Admin only)
- DELETE /api/companies/:id - Delete company (Owner/Admin only)

### Jobs
- POST /api/jobs - Create job posting (Employer only)
- GET /api/jobs - Get all jobs with filters
- GET /api/jobs/:id - Get job by ID
- PUT /api/jobs/:id - Update job (Owner/Admin only)
- DELETE /api/jobs/:id - Delete job (Owner/Admin only)
- GET /api/jobs/company/:companyId - Get jobs by company

### Applications
- POST /api/applications - Apply for a job (Job Seeker only)
- GET /api/applications - Get user's applications
- GET /api/applications/:id - Get application by ID
- PUT /api/applications/:id - Update application status (Employer/Admin)
- DELETE /api/applications/:id - Withdraw application
- GET /api/applications/job/:jobId - Get applications for a job (Employer/Admin)

### Saved Jobs
- POST /api/saved - Save a job
- GET /api/saved - Get user's saved jobs
- DELETE /api/saved/:jobId - Remove saved job

---

## 4. Folder Structure

```
job-finding/
├── app/
│   ├── config/
│   │   ├── auth.config.js
│   │   └── db.config.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── company.controller.js
│   │   ├── job.controller.js
│   │   ├── application.controller.js
│   │   └── saved.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── company.model.js
│   │   ├── job.model.js
│   │   ├── application.model.js
│   │   └── savedJob.model.js
│   └── routes/
│       ├── auth.routes.js
│       ├── user.routes.js
│       ├── company.routes.js
│       ├── job.routes.js
│       ├── application.routes.js
│       └── saved.routes.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── PROJECT_DOCUMENTATION.md
```

---

## 5. Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)

### Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd job-finding
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file:
```bash
cp .env.example .env
```

4. Update .env file with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job-finding
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

5. Start MongoDB:
```bash
mongod
```

6. Run the server:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

---

## 6. Usage Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "jobseeker"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Company (Employer)
```bash
curl -X POST http://localhost:5000/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Tech Company",
    "description": "Leading tech company",
    "industry": "Technology",
    "location": "New York"
  }'
```

### Create Job
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Software Engineer",
    "description": "We are looking for a skilled developer",
    "company": "COMPANY_ID",
    "location": "Remote",
    "type": "full-time",
    "skills": ["JavaScript", "Node.js", "MongoDB"]
  }'
```

### Search Jobs
```bash
curl -X GET "http://localhost:5000/api/jobs?search=developer&location=Remote&type=full-time"
```

### Apply for Job
```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "job": "JOB_ID",
    "coverLetter": "I am interested in this position..."
  }'
```

---

## 7. Technologies Used

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

---

## 8. Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- Protected routes with middleware
- Environment variables for sensitive data

---

## 9. Future Enhancements

- File upload for resumes and company logos
- Email notifications for applications
- Advanced search with Elasticsearch
- Real-time chat between employers and candidates
- Analytics dashboard
- Payment integration for premium features
- Social media authentication
- Rating and review system
