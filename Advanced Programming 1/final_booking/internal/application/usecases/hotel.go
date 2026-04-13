package usecases

import (
	"Booking/internal/domain/entities"
	"Booking/internal/domain/repository"
	"errors"
	"strings"
)

var (
	ErrInvalidHotelName   = errors.New("hotel name must be at least 3 characters long")
	ErrInvalidCity        = errors.New("city must be at least 2 characters long")
	ErrInvalidAddress     = errors.New("address must be at least 5 characters long")
	ErrHotelOwnerMismatch = errors.New("you are not the owner of this hotel")
)

type HotelUseCase interface {
	CreateHotel(ownerID uint64, req entities.CreateHotelRequest) (*entities.Hotel, error)
	GetHotelByID(id uint64) (*entities.Hotel, error)
	GetHotelsByOwner(ownerID uint64) ([]entities.Hotel, error)
	UpdateHotel(hotelID, ownerID uint64, req entities.UpdateHotelRequest) (*entities.Hotel, error)
	DeleteHotel(hotelID, ownerID uint64) error
	SearchHotels(req entities.SearchHotelsRequest) ([]entities.Hotel, error)
	GetAllHotels() ([]entities.Hotel, error)
}

type hotelUseCase struct {
	hotelRepo repository.HotelRepository
}

func NewHotelUseCase(hotelRepo repository.HotelRepository) HotelUseCase {
	return &hotelUseCase{
		hotelRepo: hotelRepo,
	}
}

func (uc *hotelUseCase) CreateHotel(ownerID uint64, req entities.CreateHotelRequest) (*entities.Hotel, error) {
	if err := uc.validateCreateHotelRequest(req); err != nil {
		return nil, err
	}

	hotel := &entities.Hotel{
		OwnerID:     ownerID,
		Name:        strings.TrimSpace(req.Name),
		Description: strings.TrimSpace(req.Description),
		City:        strings.TrimSpace(req.City),
		Address:     strings.TrimSpace(req.Address),
		Rating:      0,
	}

	if err := uc.hotelRepo.Create(hotel); err != nil {
		return nil, err
	}

	return hotel, nil
}

func (uc *hotelUseCase) GetHotelByID(id uint64) (*entities.Hotel, error) {
	return uc.hotelRepo.GetByID(id)
}

func (uc *hotelUseCase) GetHotelsByOwner(ownerID uint64) ([]entities.Hotel, error) {
	return uc.hotelRepo.GetByOwnerID(ownerID)
}

func (uc *hotelUseCase) UpdateHotel(hotelID, ownerID uint64, req entities.UpdateHotelRequest) (*entities.Hotel, error) {
	hotel, err := uc.hotelRepo.GetByID(hotelID)
	if err != nil {
		return nil, err
	}

	if hotel.OwnerID != ownerID {
		return nil, ErrHotelOwnerMismatch
	}

	if req.Name != "" {
		if len(req.Name) < 3 {
			return nil, ErrInvalidHotelName
		}
		hotel.Name = strings.TrimSpace(req.Name)
	}

	if req.Description != "" {
		hotel.Description = strings.TrimSpace(req.Description)
	}

	if req.City != "" {
		if len(req.City) < 2 {
			return nil, ErrInvalidCity
		}
		hotel.City = strings.TrimSpace(req.City)
	}

	if req.Address != "" {
		if len(req.Address) < 5 {
			return nil, ErrInvalidAddress
		}
		hotel.Address = strings.TrimSpace(req.Address)
	}

	if err := uc.hotelRepo.Update(hotel); err != nil {
		return nil, err
	}

	return hotel, nil
}

func (uc *hotelUseCase) DeleteHotel(hotelID, ownerID uint64) error {
	hotel, err := uc.hotelRepo.GetByID(hotelID)
	if err != nil {
		return err
	}

	if hotel.OwnerID != ownerID {
		return ErrHotelOwnerMismatch
	}

	return uc.hotelRepo.Delete(hotelID)
}

func (uc *hotelUseCase) SearchHotels(req entities.SearchHotelsRequest) ([]entities.Hotel, error) {
	return uc.hotelRepo.Search(req.City, req.MinRating)
}

func (uc *hotelUseCase) GetAllHotels() ([]entities.Hotel, error) {
	return uc.hotelRepo.GetAll()
}

func (uc *hotelUseCase) validateCreateHotelRequest(req entities.CreateHotelRequest) error {
	if len(strings.TrimSpace(req.Name)) < 3 {
		return ErrInvalidHotelName
	}
	if len(strings.TrimSpace(req.City)) < 2 {
		return ErrInvalidCity
	}
	if len(strings.TrimSpace(req.Address)) < 5 {
		return ErrInvalidAddress
	}
	return nil
}
