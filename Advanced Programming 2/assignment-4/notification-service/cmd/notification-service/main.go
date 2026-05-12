package main

import (
	"context"
	"errors"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"notification-service/internal/app"
)

func main() {
	cfg := app.Config{
		RabbitMQURL:       getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		RedisURL:          getEnv("REDIS_URL", "redis://localhost:6379/0"),
		ProviderMode:      getEnv("PROVIDER_MODE", "SIMULATED"),
		FailOnEmailDomain: getEnv("NOTIFY_FAIL_DOMAIN", ""),
		FailureRate:       getEnvFloat("NOTIFY_FAILURE_RATE", 0),
		IdempotencyTTL:    getEnvDuration("NOTIFY_IDEMPOTENCY_TTL", 24*time.Hour),
		RetryMaxAttempts:  getEnvInt("RETRY_MAX_ATTEMPTS", 3),
		RetryInitial:      getEnvDuration("RETRY_INITIAL_BACKOFF", 2*time.Second),
		RetryMaxBackoff:   getEnvDuration("RETRY_MAX_BACKOFF", 30*time.Second),
		JobTimeout:        getEnvDuration("NOTIFY_JOB_TIMEOUT", 60*time.Second),
		SMTPHost:          getEnv("SMTP_HOST", ""),
		SMTPPort:          getEnv("SMTP_PORT", ""),
		SMTPUsername:      getEnv("SMTP_USERNAME", ""),
		SMTPPassword:      getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:          getEnv("SMTP_FROM", ""),
	}

	a, err := app.New(cfg)
	if err != nil {
		log.Fatalf("failed to initialise notification service: %v", err)
	}
	defer a.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	errCh := make(chan error, 1)
	go func() {
		errCh <- a.Run(ctx)
	}()

	log.Printf("notification-service started (provider=%s, retries=%d, initial=%s)",
		cfg.ProviderMode, cfg.RetryMaxAttempts, cfg.RetryInitial)

	select {
	case sig := <-sigCh:
		log.Printf("received signal %s, shutting down", sig)
		cancel()
		<-errCh
	case err := <-errCh:
		if err != nil && !errors.Is(err, context.Canceled) {
			log.Printf("notification service stopped with error: %v", err)
		}
	}

	log.Printf("notification service shutdown complete")
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		log.Printf("invalid %s=%q, using fallback %d", key, v, fallback)
		return fallback
	}
	return n
}

func getEnvFloat(key string, fallback float64) float64 {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback
	}
	n, err := strconv.ParseFloat(v, 64)
	if err != nil {
		log.Printf("invalid %s=%q, using fallback %f", key, v, fallback)
		return fallback
	}
	return n
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		log.Printf("invalid %s=%q, using fallback %s", key, v, fallback)
		return fallback
	}
	return d
}
