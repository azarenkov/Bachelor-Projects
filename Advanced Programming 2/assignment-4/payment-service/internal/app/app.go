package app

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net"
	"time"

	_ "github.com/lib/pq"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	paymentv1 "github.com/azarenkov/ap2-gen/payment/v1"
	"payment-service/internal/repository/postgres"
	transportgrpc "payment-service/internal/transport/grpc"
	"payment-service/internal/transport/rabbitmq"
	"payment-service/internal/usecase"
)

type Config struct {
	DSN         string
	GRPCPort    string
	RabbitMQURL string
}

type App struct {
	grpcServer *grpc.Server
	listener   net.Listener
	db         *sql.DB
	publisher  *rabbitmq.Publisher
}

func New(cfg Config) (*App, error) {
	db, err := openDB(cfg.DSN)
	if err != nil {
		return nil, err
	}

	publisher, err := dialRabbitMQ(cfg.RabbitMQURL)
	if err != nil {
		_ = db.Close()
		return nil, err
	}

	repo := postgres.New(db)
	ids := &uuidGenerator{}
	uc := usecase.New(repo, ids, publisher)

	paymentServer := transportgrpc.New(uc)

	grpcSrv := grpc.NewServer(
		grpc.UnaryInterceptor(transportgrpc.LoggingInterceptor),
	)
	paymentv1.RegisterPaymentServiceServer(grpcSrv, paymentServer)
	reflection.Register(grpcSrv)

	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		_ = db.Close()
		_ = publisher.Close()
		return nil, fmt.Errorf("listen: %w", err)
	}

	return &App{
		grpcServer: grpcSrv,
		listener:   lis,
		db:         db,
		publisher:  publisher,
	}, nil
}

func (a *App) Run() error {
	if err := a.grpcServer.Serve(a.listener); err != nil && !errors.Is(err, grpc.ErrServerStopped) {
		return err
	}
	return nil
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

	if a.publisher != nil {
		_ = a.publisher.Close()
	}
	if a.db != nil {
		_ = a.db.Close()
	}
}

func openDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping db: %w", err)
	}
	return db, nil
}

func dialRabbitMQ(url string) (*rabbitmq.Publisher, error) {
	var lastErr error
	for attempt := 1; attempt <= 30; attempt++ {
		pub, err := rabbitmq.NewPublisher(url)
		if err == nil {
			return pub, nil
		}
		lastErr = err
		log.Printf("rabbitmq connect attempt %d/30 failed: %v", attempt, err)
		time.Sleep(2 * time.Second)
	}
	return nil, fmt.Errorf("rabbitmq unreachable: %w", lastErr)
}
