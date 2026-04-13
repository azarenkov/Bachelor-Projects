package rooms

import (
	"Booking/internal/application/usecases"
	"Booking/internal/domain/entities"
	"Booking/internal/middleware"
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

type Handler struct {
	roomUseCase usecases.RoomUseCase
}

func NewHandler(roomUseCase usecases.RoomUseCase) *Handler {
	return &Handler{
		roomUseCase: roomUseCase,
	}
}

func (h *Handler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	hotelIDStr := r.PathValue("hotelId")
	hotelID, err := strconv.ParseUint(hotelIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid hotel ID", http.StatusBadRequest)
		return
	}

	var req entities.CreateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	room, err := h.roomUseCase.CreateRoom(userID, hotelID, req)
	if err != nil {
		switch err {
		case usecases.ErrRoomOwnerMismatch:
			http.Error(w, err.Error(), http.StatusForbidden)
		case usecases.ErrInvalidRoomNumber, usecases.ErrInvalidRoomType, usecases.ErrInvalidPrice, usecases.ErrInvalidCapacity:
			http.Error(w, err.Error(), http.StatusBadRequest)
		default:
			http.Error(w, "Failed to create room", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(room)
}

func (h *Handler) GetRoom(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid room ID", http.StatusBadRequest)
		return
	}

	room, err := h.roomUseCase.GetRoomByID(id)
	if err != nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(room)
}

func (h *Handler) GetHotelRooms(w http.ResponseWriter, r *http.Request) {
	hotelIDStr := r.PathValue("hotelId")
	hotelID, err := strconv.ParseUint(hotelIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid hotel ID", http.StatusBadRequest)
		return
	}

	rooms, err := h.roomUseCase.GetRoomsByHotel(hotelID)
	if err != nil {
		http.Error(w, "Failed to get rooms", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rooms)
}

func (h *Handler) UpdateRoom(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid room ID", http.StatusBadRequest)
		return
	}

	var req entities.UpdateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	room, err := h.roomUseCase.UpdateRoom(id, userID, req)
	if err != nil {
		switch err {
		case usecases.ErrRoomOwnerMismatch:
			http.Error(w, err.Error(), http.StatusForbidden)
		case usecases.ErrInvalidRoomNumber, usecases.ErrInvalidRoomType, usecases.ErrInvalidPrice, usecases.ErrInvalidCapacity:
			http.Error(w, err.Error(), http.StatusBadRequest)
		default:
			http.Error(w, "Failed to update room", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(room)
}

func (h *Handler) DeleteRoom(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid room ID", http.StatusBadRequest)
		return
	}

	if err := h.roomUseCase.DeleteRoom(id, userID); err != nil {
		switch err {
		case usecases.ErrRoomOwnerMismatch:
			http.Error(w, err.Error(), http.StatusForbidden)
		default:
			http.Error(w, "Failed to delete room", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CheckAvailability(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid room ID", http.StatusBadRequest)
		return
	}

	checkInStr := r.URL.Query().Get("check_in")
	checkOutStr := r.URL.Query().Get("check_out")

	if checkInStr == "" || checkOutStr == "" {
		http.Error(w, "check_in and check_out are required", http.StatusBadRequest)
		return
	}

	checkIn, err := time.Parse("2006-01-02", checkInStr)
	if err != nil {
		http.Error(w, "Invalid check_in date format, use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	checkOut, err := time.Parse("2006-01-02", checkOutStr)
	if err != nil {
		http.Error(w, "Invalid check_out date format, use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	available, err := h.roomUseCase.CheckRoomAvailability(id, checkIn, checkOut)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := map[string]interface{}{
		"room_id":   id,
		"check_in":  checkInStr,
		"check_out": checkOutStr,
		"available": available,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) SearchAvailableRooms(w http.ResponseWriter, r *http.Request) {
	hotelIDStr := r.PathValue("hotelId")
	hotelID, err := strconv.ParseUint(hotelIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid hotel ID", http.StatusBadRequest)
		return
	}

	checkInStr := r.URL.Query().Get("check_in")
	checkOutStr := r.URL.Query().Get("check_out")

	if checkInStr == "" || checkOutStr == "" {
		http.Error(w, "check_in and check_out are required", http.StatusBadRequest)
		return
	}

	checkIn, err := time.Parse("2006-01-02", checkInStr)
	if err != nil {
		http.Error(w, "Invalid check_in date format, use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	checkOut, err := time.Parse("2006-01-02", checkOutStr)
	if err != nil {
		http.Error(w, "Invalid check_out date format, use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	rooms, err := h.roomUseCase.SearchAvailableRooms(hotelID, checkIn, checkOut)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rooms)
}
