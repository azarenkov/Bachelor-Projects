package main

import (
	"log"
	"os"

	"payment-service/internal/app"
)

func main() {
	cfg := app.Config{
		DSN:  getEnv("PAYMENT_DB_DSN", "postgres://postgres:postgres@localhost:5432/payment_db?sslmode=disable"),
		Port: getEnv("PAYMENT_PORT", "8081"),
	}

	a, err := app.New(cfg)
	if err != nil {
		log.Fatalf("failed to initialise payment service: %v", err)
	}

	log.Printf("Payment Service listening on :%s", cfg.Port)
	if err := a.Run(); err != nil {
		log.Fatalf("payment service stopped: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return fallback
}
