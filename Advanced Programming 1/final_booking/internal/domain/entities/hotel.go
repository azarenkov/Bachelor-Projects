package entities

import "time"

type Hotel struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	OwnerID     uint64    `gorm:"not null;index" json:"owner_id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	City        string    `gorm:"type:varchar(100);not null;index" json:"city"`
	Address     string    `gorm:"type:varchar(255);not null" json:"address"`
	Rating      float64   `gorm:"type:decimal(2,1);default:0" json:"rating"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	Owner       User      `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Rooms       []Room    `gorm:"foreignKey:HotelID" json:"rooms,omitempty"`
}

type CreateHotelRequest struct {
	Name        string `json:"name" validate:"required,min=3,max=255"`
	Description string `json:"description"`
	City        string `json:"city" validate:"required,min=2,max=100"`
	Address     string `json:"address" validate:"required,min=5,max=255"`
}

type UpdateHotelRequest struct {
	Name        string `json:"name" validate:"min=3,max=255"`
	Description string `json:"description"`
	City        string `json:"city" validate:"min=2,max=100"`
	Address     string `json:"address" validate:"min=5,max=255"`
}

type SearchHotelsRequest struct {
	City      string  `json:"city"`
	CheckIn   string  `json:"check_in"`
	CheckOut  string  `json:"check_out"`
	MinPrice  int     `json:"min_price"`
	MaxPrice  int     `json:"max_price"`
	MinRating float64 `json:"min_rating"`
}
