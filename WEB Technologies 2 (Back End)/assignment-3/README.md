# Blog CRUD API - Assignment 3

A fully functional CRUD (Create, Read, Update, Delete) API for a simple blogging platform built with Node.js, Express, and MongoDB.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Testing with Postman](#testing-with-postman)
- [Frontend Interface](#frontend-interface)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Features

### Backend Features
- RESTful API with full CRUD operations
- MongoDB database with Mongoose ODM
- Data validation and error handling
- Pagination and search functionality
- Sorting capabilities
- Blog statistics endpoint
- Automatic timestamps (createdAt, updatedAt)
- Comprehensive error messages with proper HTTP status codes

### Frontend Features
- Modern, responsive UI
- Create, read, update, and delete blog posts
- Real-time search functionality
- Sorting options
- Pagination
- Modal for detailed blog view
- Toast notifications
- Character counter
- Form validation
- Statistics dashboard

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Docker)
- **ODM:** Mongoose
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Validation:** Express-validator
- **Docker:** Docker Compose for MongoDB

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

## Installation

### Step 1: Clone or Navigate to the Project

```bash
cd "Bachelor/WEB Technologies 2 (Back End)/assignment-3"
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start MongoDB with Docker Compose

```bash
docker-compose up -d
```

This will start:
- MongoDB on port `27017`
- Mongo Express (Web UI) on port `8081`

### Step 4: Verify MongoDB is Running

```bash
docker-compose ps
```

You should see both `blog-mongodb` and `blog-mongo-express` containers running.

## Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000`

You should see output similar to:

```
MongoDB Connected: localhost
Database Name: blog_db
Server is running on port 3000
Frontend: http://localhost:3000
API: http://localhost:3000/api
MongoDB UI: http://localhost:8081
Environment: development
```

## API Endpoints

### Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/blogs` | Get all blog posts (with pagination, search, sort) | - |
| `GET` | `/blogs/:id` | Get single blog post by ID | - |
| `POST` | `/blogs` | Create a new blog post | `{ title, body, author? }` |
| `PUT` | `/blogs/:id` | Update blog post by ID | `{ title, body, author? }` |
| `DELETE` | `/blogs/:id` | Delete blog post by ID | - |
| `GET` | `/blogs/stats` | Get blog statistics | - |

### Query Parameters for GET /blogs

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort` - Sort field (default: -createdAt)
  - `-createdAt` - Newest first
  - `createdAt` - Oldest first
  - `title` - Title A-Z
  - `-title` - Title Z-A
- `search` - Search in title, body, or author

### Request Examples

#### Create Blog Post

```bash
POST http://localhost:3000/api/blogs
Content-Type: application/json

{
  "title": "My First Blog Post",
  "body": "This is the content of my first blog post. It needs to be at least 10 characters long.",
  "author": "John Doe"
}
```

#### Get All Blogs with Pagination

```bash
GET http://localhost:3000/api/blogs?page=1&limit=10&sort=-createdAt
```

#### Search Blogs

```bash
GET http://localhost:3000/api/blogs?search=javascript
```

#### Update Blog Post

```bash
PUT http://localhost:3000/api/blogs/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "title": "Updated Title",
  "body": "Updated content for the blog post.",
  "author": "Jane Doe"
}
```

#### Delete Blog Post

```bash
DELETE http://localhost:3000/api/blogs/507f1f77bcf86cd799439011
```

### Response Format

#### Success Response

```json
{
  "success": true,
  "message": "Blog post created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "My First Blog Post",
    "body": "This is the content...",
    "author": "John Doe",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Title is required",
      "param": "title"
    }
  ]
}
```

## Project Structure

```
assignment-3/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   └── blogController.js    # Blog CRUD operations logic
├── middleware/
│   └── errorHandler.js      # Global error handling middleware
├── models/
│   └── Blog.js              # Mongoose blog schema
├── public/
│   ├── css/
│   │   └── style.css        # Frontend styles
│   ├── js/
│   │   └── app.js           # Frontend JavaScript
│   └── index.html           # Main HTML page
├── routes/
│   └── blogRoutes.js        # API route definitions
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
├── docker-compose.yml       # Docker configuration
├── package.json            # Project dependencies
├── README.md               # This file
└── server.js               # Main application entry point
```

## Environment Variables

The `.env` file contains the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://admin:admin123@localhost:27017/blog_db?authSource=admin

# Server Configuration
PORT=3000
NODE_ENV=development

# Application Configuration
APP_NAME=Blog CRUD API
```

### MongoDB Credentials (Docker)

- **Username:** admin
- **Password:** admin123
- **Database:** blog_db
- **Port:** 27017

### Mongo Express (Web UI)

Access at: `http://localhost:8081`

- **Username:** admin
- **Password:** admin123
