package retry

import (
	"context"
	"errors"
	"log"
	"time"
)

type Policy struct {
	MaxAttempts    int
	InitialBackoff time.Duration
	Multiplier     float64
	MaxBackoff     time.Duration
}

func DefaultPolicy() Policy {
	return Policy{
		MaxAttempts:    3,
		InitialBackoff: 2 * time.Second,
		Multiplier:     2.0,
		MaxBackoff:     30 * time.Second,
	}
}

func (p Policy) Do(ctx context.Context, label string, op func(ctx context.Context) error) error {
	if p.MaxAttempts < 1 {
		p.MaxAttempts = 1
	}
	if p.Multiplier < 1.0 {
		p.Multiplier = 2.0
	}
	backoff := p.InitialBackoff

	var lastErr error
	for attempt := 1; attempt <= p.MaxAttempts; attempt++ {
		err := op(ctx)
		if err == nil {
			if attempt > 1 {
				log.Printf("%s: succeeded on attempt %d/%d", label, attempt, p.MaxAttempts)
			}
			return nil
		}
		lastErr = err
		if attempt == p.MaxAttempts {
			log.Printf("%s: failed after %d attempts: %v", label, attempt, err)
			break
		}
		log.Printf("%s: attempt %d/%d failed: %v — retrying in %s",
			label, attempt, p.MaxAttempts, err, backoff)
		select {
		case <-time.After(backoff):
		case <-ctx.Done():
			return errors.Join(lastErr, ctx.Err())
		}
		backoff = time.Duration(float64(backoff) * p.Multiplier)
		if backoff > p.MaxBackoff {
			backoff = p.MaxBackoff
		}
	}
	return lastErr
}
