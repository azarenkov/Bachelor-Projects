package cache

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"order-service/internal/domain"
)

var ErrCacheMiss = errors.New("cache miss")

type RedisOrderCache struct {
	client *redis.Client
	ttl    time.Duration
}

func NewRedisOrderCache(client *redis.Client, ttl time.Duration) *RedisOrderCache {
	return &RedisOrderCache{client: client, ttl: ttl}
}

type cachedOrder struct {
	ID            string `json:"id"`
	CustomerID    string `json:"customer_id"`
	ItemName      string `json:"item_name"`
	Amount        int64  `json:"amount"`
	CustomerEmail string `json:"customer_email"`
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
}

func keyOrder(id string) string { return "order:" + id }

func (c *RedisOrderCache) GetOrder(ctx context.Context, id string) (*domain.Order, error) {
	raw, err := c.client.Get(ctx, keyOrder(id)).Result()
	if errors.Is(err, redis.Nil) {
		return nil, ErrCacheMiss
	}
	if err != nil {
		return nil, fmt.Errorf("redis get: %w", err)
	}
	var co cachedOrder
	if err := json.Unmarshal([]byte(raw), &co); err != nil {
		return nil, fmt.Errorf("decode cached order: %w", err)
	}
	createdAt, _ := time.Parse(time.RFC3339, co.CreatedAt)
	return &domain.Order{
		ID:            co.ID,
		CustomerID:    co.CustomerID,
		ItemName:      co.ItemName,
		Amount:        co.Amount,
		CustomerEmail: co.CustomerEmail,
		Status:        co.Status,
		CreatedAt:     createdAt,
	}, nil
}

func (c *RedisOrderCache) SetOrder(ctx context.Context, o *domain.Order) error {
	co := cachedOrder{
		ID:            o.ID,
		CustomerID:    o.CustomerID,
		ItemName:      o.ItemName,
		Amount:        o.Amount,
		CustomerEmail: o.CustomerEmail,
		Status:        o.Status,
		CreatedAt:     o.CreatedAt.UTC().Format(time.RFC3339),
	}
	payload, err := json.Marshal(co)
	if err != nil {
		return fmt.Errorf("encode order: %w", err)
	}
	if err := c.client.Set(ctx, keyOrder(o.ID), payload, c.ttl).Err(); err != nil {
		return fmt.Errorf("redis set: %w", err)
	}
	return nil
}

func (c *RedisOrderCache) Invalidate(ctx context.Context, id string) error {
	if err := c.client.Del(ctx, keyOrder(id)).Err(); err != nil {
		return fmt.Errorf("redis del: %w", err)
	}
	return nil
}
