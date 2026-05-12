FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY events/ /events/
COPY notification-service/go.mod notification-service/go.sum ./
RUN go mod download
COPY notification-service/ .
RUN go build -o /notification-service ./cmd/notification-service

FROM alpine:3.20
COPY --from=builder /notification-service /notification-service
ENTRYPOINT ["/notification-service"]
