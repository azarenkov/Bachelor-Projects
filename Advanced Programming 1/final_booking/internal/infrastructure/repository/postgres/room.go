package postgres

import (
	"Booking/internal/domain/entities"
	"Booking/internal/domain/repository"
	"errors"
	"time"

	"gorm.io/gorm"
)

type postgresRoomRepository struct {
	db *gorm.DB
}

func NewPostgresRoomRepository(db *gorm.DB) repository.RoomRepository {
	return &postgresRoomRepository{db: db}
}

func (r *postgresRoomRepository) Create(room *entities.Room) error {
	return r.db.Create(room).Error
}

func (r *postgresRoomRepository) GetByID(id uint64) (*entities.Room, error) {
	var room entities.Room
	err := r.db.Preload("Hotel").First(&room, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, repository.ErrRoomNotFound
		}
		return nil, err
	}
	return &room, nil
}

func (r *postgresRoomRepository) GetByHotelID(hotelID uint64) ([]entities.Room, error) {
	var rooms []entities.Room
	err := r.db.Where("hotel_id = ?", hotelID).Find(&rooms).Error
	if err != nil {
		return nil, err
	}
	return rooms, nil
}

func (r *postgresRoomRepository) Update(room *entities.Room) error {
	result := r.db.Model(room).Updates(room)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return repository.ErrRoomNotFound
	}
	return nil
}

func (r *postgresRoomRepository) Delete(id uint64) error {
	result := r.db.Delete(&entities.Room{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return repository.ErrRoomNotFound
	}
	return nil
}

func (r *postgresRoomRepository) CheckAvailability(roomID uint64, checkIn, checkOut time.Time) (bool, error) {
	var count int64
	err := r.db.Model(&entities.Booking{}).
		Where("room_id = ?", roomID).
		Where("status IN ?", []entities.BookingStatus{
			entities.BookingStatusPending,
			entities.BookingStatusConfirmed,
		}).
		Where("NOT (check_out <= ? OR check_in >= ?)", checkIn, checkOut).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count == 0, nil
}

func (r *postgresRoomRepository) SearchAvailableRooms(hotelID uint64, checkIn, checkOut time.Time) ([]entities.Room, error) {
	var rooms []entities.Room

	subQuery := r.db.Model(&entities.Booking{}).
		Select("room_id").
		Where("hotel_id = ?", hotelID).
		Where("status IN ?", []entities.BookingStatus{
			entities.BookingStatusPending,
			entities.BookingStatusConfirmed,
		}).
		Where("NOT (check_out <= ? OR check_in >= ?)", checkIn, checkOut)

	err := r.db.Where("hotel_id = ?", hotelID).
		Where("available = ?", true).
		Where("id NOT IN (?)", subQuery).
		Find(&rooms).Error

	if err != nil {
		return nil, err
	}

	return rooms, nil
}
