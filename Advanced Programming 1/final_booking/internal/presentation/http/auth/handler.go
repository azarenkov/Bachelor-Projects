package auth

import (
	"Booking/internal/application/usecases"
	"Booking/internal/domain/entities"
	"Booking/internal/domain/repository"
	"encoding/json"
	"errors"
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

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req entities.RegisterRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid json")
		return
	}

	authResponse, err := h.userUseCase.Register(req)
	if err != nil {
		if errors.Is(err, repository.ErrUserAlreadyExists) {
			respondWithError(w, http.StatusConflict, "user with this email already exists")
			return
		}
		if errors.Is(err, usecases.ErrInvalidEmail) {
			respondWithError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, usecases.ErrWeakPassword) {
			respondWithError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, usecases.ErrInvalidName) {
			respondWithError(w, http.StatusBadRequest, err.Error())
			return
		}
		respondWithError(w, http.StatusInternalServerError, "failed to register user")
		return
	}

	respondWithJSON(w, http.StatusCreated, authResponse)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req entities.LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid json")
		return
	}

	authResponse, err := h.userUseCase.Login(req)
	if err != nil {
		if errors.Is(err, usecases.ErrInvalidCredentials) {
			respondWithError(w, http.StatusUnauthorized, "invalid email or password")
			return
		}
		respondWithError(w, http.StatusInternalServerError, "failed to login")
		return
	}

	respondWithJSON(w, http.StatusOK, authResponse)
}

func respondWithJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func respondWithError(w http.ResponseWriter, statusCode int, message string) {
	respondWithJSON(w, statusCode, map[string]string{"error": message})
}
