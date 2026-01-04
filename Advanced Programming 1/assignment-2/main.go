package main

import (
	"assignment-2/internal/server"
	"assignment-2/internal/store"
	"assignment-2/internal/worker"
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	dataStore := store.NewDataStore()

	statsWorker := worker.NewStatsWorker(dataStore)
	go statsWorker.Start()

	srv := server.NewServer(dataStore)
	httpServer := &http.Server{
		Addr:    ":8080",
		Handler: srv,
	}

	go func() {
		fmt.Println("Server starting on :8080")
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("Server error: %v\n", err)
			os.Exit(1)
		}
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan
	fmt.Println("\nShutdown signal received")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	statsWorker.Stop()

	fmt.Println("Shutting down HTTP server...")
	if err := httpServer.Shutdown(ctx); err != nil {
		fmt.Printf("Server shutdown error: %v\n", err)
	} else {
		fmt.Println("Server stopped gracefully")
	}

	select {
	case <-ctx.Done():
		if ctx.Err() == context.DeadlineExceeded {
			fmt.Println("Shutdown timeout exceeded")
		}
	default:
		fmt.Println("Shutdown complete")
	}
}
