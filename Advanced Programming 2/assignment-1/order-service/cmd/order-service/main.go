package main

import (
	"log"
	"os"

	"order-service/internal/app"
)

func main() {
	cfg := app.Config{
		DSN:            getEnv("ORDER_DB_DSN", "postgres://postgres:postgres@localhost:5432/order_db?sslmode=disable"),
		Port:           getEnv("ORDER_PORT", "8080"),
		PaymentBaseURL: getEnv("PAYMENT_BASE_URL", "http://localhost:8081"),
	}

	a, err := app.New(cfg)
	if err != nil {
		log.Fatalf("failed to initialise order service: %v", err)
	}

	log.Printf("Order Service listening on :%s", cfg.Port)
	if err := a.Run(); err != nil {
		log.Fatalf("order service stopped: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return fallback
}
