package repository

import (
	"Booking/internal/domain/entities"
	"errors"
)

var (
	ErrHotelNotFound      = errors.New("hotel not found")
	ErrUnauthorizedAccess = errors.New("unauthorized access to hotel")
)

type HotelRepository interface {
	Create(hotel *entities.Hotel) error
	GetByID(id uint64) (*entities.Hotel, error)
	GetByOwnerID(ownerID uint64) ([]entities.Hotel, error)
	Update(hotel *entities.Hotel) error
	Delete(id uint64) error
	Search(city string, minRating float64) ([]entities.Hotel, error)
	GetAll() ([]entities.Hotel, error)
}
