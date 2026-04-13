package middleware

import (
	"Booking/pkg/jwt"
	"context"
	"errors"
)

var ErrNoUserInContext = errors.New("no user found in context")

func GetUserFromContext(ctx context.Context) (*jwt.Claims, error) {
	claims, ok := ctx.Value(UserContextKey).(*jwt.Claims)
	if !ok {
		return nil, ErrNoUserInContext
	}
	return claims, nil
}

func GetUserID(ctx context.Context) uint64 {
	claims, err := GetUserFromContext(ctx)
	if err != nil {
		return 0
	}
	return claims.UserID
}
