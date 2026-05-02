package main

import (
	"context"
	"errors"
	"log"
	"os"
	"os/signal"
	"syscall"

	"notification-service/internal/app"
)

func main() {
	cfg := app.Config{
		RabbitMQURL:       getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		FailOnEmailDomain: getEnv("NOTIFY_FAIL_DOMAIN", ""),
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

	log.Printf("notification-service started")

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
