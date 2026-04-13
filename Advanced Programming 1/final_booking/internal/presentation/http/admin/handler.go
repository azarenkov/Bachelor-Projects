package admin

import (
	"net/http"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Welcome to admin dashboard!"))
}
