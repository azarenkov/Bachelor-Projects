package postgres

import (
	"Booking/internal/domain/entities"
	"Booking/internal/domain/repository"
	"errors"

	"gorm.io/gorm"
)

type PostgresUserRepository struct {
	db *gorm.DB
}

func NewPostgresUserRepository(db *gorm.DB) repository.UserRepository {
	return &PostgresUserRepository{db: db}
}

func (r *PostgresUserRepository) Create(user *entities.User) error {
	result := r.db.Create(user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
			return repository.ErrUserAlreadyExists
		}
		return result.Error
	}
	return nil
}

func (r *PostgresUserRepository) GetByEmail(email string) (*entities.User, error) {
	var user entities.User
	result := r.db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, repository.ErrUserNotFound
		}
		return nil, result.Error
	}
	return &user, nil
}

func (r *PostgresUserRepository) GetByID(id uint64) (*entities.User, error) {
	var user entities.User
	result := r.db.First(&user, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, repository.ErrUserNotFound
		}
		return nil, result.Error
	}
	return &user, nil
}
