package app

import (
	"database/sql"
	"fmt"
	"net"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"google.golang.org/grpc"

	orderv1 "github.com/azarenkov/ap2-gen/order/v1"
	"order-service/internal/repository/postgres"
	transportgrpc "order-service/internal/transport/grpc"
	transporthttp "order-service/internal/transport/http"
	"order-service/internal/usecase"
)

// Config holds the application configuration.
type Config struct {
	DSN             string
	Port            string
	GRPCPort        string
	PaymentGRPCAddr string
}

// App wires all dependencies together (Composition Root).
type App struct {
	httpServer *http.Server
	grpcServer *grpc.Server
	grpcPort   string
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

	paymentClient, err := transportgrpc.NewPaymentClient(cfg.PaymentGRPCAddr)
	if err != nil {
		return nil, fmt.Errorf("create payment gRPC client: %w", err)
	}

	repo := postgres.New(db)
	ids := &uuidGenerator{}
	uc := usecase.New(repo, paymentClient, ids)

	// HTTP server (Gin) — REST API for external clients.
	h := transporthttp.New(uc)
	router := gin.Default()
	h.RegisterRoutes(router)

	// gRPC server — streaming order updates.
	orderServer := transportgrpc.NewOrderServer(uc)
	grpcSrv := grpc.NewServer()
	orderv1.RegisterOrderServiceServer(grpcSrv, orderServer)

	return &App{
		httpServer: &http.Server{
			Addr:    ":" + cfg.Port,
			Handler: router,
		},
		grpcServer: grpcSrv,
		grpcPort:   cfg.GRPCPort,
	}, nil
}

// Run starts both the HTTP and gRPC servers (blocking).
func (a *App) Run(httpPort, grpcPort string) error {
	grpcLis, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		return fmt.Errorf("listen gRPC: %w", err)
	}

	var wg sync.WaitGroup
	errCh := make(chan error, 2)

	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := a.grpcServer.Serve(grpcLis); err != nil {
			errCh <- fmt.Errorf("gRPC server: %w", err)
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := a.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- fmt.Errorf("HTTP server: %w", err)
		}
	}()

	return <-errCh
}
