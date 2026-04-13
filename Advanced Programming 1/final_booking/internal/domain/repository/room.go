package repository

import (
	"Booking/internal/domain/entities"
	"errors"
	"time"
)

var (
	ErrRoomNotFound     = errors.New("room not found")
	ErrRoomNotAvailable = errors.New("room not available for selected dates")
)

type RoomRepository interface {
	Create(room *entities.Room) error
	GetByID(id uint64) (*entities.Room, error)
	GetByHotelID(hotelID uint64) ([]entities.Room, error)
	Update(room *entities.Room) error
	Delete(id uint64) error
	CheckAvailability(roomID uint64, checkIn, checkOut time.Time) (bool, error)
	SearchAvailableRooms(hotelID uint64, checkIn, checkOut time.Time) ([]entities.Room, error)
}
