package hotels

import (
	"Booking/internal/application/usecases"
	"Booking/internal/domain/entities"
	"Booking/internal/middleware"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

type Handler struct {
	hotelUseCase usecases.HotelUseCase
}

func NewHandler(hotelUseCase usecases.HotelUseCase) *Handler {
	return &Handler{
		hotelUseCase: hotelUseCase,
	}
}

func (h *Handler) CreateHotel(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req entities.CreateHotelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	hotel, err := h.hotelUseCase.CreateHotel(userID, req)
	if err != nil {
		switch err {
		case usecases.ErrInvalidHotelName, usecases.ErrInvalidCity, usecases.ErrInvalidAddress:
			http.Error(w, err.Error(), http.StatusBadRequest)
		default:
			http.Error(w, "Failed to create hotel", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(hotel)
}

func (h *Handler) GetHotel(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid hotel ID", http.StatusBadRequest)
		return
	}

	hotel, err := h.hotelUseCase.GetHotelByID(id)
	if err != nil {
		http.Error(w, "Hotel not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hotel)
}

func (h *Handler) GetMyHotels(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	hotels, err := h.hotelUseCase.GetHotelsByOwner(userID)
	if err != nil {
		http.Error(w, "Failed to get hotels", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hotels)
}

func (h *Handler) UpdateHotel(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid hotel ID", http.StatusBadRequest)
		return
	}

	var req entities.UpdateHotelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	hotel, err := h.hotelUseCase.UpdateHotel(id, userID, req)
	if err != nil {
		switch err {
		case usecases.ErrHotelOwnerMismatch:
			http.Error(w, err.Error(), http.StatusForbidden)
		case usecases.ErrInvalidHotelName, usecases.ErrInvalidCity, usecases.ErrInvalidAddress:
			http.Error(w, err.Error(), http.StatusBadRequest)
		default:
			http.Error(w, "Failed to update hotel", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hotel)
}

func (h *Handler) DeleteHotel(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid hotel ID", http.StatusBadRequest)
		return
	}

	if err := h.hotelUseCase.DeleteHotel(id, userID); err != nil {
		switch err {
		case usecases.ErrHotelOwnerMismatch:
			http.Error(w, err.Error(), http.StatusForbidden)
		default:
			http.Error(w, "Failed to delete hotel", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) SearchHotels(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	minRatingStr := r.URL.Query().Get("min_rating")

	var minRating float64
	if minRatingStr != "" {
		var err error
		minRating, err = strconv.ParseFloat(minRatingStr, 64)
		if err != nil {
			http.Error(w, "Invalid min_rating parameter", http.StatusBadRequest)
			return
		}
	}

	req := entities.SearchHotelsRequest{
		City:      strings.TrimSpace(city),
		MinRating: minRating,
	}

	hotels, err := h.hotelUseCase.SearchHotels(req)
	if err != nil {
		http.Error(w, "Failed to search hotels", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hotels)
}

func (h *Handler) SearchHotelsPost(w http.ResponseWriter, r *http.Request) {
	var req entities.SearchHotelsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	hotels, err := h.hotelUseCase.SearchHotels(req)
	if err != nil {
		http.Error(w, "Failed to search hotels", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hotels)
}

func (h *Handler) GetAllHotels(w http.ResponseWriter, r *http.Request) {
	hotels, err := h.hotelUseCase.GetAllHotels()
	if err != nil {
		http.Error(w, "Failed to get hotels", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hotels)
}
