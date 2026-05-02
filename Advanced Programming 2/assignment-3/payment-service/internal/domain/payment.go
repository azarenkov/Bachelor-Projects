package domain

import "time"

const (
	StatusAuthorized = "Authorized"
	StatusDeclined   = "Declined"
)

const MaxPaymentAmount int64 = 100000

type Payment struct {
	ID            string
	OrderID       string
	TransactionID string
	Amount        int64
	CustomerEmail string
	Status        string
	CreatedAt     time.Time
}
