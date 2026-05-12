package app

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	orderv1 "github.com/azarenkov/ap2-gen/order/v1"
	"order-service/internal/cache"
	"order-service/internal/repository/postgres"
	transportgrpc "order-service/internal/transport/grpc"
	transporthttp "order-service/internal/transport/http"
	"order-service/internal/transport/http/middleware"
	"order-service/internal/usecase"
)

type Config struct {
	DSN             string
	Port            string
	GRPCPort        string
	PaymentGRPCAddr string
	RedisURL        string
	CacheTTL        time.Duration
	RateLimit       int
	RateLimitWindow time.Duration
}

type App struct {
	httpServer    *http.Server
	grpcServer    *grpc.Server
	db            *sql.DB
	paymentClient *transportgrpc.PaymentClient
	redis         *redis.Client
}

func New(cfg Config) (*App, error) {
	db, err := sql.Open("postgres", cfg.DSN)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping db: %w", err)
	}

	paymentClient, err := transportgrpc.NewPaymentClient(cfg.PaymentGRPCAddr)
	if err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("create payment gRPC client: %w", err)
	}

	rdb, err := dialRedis(cfg.RedisURL)
	if err != nil {
		_ = db.Close()
		_ = paymentClient.Close()
		return nil, fmt.Errorf("redis: %w", err)
	}

	orderCache := cache.NewRedisOrderCache(rdb, cfg.CacheTTL)
	limiter := middleware.NewRedisRateLimiter(rdb, cfg.RateLimit, cfg.RateLimitWindow)

	repo := postgres.New(db)
	ids := &uuidGenerator{}
	uc := usecase.New(repo, paymentClient, ids, orderCache)

	h := transporthttp.New(uc)
	router := gin.Default()
	if cfg.RateLimit > 0 {
		router.Use(limiter.Handler())
	}
	h.RegisterRoutes(router)

	orderServer := transportgrpc.NewOrderServer(uc)
	grpcSrv := grpc.NewServer()
	orderv1.RegisterOrderServiceServer(grpcSrv, orderServer)
	reflection.Register(grpcSrv)

	return &App{
		httpServer: &http.Server{
			Addr:    ":" + cfg.Port,
			Handler: router,
		},
		grpcServer:    grpcSrv,
		db:            db,
		paymentClient: paymentClient,
		redis:         rdb,
	}, nil
}

func (a *App) Run(httpPort, grpcPort string) error {
	grpcLis, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		return fmt.Errorf("listen gRPC: %w", err)
	}

	errCh := make(chan error, 2)

	go func() {
		if err := a.grpcServer.Serve(grpcLis); err != nil {
			errCh <- fmt.Errorf("gRPC server: %w", err)
		}
	}()

	go func() {
		if err := a.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- fmt.Errorf("HTTP server: %w", err)
		}
	}()

	return <-errCh
}

func (a *App) Shutdown(ctx context.Context) {
	stopped := make(chan struct{})
	go func() {
		a.grpcServer.GracefulStop()
		close(stopped)
	}()
	select {
	case <-stopped:
	case <-ctx.Done():
		a.grpcServer.Stop()
	}

	_ = a.httpServer.Shutdown(ctx)

	if a.paymentClient != nil {
		_ = a.paymentClient.Close()
	}
	if a.redis != nil {
		_ = a.redis.Close()
	}
	if a.db != nil {
		_ = a.db.Close()
	}
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
