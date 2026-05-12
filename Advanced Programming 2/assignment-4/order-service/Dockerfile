FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY gen/ /gen/
COPY order-service/go.mod order-service/go.sum ./
RUN go mod download
COPY order-service/ .
RUN go build -o /order-service ./cmd/order-service

FROM alpine:3.20
COPY --from=builder /order-service /order-service
ENTRYPOINT ["/order-service"]
