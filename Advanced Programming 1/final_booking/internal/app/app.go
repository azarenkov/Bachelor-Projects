package app

import (
	"Booking/internal/application/usecases"
	"Booking/internal/infrastructure/repository/postgres"
	httpHandler "Booking/internal/presentation/http"
	"Booking/pkg/hasher"
	"Booking/pkg/jwt"
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

func Run() {
	postgres.InitDB()

	passwordService := hasher.NewPasswordService()
	jwtService := jwt.NewJWTService()

	userRepo := postgres.NewPostgresUserRepository(postgres.DB)
	hotelRepo := postgres.NewPostgresHotelRepository(postgres.DB)
	roomRepo := postgres.NewPostgresRoomRepository(postgres.DB)
	bookingRepo := postgres.NewPostgresBookingRepository(postgres.DB)

	userUseCase := usecases.NewUserUseCase(userRepo, passwordService, jwtService)
	hotelUseCase := usecases.NewHotelUseCase(hotelRepo)
	roomUseCase := usecases.NewRoomUseCase(roomRepo, hotelRepo)
	bookingUseCase := usecases.NewBookingUseCase(bookingRepo, roomRepo, hotelRepo)

	router := httpHandler.SetupRouter(
		userUseCase,
		hotelUseCase,
		roomUseCase,
		bookingUseCase,
		jwtService,
		userRepo,
	)

	mux := http.NewServeMux()

	fs := http.FileServer(http.Dir("./web"))
	mux.Handle("/", corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, "./web/index.html")
			return
		}
		if strings.HasPrefix(r.URL.Path, "/css/") || strings.HasPrefix(r.URL.Path, "/js/") {
			fs.ServeHTTP(w, r)
			return
		}
		router.ServeHTTP(w, r)
	})))

	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	serverErrors := make(chan error, 1)

	go func() {
		log.Println("Server started at :8080")
		log.Println("Web interface available at http://localhost:8080")
		log.Println("API available at http://localhost:8080/auth, /hotels, /rooms, /bookings")

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			serverErrors <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		log.Fatalf("Server failed to start: %v", err)
	case sig := <-quit:
		log.Printf("Received shutdown signal: %v", sig)
	}

	log.Println("Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	} else {
		log.Println("HTTP server stopped gracefully")
	}

	postgres.CloseDB()

	log.Println("Application shutdown complete")
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
