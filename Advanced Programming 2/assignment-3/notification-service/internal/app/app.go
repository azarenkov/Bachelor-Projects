package app

import (
	"context"
	"fmt"
	"log"
	"time"

	"notification-service/internal/idempotency"
	"notification-service/internal/notifier"
	"notification-service/internal/transport/rabbitmq"
)

type Config struct {
	RabbitMQURL       string
	FailOnEmailDomain string
}

type App struct {
	consumer *rabbitmq.Consumer
}

func New(cfg Config) (*App, error) {
	store := idempotency.NewStore()
	mailer := notifier.NewEmailSender(cfg.FailOnEmailDomain)

	consumer, err := dialConsumer(cfg.RabbitMQURL, mailer, store)
	if err != nil {
		return nil, err
	}

	return &App{consumer: consumer}, nil
}

func (a *App) Run(ctx context.Context) error {
	return a.consumer.Run(ctx)
}

func (a *App) Close() error {
	return a.consumer.Close()
}

func dialConsumer(url string, mailer *notifier.EmailSender, store *idempotency.Store) (*rabbitmq.Consumer, error) {
	var lastErr error
	for attempt := 1; attempt <= 30; attempt++ {
		c, err := rabbitmq.NewConsumer(url, mailer, store)
		if err == nil {
			return c, nil
		}
		lastErr = err
		log.Printf("rabbitmq connect attempt %d/30 failed: %v", attempt, err)
		time.Sleep(2 * time.Second)
	}
	return nil, fmt.Errorf("rabbitmq unreachable: %w", lastErr)
}
