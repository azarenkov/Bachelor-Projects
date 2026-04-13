package repository

import (
	"Booking/internal/domain/entities"
	"errors"
)

var ErrUserNotFound = errors.New("user not found")
var ErrUserAlreadyExists = errors.New("user with this email already exists")

type UserRepository interface {
	Create(user *entities.User) error
	GetByEmail(email string) (*entities.User, error)
	GetByID(id uint64) (*entities.User, error)
}
