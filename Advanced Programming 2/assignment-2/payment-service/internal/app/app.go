package app

import (
	"database/sql"
	"fmt"
	"net"

	_ "github.com/lib/pq"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	paymentv1 "github.com/azarenkov/ap2-gen/payment/v1"
	"payment-service/internal/repository/postgres"
	transportgrpc "payment-service/internal/transport/grpc"
	"payment-service/internal/usecase"
)

type Config struct {
	DSN      string
	GRPCPort string
}

type App struct {
	grpcServer *grpc.Server
	listener   net.Listener
}

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

	grpcSrv := grpc.NewServer(
		grpc.UnaryInterceptor(transportgrpc.LoggingInterceptor),
	)
	paymentv1.RegisterPaymentServiceServer(grpcSrv, paymentServer)
	reflection.Register(grpcSrv)

	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		return nil, fmt.Errorf("listen: %w", err)
	}

	return &App{
		grpcServer: grpcSrv,
		listener:   lis,
	}, nil
}

func (a *App) Run() error {
	return a.grpcServer.Serve(a.listener)
}
