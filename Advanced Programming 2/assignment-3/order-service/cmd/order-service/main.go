package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"order-service/internal/app"
)

func main() {
	cfg := app.Config{
		DSN:             getEnv("ORDER_DB_DSN", "postgres://postgres:postgres@localhost:5432/order_db?sslmode=disable"),
		Port:            getEnv("ORDER_PORT", "8080"),
		GRPCPort:        getEnv("ORDER_GRPC_PORT", "9090"),
		PaymentGRPCAddr: getEnv("PAYMENT_GRPC_ADDR", "localhost:9091"),
	}

	a, err := app.New(cfg)
	if err != nil {
		log.Fatalf("failed to initialise order service: %v", err)
	}

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	errCh := make(chan error, 1)
	go func() {
		log.Printf("Order Service HTTP :%s  gRPC :%s", cfg.Port, cfg.GRPCPort)
		errCh <- a.Run(cfg.Port, cfg.GRPCPort)
	}()

	select {
	case sig := <-sigCh:
		log.Printf("received signal %s, shutting down", sig)
	case err := <-errCh:
		if err != nil {
			log.Printf("order service stopped with error: %v", err)
		}
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	a.Shutdown(shutdownCtx)
	log.Printf("order service shutdown complete")
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return fallback
}
