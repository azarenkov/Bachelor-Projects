package domain

import "time"

// Payment statuses.
const (
	StatusAuthorized = "Authorized"
	StatusDeclined   = "Declined"
)

// MaxPaymentAmount is the ceiling above which payments are declined (in cents).
const MaxPaymentAmount int64 = 100000

// Payment is the core domain entity for the Payment bounded context.
type Payment struct {
	ID            string
	OrderID       string
	TransactionID string
	Amount        int64 // amount in cents
	Status        string
	CreatedAt     time.Time
}
