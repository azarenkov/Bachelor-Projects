package server

import (
	"assignment-2/internal/store"
	"encoding/json"
	"net/http"
	"strings"
)

type Server struct {
	store *store.DataStore
	mux   *http.ServeMux
}

func NewServer(dataStore *store.DataStore) *Server {
	s := &Server{
		store: dataStore,
		mux:   http.NewServeMux(),
	}
	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	s.mux.HandleFunc("/data", s.handleData)
	s.mux.HandleFunc("/data/", s.handleDataWithKey)
	s.mux.HandleFunc("/stats", s.handleStats)
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.store.IncrementRequests()
	s.mux.ServeHTTP(w, r)
}

func (s *Server) handleData(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		s.handlePostData(w, r)
	case http.MethodGet:
		s.handleGetAllData(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleDataWithKey(w http.ResponseWriter, r *http.Request) {
	key := strings.TrimPrefix(r.URL.Path, "/data/")
	if key == "" {
		http.Error(w, "Key is required", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.handleGetData(w, r, key)
	case http.MethodDelete:
		s.handleDeleteData(w, r, key)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handlePostData(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Key == "" || req.Value == "" {
		http.Error(w, "Key and value are required", http.StatusBadRequest)
		return
	}

	s.store.Set(req.Key, req.Value)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"key":   req.Key,
		"value": req.Value,
	})
}

func (s *Server) handleGetAllData(w http.ResponseWriter, r *http.Request) {
	data := s.store.GetAll()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func (s *Server) handleGetData(w http.ResponseWriter, r *http.Request, key string) {
	value, exists := s.store.Get(key)
	if !exists {
		http.Error(w, "Key not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"key":   key,
		"value": value,
	})
}

func (s *Server) handleDeleteData(w http.ResponseWriter, r *http.Request, key string) {
	deleted := s.store.Delete(key)
	if !deleted {
		http.Error(w, "Key not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Key deleted successfully",
		"key":     key,
	})
}

func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	requests, keys, uptime := s.store.GetStats()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"requests":       requests,
		"keys":           keys,
		"uptime_seconds": uptime,
	})
}
