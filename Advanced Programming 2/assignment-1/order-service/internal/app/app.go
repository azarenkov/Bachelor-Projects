package app

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"

	"order-service/internal/repository/postgres"
	transporthttp "order-service/internal/transport/http"
	"order-service/internal/usecase"
)

// Config holds the application configuration.
type Config struct {
	DSN            string
	Port           string
	PaymentBaseURL string
}

// App wires all dependencies together (Composition Root).
type App struct {
	server *http.Server
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

	// HTTP client for outbound calls – 2 s timeout as required by the spec.
	httpClient := &http.Client{Timeout: 2 * time.Second}

	repo := postgres.New(db)
	paymentClient := transporthttp.NewPaymentClient(cfg.PaymentBaseURL, httpClient)
	ids := &uuidGenerator{}
	uc := usecase.New(repo, paymentClient, ids)
	h := transporthttp.New(uc)

	router := gin.Default()
	h.RegisterRoutes(router)

	return &App{
		server: &http.Server{
			Addr:    ":" + cfg.Port,
			Handler: router,
		},
	}, nil
}

// Run starts the HTTP server (blocking).
func (a *App) Run() error {
	return a.server.ListenAndServe()
}
