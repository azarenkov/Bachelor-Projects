# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Cache dependency downloads separately from source compilation.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /payment-service ./cmd/payment-service

# ── Stage 2: minimal runtime image ──────────────────────────────────────────
FROM alpine:3.20

RUN apk add --no-cache ca-certificates

COPY --from=builder /payment-service /payment-service

EXPOSE 8081

ENTRYPOINT ["/payment-service"]
