package postgres

import (
	"Booking/internal/domain/entities"
	"Booking/internal/domain/repository"
	"errors"
	"time"

	"gorm.io/gorm"
)

type postgresBookingRepository struct {
	db *gorm.DB
}

func NewPostgresBookingRepository(db *gorm.DB) repository.BookingRepository {
	return &postgresBookingRepository{db: db}
}

func (r *postgresBookingRepository) Create(booking *entities.Booking) error {
	return r.db.Create(booking).Error
}

func (r *postgresBookingRepository) GetByID(id uint64) (*entities.Booking, error) {
	var booking entities.Booking
	err := r.db.Preload("User").Preload("Hotel").Preload("Room").First(&booking, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, repository.ErrBookingNotFound
		}
		return nil, err
	}
	return &booking, nil
}

func (r *postgresBookingRepository) GetByUserID(userID uint64) ([]entities.Booking, error) {
	var bookings []entities.Booking
	err := r.db.Where("user_id = ?", userID).
		Preload("Hotel").
		Preload("Room").
		Order("created_at DESC").
		Find(&bookings).Error
	if err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *postgresBookingRepository) GetByHotelID(hotelID uint64) ([]entities.Booking, error) {
	var bookings []entities.Booking
	err := r.db.Where("hotel_id = ?", hotelID).
		Preload("User").
		Preload("Room").
		Order("created_at DESC").
		Find(&bookings).Error
	if err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *postgresBookingRepository) Update(booking *entities.Booking) error {
	result := r.db.Model(booking).Updates(booking)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return repository.ErrBookingNotFound
	}
	return nil
}

func (r *postgresBookingRepository) Cancel(id uint64) error {
	result := r.db.Model(&entities.Booking{}).
		Where("id = ?", id).
		Update("status", entities.BookingStatusCancelled)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return repository.ErrBookingNotFound
	}
	return nil
}

func (r *postgresBookingRepository) CheckConflict(roomID uint64, checkIn, checkOut time.Time, excludeBookingID uint64) (bool, error) {
	var count int64
	query := r.db.Model(&entities.Booking{}).
		Where("room_id = ?", roomID).
		Where("status IN ?", []entities.BookingStatus{
			entities.BookingStatusPending,
			entities.BookingStatusConfirmed,
		}).
		Where("NOT (check_out <= ? OR check_in >= ?)", checkIn, checkOut)

	if excludeBookingID > 0 {
		query = query.Where("id != ?", excludeBookingID)
	}

	err := query.Count(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *postgresBookingRepository) GetActiveBookings(roomID uint64) ([]entities.Booking, error) {
	var bookings []entities.Booking
	err := r.db.Where("room_id = ?", roomID).
		Where("status IN ?", []entities.BookingStatus{
			entities.BookingStatusPending,
			entities.BookingStatusConfirmed,
		}).
		Where("check_out > ?", time.Now()).
		Order("check_in ASC").
		Find(&bookings).Error
	if err != nil {
		return nil, err
	}
	return bookings, nil
}
