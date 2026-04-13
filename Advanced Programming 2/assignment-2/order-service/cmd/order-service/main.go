package main

import (
	"log"
	"os"

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

	log.Printf("Order Service HTTP :%s  gRPC :%s", cfg.Port, cfg.GRPCPort)
	if err := a.Run(cfg.Port, cfg.GRPCPort); err != nil {
		log.Fatalf("order service stopped: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return fallback
}
