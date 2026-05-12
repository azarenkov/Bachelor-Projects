package domain

import (
	"errors"
	"time"
)

const (
	StatusPending   = "Pending"
	StatusPaid      = "Paid"
	StatusFailed    = "Failed"
	StatusCancelled = "Cancelled"
)

var (
	ErrOrderNotFound     = errors.New("order not found")
	ErrInvalidAmount     = errors.New("amount must be greater than 0")
	ErrCannotCancel      = errors.New("only Pending orders can be cancelled")
)

type Order struct {
	ID            string
	CustomerID    string
	ItemName      string
	Amount        int64
	CustomerEmail string
	Status        string
	CreatedAt     time.Time
}

func NewOrder(id, customerID, itemName, customerEmail string, amount int64) (*Order, error) {
	if amount <= 0 {
		return nil, ErrInvalidAmount
	}
	return &Order{
		ID:            id,
		CustomerID:    customerID,
		ItemName:      itemName,
		Amount:        amount,
		CustomerEmail: customerEmail,
		Status:        StatusPending,
	}, nil
}

func (o *Order) Cancel() error {
	if o.Status != StatusPending {
		return ErrCannotCancel
	}
	o.Status = StatusCancelled
	return nil
}
