package entities

import (
	"time"
)

type User struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	Email        string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	Role         string    `gorm:"type:varchar(50);not null;default:'user'" json:"role"`
	PasswordHash string    `gorm:"type:varchar(255);not null;column:password_hash" json:"-"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type RegisterRequest struct {
	Name     string `json:"name" validate:"required,min=2,max=100"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
