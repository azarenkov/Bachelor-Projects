package bookings

import (
	"Booking/internal/application/usecases"
	"Booking/internal/domain/entities"
	"Booking/internal/middleware"
	"encoding/json"
	"net/http"
	"strconv"
)

type Handler struct {
	bookingUseCase usecases.BookingUseCase
}

func NewHandler(bookingUseCase usecases.BookingUseCase) *Handler {
	return &Handler{
		bookingUseCase: bookingUseCase,
	}
}

func (h *Handler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req entities.CreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	booking, err := h.bookingUseCase.CreateBooking(userID, req)
	if err != nil {
		switch err {
		case usecases.ErrInvalidCheckInDate, usecases.ErrInvalidCheckOutDate:
			http.Error(w, err.Error(), http.StatusBadRequest)
		case usecases.ErrBookingConflict:
			http.Error(w, err.Error(), http.StatusConflict)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(booking)
}

func (h *Handler) GetBooking(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid booking ID", http.StatusBadRequest)
		return
	}

	booking, err := h.bookingUseCase.GetBookingByID(id, userID)
	if err != nil {
		switch err {
		case usecases.ErrBookingNotOwned:
			http.Error(w, err.Error(), http.StatusForbidden)
		default:
			http.Error(w, "Booking not found", http.StatusNotFound)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(booking)
}

func (h *Handler) GetMyBookings(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	bookings, err := h.bookingUseCase.GetUserBookings(userID)
	if err != nil {
		http.Error(w, "Failed to get bookings", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bookings)
}

func (h *Handler) GetHotelBookings(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	hotelIDStr := r.PathValue("hotelId")
	hotelID, err := strconv.ParseUint(hotelIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid hotel ID", http.StatusBadRequest)
		return
	}

	bookings, err := h.bookingUseCase.GetHotelBookings(hotelID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bookings)
}

func (h *Handler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid booking ID", http.StatusBadRequest)
		return
	}

	if err := h.bookingUseCase.CancelBooking(id, userID); err != nil {
		switch err {
		case usecases.ErrBookingNotOwned:
			http.Error(w, err.Error(), http.StatusForbidden)
		case usecases.ErrCannotCancelBooking:
			http.Error(w, err.Error(), http.StatusBadRequest)
		default:
			http.Error(w, "Failed to cancel booking", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UpdateBookingStatus(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid booking ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Status entities.BookingStatus `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.bookingUseCase.UpdateBookingStatus(id, userID, req.Status); err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
