package middleware

import (
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type RedisRateLimiter struct {
	client *redis.Client
	limit  int
	window time.Duration
	prefix string
}

func NewRedisRateLimiter(client *redis.Client, limit int, window time.Duration) *RedisRateLimiter {
	return &RedisRateLimiter{client: client, limit: limit, window: window, prefix: "ratelimit:"}
}

func (r *RedisRateLimiter) Handler() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if ip == "" {
			c.Next()
			return
		}
		key := r.prefix + ip
		ctx := c.Request.Context()

		count, err := r.client.Incr(ctx, key).Result()
		if err != nil {
			log.Printf("ratelimit incr failed for %s: %v (allowing request)", ip, err)
			c.Next()
			return
		}
		if count == 1 {
			if err := r.client.Expire(ctx, key, r.window).Err(); err != nil && !errors.Is(err, redis.Nil) {
				log.Printf("ratelimit expire failed for %s: %v", ip, err)
			}
		}

		c.Header("X-RateLimit-Limit", itoa(r.limit))
		c.Header("X-RateLimit-Remaining", itoa(max(0, r.limit-int(count))))

		if int(count) > r.limit {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "rate limit exceeded",
				"limit": r.limit,
				"window_seconds": int(r.window.Seconds()),
			})
			return
		}
		c.Next()
	}
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var b [20]byte
	pos := len(b)
	neg := false
	if n < 0 {
		neg = true
		n = -n
	}
	for n > 0 {
		pos--
		b[pos] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		pos--
		b[pos] = '-'
	}
	return string(b[pos:])
}
