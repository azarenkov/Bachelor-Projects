package provider

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"sync"
	"time"

	events "github.com/azarenkov/ap2-events"
)

type MockSender struct {
	failOnEmailDomain string
	failureRate       float64
	minLatency        time.Duration
	maxLatency        time.Duration
	rng               *rand.Rand
	mu                sync.Mutex
}

type MockConfig struct {
	FailOnEmailDomain string
	FailureRate       float64
	MinLatency        time.Duration
	MaxLatency        time.Duration
}

func NewMockSender(cfg MockConfig) *MockSender {
	if cfg.MinLatency <= 0 {
		cfg.MinLatency = 50 * time.Millisecond
	}
	if cfg.MaxLatency < cfg.MinLatency {
		cfg.MaxLatency = cfg.MinLatency + 250*time.Millisecond
	}
	return &MockSender{
		failOnEmailDomain: cfg.FailOnEmailDomain,
		failureRate:       cfg.FailureRate,
		minLatency:        cfg.MinLatency,
		maxLatency:        cfg.MaxLatency,
		rng:               rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

func (m *MockSender) Name() string { return "mock" }

func (m *MockSender) Send(ctx context.Context, evt events.PaymentCompletedEvent) error {
	jitter := m.sleepRange()
	select {
	case <-time.After(jitter):
	case <-ctx.Done():
		return ctx.Err()
	}

	if m.failOnEmailDomain != "" && strings.HasSuffix(strings.ToLower(evt.CustomerEmail), "@"+strings.ToLower(m.failOnEmailDomain)) {
		return fmt.Errorf("simulated permanent error for poison email %s", evt.CustomerEmail)
	}

	if m.failureRate > 0 && m.roll() < m.failureRate {
		return errors.New("simulated transient provider error")
	}

	log.Printf("[Notification] Sent email to %s for Order #%s. Amount: $%.2f (status=%s, tx=%s)",
		evt.CustomerEmail,
		evt.OrderID,
		float64(evt.Amount)/100.0,
		evt.Status,
		evt.TransactionID,
	)
	return nil
}

func (m *MockSender) roll() float64 {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.rng.Float64()
}

func (m *MockSender) sleepRange() time.Duration {
	m.mu.Lock()
	defer m.mu.Unlock()
	span := m.maxLatency - m.minLatency
	if span <= 0 {
		return m.minLatency
	}
	return m.minLatency + time.Duration(m.rng.Int63n(int64(span)))
}
