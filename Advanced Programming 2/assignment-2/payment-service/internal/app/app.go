package app

import (
	"database/sql"
	"fmt"
	"net"

	_ "github.com/lib/pq"
	"google.golang.org/grpc"

	paymentv1 "github.com/azarenkov/ap2-gen/payment/v1"
	"payment-service/internal/repository/postgres"
	transportgrpc "payment-service/internal/transport/grpc"
	"payment-service/internal/usecase"
)

// Config holds the application configuration.
type Config struct {
	DSN      string
	GRPCPort string
}

// App wires all dependencies together (Composition Root).
type App struct {
	grpcServer *grpc.Server
	listener   net.Listener
}

// New builds and wires the entire application.
func New(cfg Config) (*App, error) {
	db, err := sql.Open("postgres", cfg.DSN)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	repo := postgres.New(db)
	ids := &uuidGenerator{}
	uc := usecase.New(repo, ids)

	paymentServer := transportgrpc.New(uc)

	// gRPC server with logging interceptor.
	grpcSrv := grpc.NewServer(
		grpc.UnaryInterceptor(transportgrpc.LoggingInterceptor),
	)
	paymentv1.RegisterPaymentServiceServer(grpcSrv, paymentServer)

	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		return nil, fmt.Errorf("listen: %w", err)
	}

	return &App{
		grpcServer: grpcSrv,
		listener:   lis,
	}, nil
}

// Run starts the gRPC server (blocking).
func (a *App) Run() error {
	return a.grpcServer.Serve(a.listener)
}
