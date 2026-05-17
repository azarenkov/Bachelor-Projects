package app

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"

	"notification-service/internal/idempotency"
	"notification-service/internal/provider"
	"notification-service/internal/retry"
	"notification-service/internal/transport/rabbitmq"
)

type Config struct {
	RabbitMQURL       string
	RedisURL          string
	ProviderMode      string
	FailOnEmailDomain string
	FailureRate       float64
	IdempotencyTTL    time.Duration
	RetryMaxAttempts  int
	RetryInitial      time.Duration
	RetryMaxBackoff   time.Duration
	JobTimeout        time.Duration
	Workers           int
	SMTPHost          string
	SMTPPort          string
	SMTPUsername      string
	SMTPPassword      string
	SMTPFrom          string
}

type App struct {
	consumer *rabbitmq.Consumer
	redis    *redis.Client
}

func New(cfg Config) (*App, error) {
	sender, err := buildSender(cfg)
	if err != nil {
		return nil, fmt.Errorf("build sender: %w", err)
	}
	log.Printf("notification provider: %s", sender.Name())

	rdb, err := dialRedis(cfg.RedisURL)
	if err != nil {
		return nil, fmt.Errorf("redis: %w", err)
	}

	store := idempotency.NewRedisStore(rdb, cfg.IdempotencyTTL)

	policy := retry.Policy{
		MaxAttempts:    cfg.RetryMaxAttempts,
		InitialBackoff: cfg.RetryInitial,
		Multiplier:     2.0,
		MaxBackoff:     cfg.RetryMaxBackoff,
	}

	consumer, err := dialConsumer(rabbitmq.Config{
		URL:         cfg.RabbitMQURL,
		Sender:      sender,
		Idempotency: store,
		Retry:       policy,
		JobTimeout:  cfg.JobTimeout,
		Workers:     cfg.Workers,
	})
	if err != nil {
		_ = rdb.Close()
		return nil, err
	}

	return &App{consumer: consumer, redis: rdb}, nil
}

func (a *App) Run(ctx context.Context) error {
	return a.consumer.Run(ctx)
}

func (a *App) Close() error {
	if err := a.consumer.Close(); err != nil {
		log.Printf("consumer close: %v", err)
	}
	if a.redis != nil {
		return a.redis.Close()
	}
	return nil
}

func buildSender(cfg Config) (provider.EmailSender, error) {
	mode := strings.ToUpper(strings.TrimSpace(cfg.ProviderMode))
	switch mode {
	case "", "SIMULATED", "MOCK":
		return provider.NewMockSender(provider.MockConfig{
			FailOnEmailDomain: cfg.FailOnEmailDomain,
			FailureRate:       cfg.FailureRate,
			MinLatency:        100 * time.Millisecond,
			MaxLatency:        400 * time.Millisecond,
		}), nil
	case "REAL", "SMTP":
		return provider.NewSMTPSender(provider.SMTPConfig{
			Host:     cfg.SMTPHost,
			Port:     cfg.SMTPPort,
			Username: cfg.SMTPUsername,
			Password: cfg.SMTPPassword,
			From:     cfg.SMTPFrom,
		})
	default:
		return nil, errors.New("unsupported PROVIDER_MODE: " + cfg.ProviderMode)
	}
}

func dialConsumer(cfg rabbitmq.Config) (*rabbitmq.Consumer, error) {
	var lastErr error
	for attempt := 1; attempt <= 30; attempt++ {
		c, err := rabbitmq.NewConsumer(cfg)
		if err == nil {
			return c, nil
		}
		lastErr = err
		log.Printf("rabbitmq connect attempt %d/30 failed: %v", attempt, err)
		time.Sleep(2 * time.Second)
	}
	return nil, fmt.Errorf("rabbitmq unreachable: %w", lastErr)
}

func dialRedis(url string) (*redis.Client, error) {
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}
	rdb := redis.NewClient(opts)
	var lastErr error
	for attempt := 1; attempt <= 30; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		err := rdb.Ping(ctx).Err()
		cancel()
		if err == nil {
			return rdb, nil
		}
		lastErr = err
		log.Printf("redis connect attempt %d/30 failed: %v", attempt, err)
		time.Sleep(2 * time.Second)
	}
	_ = rdb.Close()
	return nil, fmt.Errorf("redis unreachable: %w", lastErr)
}
