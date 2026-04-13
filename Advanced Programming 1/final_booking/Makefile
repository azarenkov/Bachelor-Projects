.PHONY: help build run test clean docker-up docker-down migrate

help:
	@echo "Available commands:"
	@echo "  make build        - Build the application"
	@echo "  make run          - Run the application"
	@echo "  make test         - Run tests"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-up    - Start PostgreSQL with Docker Compose"
	@echo "  make docker-down  - Stop Docker Compose services"
	@echo "  make test-api     - Run API integration tests"
	@echo "  make lint         - Run linter"

build:
	@echo "Building application..."
	go build -o bin/booking ./cmd/main.go
	@echo "Build complete: bin/booking"

run:
	@echo "Starting application..."
	go run ./cmd/main.go

test:
	@echo "Running tests..."
	go test -v ./...

clean:
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	@echo "Clean complete"

docker-up:
	@echo "Starting PostgreSQL..."
	docker-compose up -d
	@echo "Waiting for PostgreSQL to be ready..."
	sleep 3
	@echo "PostgreSQL is ready"

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down
	@echo "Services stopped"

test-api:
	@echo "Running API tests..."
	./test_api.sh

lint:
	@echo "Running linter..."
	golangci-lint run ./...

mod-tidy:
	@echo "Tidying go modules..."
	go mod tidy

install-tools:
	@echo "Installing development tools..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "Tools installed"

deps:
	@echo "Downloading dependencies..."
	go mod download
	@echo "Dependencies downloaded"

fmt:
	@echo "Formatting code..."
	go fmt ./...
	@echo "Code formatted"

dev: docker-up
	@echo "Starting development environment..."
	@make run

all: clean deps build
	@echo "Build pipeline complete"
