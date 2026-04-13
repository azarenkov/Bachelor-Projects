package usecases

import (
	"Booking/internal/domain/entities"
	"Booking/internal/domain/repository"
	"errors"
	"time"
)

var (
	ErrInvalidCheckInDate  = errors.New("check-in date must be in the future")
	ErrInvalidCheckOutDate = errors.New("check-out date must be after check-in date")
	ErrBookingConflict     = errors.New("room is not available for selected dates")
	ErrCannotCancelBooking = errors.New("cannot cancel booking in this status")
	ErrBookingNotOwned     = errors.New("you do not own this booking")
)

type BookingUseCase interface {
	CreateBooking(userID uint64, req entities.CreateBookingRequest) (*entities.BookingResponse, error)
	GetBookingByID(id, userID uint64) (*entities.BookingResponse, error)
	GetUserBookings(userID uint64) ([]entities.BookingResponse, error)
	GetHotelBookings(hotelID, ownerID uint64) ([]entities.BookingResponse, error)
	CancelBooking(bookingID, userID uint64) error
	UpdateBookingStatus(bookingID, ownerID uint64, status entities.BookingStatus) error
}

type bookingUseCase struct {
	bookingRepo repository.BookingRepository
	roomRepo    repository.RoomRepository
	hotelRepo   repository.HotelRepository
}

func NewBookingUseCase(
	bookingRepo repository.BookingRepository,
	roomRepo repository.RoomRepository,
	hotelRepo repository.HotelRepository,
) BookingUseCase {
	return &bookingUseCase{
		bookingRepo: bookingRepo,
		roomRepo:    roomRepo,
		hotelRepo:   hotelRepo,
	}
}

func (uc *bookingUseCase) CreateBooking(userID uint64, req entities.CreateBookingRequest) (*entities.BookingResponse, error) {
	checkIn, err := time.Parse("2006-01-02", req.CheckIn)
	if err != nil {
		return nil, errors.New("invalid check-in date format, use YYYY-MM-DD")
	}

	checkOut, err := time.Parse("2006-01-02", req.CheckOut)
	if err != nil {
		return nil, errors.New("invalid check-out date format, use YYYY-MM-DD")
	}

	if checkIn.Before(time.Now().Truncate(24 * time.Hour)) {
		return nil, ErrInvalidCheckInDate
	}

	if checkOut.Before(checkIn) || checkOut.Equal(checkIn) {
		return nil, ErrInvalidCheckOutDate
	}

	room, err := uc.roomRepo.GetByID(req.RoomID)
	if err != nil {
		return nil, err
	}

	if room.HotelID != req.HotelID {
		return nil, errors.New("room does not belong to this hotel")
	}

	if !room.Available {
		return nil, repository.ErrRoomNotAvailable
	}

	hasConflict, err := uc.bookingRepo.CheckConflict(req.RoomID, checkIn, checkOut, 0)
	if err != nil {
		return nil, err
	}

	if hasConflict {
		return nil, ErrBookingConflict
	}

	days := int(checkOut.Sub(checkIn).Hours() / 24)
	if days <= 0 {
		days = 1
	}
	totalPrice := room.PricePerDay * days

	booking := &entities.Booking{
		UserID:     userID,
		HotelID:    req.HotelID,
		RoomID:     req.RoomID,
		CheckIn:    checkIn,
		CheckOut:   checkOut,
		TotalPrice: totalPrice,
		Status:     entities.BookingStatusPending,
	}

	if err := uc.bookingRepo.Create(booking); err != nil {
		return nil, err
	}

	createdBooking, err := uc.bookingRepo.GetByID(booking.ID)
	if err != nil {
		return nil, err
	}

	return uc.toBookingResponse(createdBooking), nil
}

func (uc *bookingUseCase) GetBookingByID(id, userID uint64) (*entities.BookingResponse, error) {
	booking, err := uc.bookingRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if booking.UserID != userID {
		hotel, err := uc.hotelRepo.GetByID(booking.HotelID)
		if err != nil {
			return nil, err
		}

		if hotel.OwnerID != userID {
			return nil, ErrBookingNotOwned
		}
	}

	return uc.toBookingResponse(booking), nil
}

func (uc *bookingUseCase) GetUserBookings(userID uint64) ([]entities.BookingResponse, error) {
	bookings, err := uc.bookingRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	response := make([]entities.BookingResponse, len(bookings))
	for i, booking := range bookings {
		response[i] = *uc.toBookingResponse(&booking)
	}

	return response, nil
}

func (uc *bookingUseCase) GetHotelBookings(hotelID, ownerID uint64) ([]entities.BookingResponse, error) {
	hotel, err := uc.hotelRepo.GetByID(hotelID)
	if err != nil {
		return nil, err
	}

	if hotel.OwnerID != ownerID {
		return nil, repository.ErrUnauthorizedAccess
	}

	bookings, err := uc.bookingRepo.GetByHotelID(hotelID)
	if err != nil {
		return nil, err
	}

	response := make([]entities.BookingResponse, len(bookings))
	for i, booking := range bookings {
		response[i] = *uc.toBookingResponse(&booking)
	}

	return response, nil
}

func (uc *bookingUseCase) CancelBooking(bookingID, userID uint64) error {
	booking, err := uc.bookingRepo.GetByID(bookingID)
	if err != nil {
		return err
	}

	if booking.UserID != userID {
		return ErrBookingNotOwned
	}

	if booking.Status == entities.BookingStatusCancelled {
		return errors.New("booking is already cancelled")
	}

	if booking.Status == entities.BookingStatusCompleted {
		return ErrCannotCancelBooking
	}

	return uc.bookingRepo.Cancel(bookingID)
}

func (uc *bookingUseCase) UpdateBookingStatus(bookingID, ownerID uint64, status entities.BookingStatus) error {
	booking, err := uc.bookingRepo.GetByID(bookingID)
	if err != nil {
		return err
	}

	hotel, err := uc.hotelRepo.GetByID(booking.HotelID)
	if err != nil {
		return err
	}

	if hotel.OwnerID != ownerID {
		return repository.ErrUnauthorizedAccess
	}

	booking.Status = status
	return uc.bookingRepo.Update(booking)
}

func (uc *bookingUseCase) toBookingResponse(booking *entities.Booking) *entities.BookingResponse {
	response := &entities.BookingResponse{
		ID:         booking.ID,
		UserID:     booking.UserID,
		HotelID:    booking.HotelID,
		RoomID:     booking.RoomID,
		CheckIn:    booking.CheckIn,
		CheckOut:   booking.CheckOut,
		TotalPrice: booking.TotalPrice,
		Status:     booking.Status,
		CreatedAt:  booking.CreatedAt,
	}

	if booking.Hotel.ID != 0 {
		response.Hotel = &booking.Hotel
	}

	if booking.Room.ID != 0 {
		response.Room = &booking.Room
	}

	return response
}
