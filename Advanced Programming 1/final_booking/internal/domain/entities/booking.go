package entities

import "time"

type BookingStatus string

const (
	BookingStatusPending   BookingStatus = "pending"
	BookingStatusConfirmed BookingStatus = "confirmed"
	BookingStatusCancelled BookingStatus = "cancelled"
	BookingStatusCompleted BookingStatus = "completed"
)

type Booking struct {
	ID         uint64        `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     uint64        `gorm:"not null;index" json:"user_id"`
	HotelID    uint64        `gorm:"not null;index" json:"hotel_id"`
	RoomID     uint64        `gorm:"not null;index" json:"room_id"`
	CheckIn    time.Time     `gorm:"not null;index" json:"check_in"`
	CheckOut   time.Time     `gorm:"not null;index" json:"check_out"`
	TotalPrice int           `gorm:"not null" json:"total_price"`
	Status     BookingStatus `gorm:"type:varchar(50);not null;default:'pending';index" json:"status"`
	CreatedAt  time.Time     `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time     `gorm:"autoUpdateTime" json:"updated_at"`
	User       User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Hotel      Hotel         `gorm:"foreignKey:HotelID" json:"hotel,omitempty"`
	Room       Room          `gorm:"foreignKey:RoomID" json:"room,omitempty"`
}

type CreateBookingRequest struct {
	HotelID  uint64 `json:"hotel_id" validate:"required"`
	RoomID   uint64 `json:"room_id" validate:"required"`
	CheckIn  string `json:"check_in" validate:"required"`
	CheckOut string `json:"check_out" validate:"required"`
}

type BookingResponse struct {
	ID         uint64        `json:"id"`
	UserID     uint64        `json:"user_id"`
	HotelID    uint64        `json:"hotel_id"`
	RoomID     uint64        `json:"room_id"`
	CheckIn    time.Time     `json:"check_in"`
	CheckOut   time.Time     `json:"check_out"`
	TotalPrice int           `json:"total_price"`
	Status     BookingStatus `json:"status"`
	CreatedAt  time.Time     `json:"created_at"`
	Hotel      *Hotel        `json:"hotel,omitempty"`
	Room       *Room         `json:"room,omitempty"`
}
