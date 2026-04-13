package middleware

import (
	"Booking/internal/domain/repository"
	"Booking/pkg/jwt"
	"context"
	"net/http"
	"strings"
)

type contextKey string

const UserContextKey contextKey = "user"

type AuthMiddleware struct {
	jwtService jwt.JWTService
	userRepo   repository.UserRepository
}

func NewAuthMiddleware(jwtService jwt.JWTService, userRepo repository.UserRepository) *AuthMiddleware {
	return &AuthMiddleware{
		jwtService: jwtService,
		userRepo:   userRepo,
	}
}

func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "authorization header required", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "invalid authorization header format", http.StatusUnauthorized)
			return
		}

		token := parts[1]
		claims, err := m.jwtService.ValidateToken(token)
		if err != nil {
			http.Error(w, "invalid or expired token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (m *AuthMiddleware) RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(*jwt.Claims)
			if !ok {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			if claims.Role != role {
				http.Error(w, "forbidden: insufficient permissions", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
