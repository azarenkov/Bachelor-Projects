package usecase

import (
	"context"
	"errors"

	"order-service/internal/domain"
)

// OrderRepository is the storage port.
type OrderRepository interface {
	Save(ctx context.Context, o *domain.Order) error
	FindByID(ctx context.Context, id string) (*domain.Order, error)
	UpdateStatus(ctx context.Context, id, status string) error
	FindByIdempotencyKey(ctx context.Context, key string) (*domain.Order, error)
	SaveWithIdempotencyKey(ctx context.Context, o *domain.Order, key string) error
}

// PaymentResult carries what the Payment Service returned.
type PaymentResult struct {
	TransactionID string
	Status        string // "Authorized" or "Declined"
}

// PaymentClient is the outbound HTTP port.
type PaymentClient interface {
	Authorize(ctx context.Context, orderID string, amount int64) (*PaymentResult, error)
}

// IDGenerator generates unique string identifiers.
type IDGenerator interface {
	NewID() string
}

// ErrPaymentServiceUnavailable is returned when the Payment Service cannot be reached.
var ErrPaymentServiceUnavailable = errors.New("payment service unavailable")

// OrderUseCase holds the business logic for the Order bounded context.
type OrderUseCase struct {
	repo    OrderRepository
	payment PaymentClient
	ids     IDGenerator
}

// New creates an OrderUseCase with its dependencies.
func New(repo OrderRepository, payment PaymentClient, ids IDGenerator) *OrderUseCase {
	return &OrderUseCase{repo: repo, payment: payment, ids: ids}
}

// CreateOrder creates an order, calls the Payment Service, and records the result.
func (uc *OrderUseCase) CreateOrder(ctx context.Context, customerID, itemName string, amount int64, idempotencyKey string) (*domain.Order, error) {
	// Idempotency: return the existing order if the key was already seen.
	if idempotencyKey != "" {
		existing, err := uc.repo.FindByIdempotencyKey(ctx, idempotencyKey)
		if err == nil && existing != nil {
			return existing, nil
		}
	}

	order, err := domain.NewOrder(uc.ids.NewID(), customerID, itemName, amount)
	if err != nil {
		return nil, err
	}

	// Persist the order in Pending state first.
	if idempotencyKey != "" {
		if err := uc.repo.SaveWithIdempotencyKey(ctx, order, idempotencyKey); err != nil {
			return nil, err
		}
	} else {
		if err := uc.repo.Save(ctx, order); err != nil {
			return nil, err
		}
	}

	// Call Payment Service.
	result, err := uc.payment.Authorize(ctx, order.ID, order.Amount)
	if err != nil {
		// Payment Service is unavailable – mark the order as Failed.
		_ = uc.repo.UpdateStatus(ctx, order.ID, domain.StatusFailed)
		order.Status = domain.StatusFailed
		return order, ErrPaymentServiceUnavailable
	}

	newStatus := domain.StatusPaid
	if result.Status != "Authorized" {
		newStatus = domain.StatusFailed
	}

	if err := uc.repo.UpdateStatus(ctx, order.ID, newStatus); err != nil {
		return nil, err
	}
	order.Status = newStatus

	return order, nil
}

// GetOrder retrieves an order by its ID.
func (uc *OrderUseCase) GetOrder(ctx context.Context, id string) (*domain.Order, error) {
	o, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if o == nil {
		return nil, domain.ErrOrderNotFound
	}
	return o, nil
}

// CancelOrder cancels an order if it is still Pending.
func (uc *OrderUseCase) CancelOrder(ctx context.Context, id string) (*domain.Order, error) {
	o, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if o == nil {
		return nil, domain.ErrOrderNotFound
	}

	if err := o.Cancel(); err != nil {
		return nil, err
	}

	if err := uc.repo.UpdateStatus(ctx, id, domain.StatusCancelled); err != nil {
		return nil, err
	}

	return o, nil
}
