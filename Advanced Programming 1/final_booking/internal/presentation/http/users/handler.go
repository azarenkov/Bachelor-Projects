package users

import (
	"Booking/internal/application/usecases"
	"Booking/internal/middleware"
	"encoding/json"
	"net/http"
)

type Handler struct {
	userUseCase usecases.UserUseCase
}

func NewHandler(userUseCase usecases.UserUseCase) *Handler {
	return &Handler{
		userUseCase: userUseCase,
	}
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	claims, err := middleware.GetUserFromContext(r.Context())
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := h.userUseCase.GetUserByID(claims.UserID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "user not found")
		return
	}

	respondWithJSON(w, http.StatusOK, user)
}

func respondWithJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func respondWithError(w http.ResponseWriter, statusCode int, message string) {
	respondWithJSON(w, statusCode, map[string]string{"error": message})
}
