# Analytical Platform - Time Series Data Visualization

A comprehensive analytical platform built with Node.js, Express, MongoDB, and Chart.js for retrieving, analyzing, and visualizing time-series data.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)

## Features

- **Time-Series Data Retrieval**: Filter data by date range and specific fields
- **Statistical Metrics**: Calculate average, minimum, maximum, and standard deviation
- **Interactive Visualizations**: Line charts for single and multiple fields using Chart.js
- **Responsive Design**: Mobile-friendly user interface
- **RESTful API**: Clean and well-documented API endpoints
- **Error Handling**: Robust validation and error messages
- **Sample Data**: Automated seed script with realistic time-series data

## Technologies Used

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for time-series data
- **Mongoose**: MongoDB object modeling

### Frontend
- **HTML5/CSS3**: Modern web standards
- **JavaScript (ES6+)**: Client-side functionality
- **Chart.js**: Data visualization library

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js)

To verify installations:
```bash
node --version
npm --version
mongod --version
```

## Installation

### 1. Clone or Navigate to Project Directory

```bash
cd "Bachelor/WEB Technologies 2 (Back End)/assignment-4"
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- express
- mongoose
- cors
- dotenv
- nodemon (dev dependency)
