package postgres

import (
	"Booking/internal/domain/entities"
	"Booking/internal/domain/repository"
	"errors"

	"gorm.io/gorm"
)

type postgresHotelRepository struct {
	db *gorm.DB
}

func NewPostgresHotelRepository(db *gorm.DB) repository.HotelRepository {
	return &postgresHotelRepository{db: db}
}

func (r *postgresHotelRepository) Create(hotel *entities.Hotel) error {
	return r.db.Create(hotel).Error
}

func (r *postgresHotelRepository) GetByID(id uint64) (*entities.Hotel, error) {
	var hotel entities.Hotel
	err := r.db.Preload("Owner").Preload("Rooms").First(&hotel, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, repository.ErrHotelNotFound
		}
		return nil, err
	}
	return &hotel, nil
}

func (r *postgresHotelRepository) GetByOwnerID(ownerID uint64) ([]entities.Hotel, error) {
	var hotels []entities.Hotel
	err := r.db.Where("owner_id = ?", ownerID).Preload("Rooms").Find(&hotels).Error
	if err != nil {
		return nil, err
	}
	return hotels, nil
}

func (r *postgresHotelRepository) Update(hotel *entities.Hotel) error {
	result := r.db.Model(hotel).Updates(hotel)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return repository.ErrHotelNotFound
	}
	return nil
}

func (r *postgresHotelRepository) Delete(id uint64) error {
	result := r.db.Delete(&entities.Hotel{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return repository.ErrHotelNotFound
	}
	return nil
}

func (r *postgresHotelRepository) Search(city string, minRating float64) ([]entities.Hotel, error) {
	var hotels []entities.Hotel
	query := r.db.Preload("Rooms")

	if city != "" {
		query = query.Where("LOWER(city) LIKE LOWER(?)", "%"+city+"%")
	}

	if minRating > 0 {
		query = query.Where("rating >= ?", minRating)
	}

	err := query.Find(&hotels).Error
	if err != nil {
		return nil, err
	}
	return hotels, nil
}

func (r *postgresHotelRepository) GetAll() ([]entities.Hotel, error) {
	var hotels []entities.Hotel
	err := r.db.Preload("Rooms").Find(&hotels).Error
	if err != nil {
		return nil, err
	}
	return hotels, nil
}
