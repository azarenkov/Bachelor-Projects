package repository

import (
	"Booking/internal/domain/entities"
	"errors"
	"time"
)

var (
	ErrBookingNotFound     = errors.New("booking not found")
	ErrBookingExists       = errors.New("booking already exists for this period")
	ErrInvalidBookingDates = errors.New("invalid booking dates")
)

type BookingRepository interface {
	Create(booking *entities.Booking) error
	GetByID(id uint64) (*entities.Booking, error)
	GetByUserID(userID uint64) ([]entities.Booking, error)
	GetByHotelID(hotelID uint64) ([]entities.Booking, error)
	Update(booking *entities.Booking) error
	Cancel(id uint64) error
	CheckConflict(roomID uint64, checkIn, checkOut time.Time, excludeBookingID uint64) (bool, error)
	GetActiveBookings(roomID uint64) ([]entities.Booking, error)
}
