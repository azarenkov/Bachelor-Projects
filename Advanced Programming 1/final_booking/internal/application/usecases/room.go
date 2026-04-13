package usecases

import (
	"Booking/internal/domain/entities"
	"Booking/internal/domain/repository"
	"errors"
	"strings"
	"time"
)

var (
	ErrInvalidRoomNumber = errors.New("room number is required")
	ErrInvalidRoomType   = errors.New("room type must be at least 3 characters long")
	ErrInvalidPrice      = errors.New("price per day must be greater than 0")
	ErrInvalidCapacity   = errors.New("capacity must be greater than 0")
	ErrRoomOwnerMismatch = errors.New("you are not the owner of this hotel")
	ErrInvalidDateRange  = errors.New("check-out date must be after check-in date")
)

type RoomUseCase interface {
	CreateRoom(ownerID, hotelID uint64, req entities.CreateRoomRequest) (*entities.Room, error)
	GetRoomByID(id uint64) (*entities.Room, error)
	GetRoomsByHotel(hotelID uint64) ([]entities.Room, error)
	UpdateRoom(roomID, ownerID uint64, req entities.UpdateRoomRequest) (*entities.Room, error)
	DeleteRoom(roomID, ownerID uint64) error
	CheckRoomAvailability(roomID uint64, checkIn, checkOut time.Time) (bool, error)
	SearchAvailableRooms(hotelID uint64, checkIn, checkOut time.Time) ([]entities.Room, error)
}

type roomUseCase struct {
	roomRepo  repository.RoomRepository
	hotelRepo repository.HotelRepository
}

func NewRoomUseCase(roomRepo repository.RoomRepository, hotelRepo repository.HotelRepository) RoomUseCase {
	return &roomUseCase{
		roomRepo:  roomRepo,
		hotelRepo: hotelRepo,
	}
}

func (uc *roomUseCase) CreateRoom(ownerID, hotelID uint64, req entities.CreateRoomRequest) (*entities.Room, error) {
	if err := uc.validateCreateRoomRequest(req); err != nil {
		return nil, err
	}

	hotel, err := uc.hotelRepo.GetByID(hotelID)
	if err != nil {
		return nil, err
	}

	if hotel.OwnerID != ownerID {
		return nil, ErrRoomOwnerMismatch
	}

	room := &entities.Room{
		HotelID:     hotelID,
		RoomNumber:  strings.TrimSpace(req.RoomNumber),
		Type:        strings.TrimSpace(req.Type),
		Description: strings.TrimSpace(req.Description),
		PricePerDay: req.PricePerDay,
		Capacity:    req.Capacity,
		Available:   true,
	}

	if err := uc.roomRepo.Create(room); err != nil {
		return nil, err
	}

	return room, nil
}

func (uc *roomUseCase) GetRoomByID(id uint64) (*entities.Room, error) {
	return uc.roomRepo.GetByID(id)
}

func (uc *roomUseCase) GetRoomsByHotel(hotelID uint64) ([]entities.Room, error) {
	return uc.roomRepo.GetByHotelID(hotelID)
}

func (uc *roomUseCase) UpdateRoom(roomID, ownerID uint64, req entities.UpdateRoomRequest) (*entities.Room, error) {
	room, err := uc.roomRepo.GetByID(roomID)
	if err != nil {
		return nil, err
	}

	hotel, err := uc.hotelRepo.GetByID(room.HotelID)
	if err != nil {
		return nil, err
	}

	if hotel.OwnerID != ownerID {
		return nil, ErrRoomOwnerMismatch
	}

	if req.RoomNumber != "" {
		if len(strings.TrimSpace(req.RoomNumber)) == 0 {
			return nil, ErrInvalidRoomNumber
		}
		room.RoomNumber = strings.TrimSpace(req.RoomNumber)
	}

	if req.Type != "" {
		if len(strings.TrimSpace(req.Type)) < 3 {
			return nil, ErrInvalidRoomType
		}
		room.Type = strings.TrimSpace(req.Type)
	}

	if req.Description != "" {
		room.Description = strings.TrimSpace(req.Description)
	}

	if req.PricePerDay > 0 {
		room.PricePerDay = req.PricePerDay
	}

	if req.Capacity > 0 {
		room.Capacity = req.Capacity
	}

	if req.Available != nil {
		room.Available = *req.Available
	}

	if err := uc.roomRepo.Update(room); err != nil {
		return nil, err
	}

	return room, nil
}

func (uc *roomUseCase) DeleteRoom(roomID, ownerID uint64) error {
	room, err := uc.roomRepo.GetByID(roomID)
	if err != nil {
		return err
	}

	hotel, err := uc.hotelRepo.GetByID(room.HotelID)
	if err != nil {
		return err
	}

	if hotel.OwnerID != ownerID {
		return ErrRoomOwnerMismatch
	}

	return uc.roomRepo.Delete(roomID)
}

func (uc *roomUseCase) CheckRoomAvailability(roomID uint64, checkIn, checkOut time.Time) (bool, error) {
	if checkOut.Before(checkIn) || checkOut.Equal(checkIn) {
		return false, ErrInvalidDateRange
	}

	return uc.roomRepo.CheckAvailability(roomID, checkIn, checkOut)
}

func (uc *roomUseCase) SearchAvailableRooms(hotelID uint64, checkIn, checkOut time.Time) ([]entities.Room, error) {
	if checkOut.Before(checkIn) || checkOut.Equal(checkIn) {
		return nil, ErrInvalidDateRange
	}

	return uc.roomRepo.SearchAvailableRooms(hotelID, checkIn, checkOut)
}

func (uc *roomUseCase) validateCreateRoomRequest(req entities.CreateRoomRequest) error {
	if len(strings.TrimSpace(req.RoomNumber)) == 0 {
		return ErrInvalidRoomNumber
	}
	if len(strings.TrimSpace(req.Type)) < 3 {
		return ErrInvalidRoomType
	}
	if req.PricePerDay <= 0 {
		return ErrInvalidPrice
	}
	if req.Capacity <= 0 {
		return ErrInvalidCapacity
	}
	return nil
}
