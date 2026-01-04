# Assignment 2: Concurrent HTTP Server in Go

A production-ready HTTP server implementation in Go featuring thread-safe in-memory storage, concurrent request handling, background workers, and graceful shutdown capabilities.

## Table of Contents

- [Project Structure](#project-structure)
- [Features](#features)
- [Installation](#installation)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Implementation Details](#implementation-details)
- [Graceful Shutdown](#graceful-shutdown)

## Project Structure

assignment-2/
├── go.mod
├── main.go                    # Entry point with graceful shutdown
├── internal/
│   ├── model/
│   │   └── store.go          # Generic Store[K,V] implementation
│   ├── store/
│   │   └── datastore.go      # DataStore with statistics
│   ├── worker/
│   │   └── stats.go          # Background worker
│   └── server/
│       └── server.go         # HTTP handlers and routing
└── README.md


## Features

### Part A: HTTP API (40%)
- **RESTful API** with 5 endpoints for CRUD operations
- **JSON request/response** handling
- **Proper HTTP status codes** (200, 201, 400, 404)
- **In-memory key-value storage**

### Part B: Concurrency & Thread Safety (25%)
- **Thread-safe operations** using `sync.RWMutex`
- **Atomic request counter** using `sync/atomic`
- **Safe concurrent access** to shared state
- **Race condition free**

### Part C: Background Worker & Channels (20%)
- **Periodic statistics printing** every 5 seconds
- **Channel-based communication** for control flow
- **Select statement** for multiplexing channels
- **Time.Ticker** for periodic execution

### Part D: Graceful Shutdown (10%)
- **Signal handling** (SIGINT, SIGTERM)
- **Clean worker termination**
- **HTTP server graceful shutdown**
- **In-flight request completion**
- **10-second shutdown timeout**

### Part E: Generics (5%)
- **Generic Store[K, V]** with type parameters
- **Type-safe operations** at compile time
- **Comparable keys, any values**
- **Reusable across different types**

## Installation

```bash
# Clone or navigate to the project directory
cd assignment-2

# Initialize Go modules (if needed)
go mod tidy

# Verify installation
go build
