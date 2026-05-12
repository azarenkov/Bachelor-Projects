package idempotency

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type Store interface {
	Has(ctx context.Context, key string) (bool, error)
	MarkProcessed(ctx context.Context, key string) (newlyProcessed bool, err error)
}

type InMemoryStore struct {
	mu   sync.Mutex
	seen map[string]struct{}
}

func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{seen: make(map[string]struct{})}
}

func (s *InMemoryStore) Has(_ context.Context, key string) (bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	_, ok := s.seen[key]
	return ok, nil
}

func (s *InMemoryStore) MarkProcessed(_ context.Context, key string) (bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.seen[key]; ok {
		return false, nil
	}
	s.seen[key] = struct{}{}
	return true, nil
}

type RedisStore struct {
	client *redis.Client
	ttl    time.Duration
	prefix string
}

func NewRedisStore(client *redis.Client, ttl time.Duration) *RedisStore {
	return &RedisStore{client: client, ttl: ttl, prefix: "notif:payment:"}
}

func (s *RedisStore) key(id string) string { return s.prefix + id }

func (s *RedisStore) Has(ctx context.Context, key string) (bool, error) {
	exists, err := s.client.Exists(ctx, s.key(key)).Result()
	if err != nil {
		return false, fmt.Errorf("redis exists: %w", err)
	}
	return exists == 1, nil
}

func (s *RedisStore) MarkProcessed(ctx context.Context, key string) (bool, error) {
	ok, err := s.client.SetNX(ctx, s.key(key), time.Now().UTC().Format(time.RFC3339), s.ttl).Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return false, fmt.Errorf("redis setnx: %w", err)
	}
	return ok, nil
}
