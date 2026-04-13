package http

import (
	"Booking/internal/application/usecases"
	"Booking/internal/domain/repository"
	"Booking/internal/middleware"
	"Booking/internal/presentation/http/admin"
	"Booking/internal/presentation/http/auth"
	"Booking/internal/presentation/http/bookings"
	"Booking/internal/presentation/http/hotels"
	"Booking/internal/presentation/http/rooms"
	"Booking/internal/presentation/http/users"
	"Booking/pkg/jwt"
	"log"
	"net/http"
)

func SetupRouter(
	userUseCase usecases.UserUseCase,
	hotelUseCase usecases.HotelUseCase,
	roomUseCase usecases.RoomUseCase,
	bookingUseCase usecases.BookingUseCase,
	jwtService jwt.JWTService,
	userRepo repository.UserRepository,
) http.Handler {
	authHandler := auth.NewHandler(userUseCase)
	usersHandler := users.NewHandler(userUseCase)
	adminHandler := admin.NewHandler()
	hotelsHandler := hotels.NewHandler(hotelUseCase)
	roomsHandler := rooms.NewHandler(roomUseCase)
	bookingsHandler := bookings.NewHandler(bookingUseCase)

	authMiddleware := middleware.NewAuthMiddleware(jwtService, userRepo)

	mux := http.NewServeMux()

	mux.HandleFunc("POST /auth/register", authHandler.Register)
	mux.HandleFunc("POST /auth/login", authHandler.Login)

	mux.Handle("GET /users/me", authMiddleware.Authenticate(
		http.HandlerFunc(usersHandler.GetProfile),
	))

	mux.Handle("GET /admin/dashboard", authMiddleware.Authenticate(
		authMiddleware.RequireRole("admin")(
			http.HandlerFunc(adminHandler.Dashboard),
		),
	))

	mux.HandleFunc("GET /hotels", hotelsHandler.GetAllHotels)
	mux.HandleFunc("GET /hotels/search", hotelsHandler.SearchHotels)
	mux.HandleFunc("POST /hotels/search", hotelsHandler.SearchHotelsPost)
	mux.HandleFunc("GET /hotels/{id}", hotelsHandler.GetHotel)

	mux.Handle("POST /hotels", authMiddleware.Authenticate(
		http.HandlerFunc(hotelsHandler.CreateHotel),
	))

	mux.Handle("GET /hotels/my", authMiddleware.Authenticate(
		http.HandlerFunc(hotelsHandler.GetMyHotels),
	))

	mux.Handle("PUT /hotels/{id}", authMiddleware.Authenticate(
		http.HandlerFunc(hotelsHandler.UpdateHotel),
	))

	mux.Handle("DELETE /hotels/{id}", authMiddleware.Authenticate(
		http.HandlerFunc(hotelsHandler.DeleteHotel),
	))

	mux.HandleFunc("GET /rooms/{id}", roomsHandler.GetRoom)
	mux.HandleFunc("GET /hotels/{hotelId}/rooms", roomsHandler.GetHotelRooms)
	mux.HandleFunc("GET /rooms/{id}/availability", roomsHandler.CheckAvailability)
	mux.HandleFunc("GET /hotels/{hotelId}/rooms/available", roomsHandler.SearchAvailableRooms)

	mux.Handle("POST /hotels/{hotelId}/rooms", authMiddleware.Authenticate(
		http.HandlerFunc(roomsHandler.CreateRoom),
	))

	mux.Handle("PUT /rooms/{id}", authMiddleware.Authenticate(
		http.HandlerFunc(roomsHandler.UpdateRoom),
	))

	mux.Handle("DELETE /rooms/{id}", authMiddleware.Authenticate(
		http.HandlerFunc(roomsHandler.DeleteRoom),
	))

	mux.Handle("POST /bookings", authMiddleware.Authenticate(
		http.HandlerFunc(bookingsHandler.CreateBooking),
	))

	mux.Handle("GET /bookings/{id}", authMiddleware.Authenticate(
		http.HandlerFunc(bookingsHandler.GetBooking),
	))

	mux.Handle("GET /bookings/my", authMiddleware.Authenticate(
		http.HandlerFunc(bookingsHandler.GetMyBookings),
	))

	mux.Handle("GET /hotels/{hotelId}/bookings", authMiddleware.Authenticate(
		http.HandlerFunc(bookingsHandler.GetHotelBookings),
	))

	mux.Handle("DELETE /bookings/{id}", authMiddleware.Authenticate(
		http.HandlerFunc(bookingsHandler.CancelBooking),
	))

	mux.Handle("PATCH /bookings/{id}/status", authMiddleware.Authenticate(
		http.HandlerFunc(bookingsHandler.UpdateBookingStatus),
	))

	log.Println("Router configured with all endpoints")
	return middleware.LoggingMiddleware(mux)
}
