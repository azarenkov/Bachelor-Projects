FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /payment-service ./cmd/payment-service

FROM alpine:3.20
COPY --from=builder /payment-service /payment-service
ENTRYPOINT ["/payment-service"]
