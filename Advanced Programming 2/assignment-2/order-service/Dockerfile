FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /order-service ./cmd/order-service

FROM alpine:3.20
COPY --from=builder /order-service /order-service
ENTRYPOINT ["/order-service"]
