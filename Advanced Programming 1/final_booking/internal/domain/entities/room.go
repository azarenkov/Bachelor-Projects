package entities

import "time"

type Room struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	HotelID     uint64    `gorm:"not null;index" json:"hotel_id"`
	RoomNumber  string    `gorm:"type:varchar(50);not null" json:"room_number"`
	Type        string    `gorm:"type:varchar(100);not null" json:"type"`
	Description string    `gorm:"type:text" json:"description"`
	PricePerDay int       `gorm:"not null" json:"price_per_day"`
	Capacity    int       `gorm:"not null" json:"capacity"`
	Available   bool      `gorm:"default:true" json:"available"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	Hotel       Hotel     `gorm:"foreignKey:HotelID" json:"hotel,omitempty"`
}

type CreateRoomRequest struct {
	RoomNumber  string `json:"room_number" validate:"required,min=1,max=50"`
	Type        string `json:"type" validate:"required,min=3,max=100"`
	Description string `json:"description"`
	PricePerDay int    `json:"price_per_day" validate:"required,min=1"`
	Capacity    int    `json:"capacity" validate:"required,min=1"`
}

type UpdateRoomRequest struct {
	RoomNumber  string `json:"room_number" validate:"min=1,max=50"`
	Type        string `json:"type" validate:"min=3,max=100"`
	Description string `json:"description"`
	PricePerDay int    `json:"price_per_day" validate:"min=1"`
	Capacity    int    `json:"capacity" validate:"min=1"`
	Available   *bool  `json:"available"`
}
