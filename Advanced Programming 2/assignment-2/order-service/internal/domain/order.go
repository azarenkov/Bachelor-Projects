package domain

import (
	"errors"
	"time"
)

// Order statuses.
const (
	StatusPending   = "Pending"
	StatusPaid      = "Paid"
	StatusFailed    = "Failed"
	StatusCancelled = "Cancelled"
)

// Domain errors.
var (
	ErrOrderNotFound     = errors.New("order not found")
	ErrInvalidAmount     = errors.New("amount must be greater than 0")
	ErrCannotCancel      = errors.New("only Pending orders can be cancelled")
)

// Order is the core domain entity for the Order bounded context.
type Order struct {
	ID         string
	CustomerID string
	ItemName   string
	Amount     int64 // amount in cents
	Status     string
	CreatedAt  time.Time
}

// NewOrder creates a new Order in Pending state and validates invariants.
func NewOrder(id, customerID, itemName string, amount int64) (*Order, error) {
	if amount <= 0 {
		return nil, ErrInvalidAmount
	}
	return &Order{
		ID:         id,
		CustomerID: customerID,
		ItemName:   itemName,
		Amount:     amount,
		Status:     StatusPending,
	}, nil
}

// Cancel transitions the order to Cancelled.
// Business rule: only Pending orders can be cancelled.
func (o *Order) Cancel() error {
	if o.Status != StatusPending {
		return ErrCannotCancel
	}
	o.Status = StatusCancelled
	return nil
}
