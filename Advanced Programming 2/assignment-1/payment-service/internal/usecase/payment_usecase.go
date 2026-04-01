package usecase

import (
	"context"
	"errors"

	"payment-service/internal/domain"
)

// ErrDuplicateOrder is returned when a payment for the given order already exists.
var ErrDuplicateOrder = errors.New("payment for this order already exists")

// PaymentRepository is the port that the use case depends on.
type PaymentRepository interface {
	Save(ctx context.Context, p *domain.Payment) error
	FindByOrderID(ctx context.Context, orderID string) (*domain.Payment, error)
}

// IDGenerator generates unique string identifiers.
type IDGenerator interface {
	NewID() string
}

// PaymentUseCase holds the business logic for the Payment bounded context.
type PaymentUseCase struct {
	repo PaymentRepository
	ids  IDGenerator
}

// New creates a PaymentUseCase with its dependencies.
func New(repo PaymentRepository, ids IDGenerator) *PaymentUseCase {
	return &PaymentUseCase{repo: repo, ids: ids}
}

// Authorize validates the payment request and persists the result.
// Business rule: amounts > 100 000 cents are declined.
func (uc *PaymentUseCase) Authorize(ctx context.Context, orderID string, amount int64) (*domain.Payment, error) {
	// Idempotency: if a payment for this order already exists, return it.
	existing, err := uc.repo.FindByOrderID(ctx, orderID)
	if err == nil && existing != nil {
		return existing, nil
	}

	status := domain.StatusAuthorized
	if amount > domain.MaxPaymentAmount {
		status = domain.StatusDeclined
	}

	p := &domain.Payment{
		ID:            uc.ids.NewID(),
		OrderID:       orderID,
		TransactionID: uc.ids.NewID(),
		Amount:        amount,
		Status:        status,
	}

	if err := uc.repo.Save(ctx, p); err != nil {
		return nil, err
	}

	return p, nil
}

// GetByOrderID retrieves payment details for a given order.
func (uc *PaymentUseCase) GetByOrderID(ctx context.Context, orderID string) (*domain.Payment, error) {
	return uc.repo.FindByOrderID(ctx, orderID)
}
