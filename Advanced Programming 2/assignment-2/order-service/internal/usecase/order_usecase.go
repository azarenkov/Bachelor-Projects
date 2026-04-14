package usecase

import (
	"context"
	"errors"

	"order-service/internal/domain"
)

type OrderRepository interface {
	Save(ctx context.Context, o *domain.Order) error
	FindByID(ctx context.Context, id string) (*domain.Order, error)
	UpdateStatus(ctx context.Context, id, status string) error
	FindByIdempotencyKey(ctx context.Context, key string) (*domain.Order, error)
	SaveWithIdempotencyKey(ctx context.Context, o *domain.Order, key string) error
	FindRecent(ctx context.Context, limit int) ([]*domain.Order, error)
}

type PaymentResult struct {
	TransactionID string
	Status        string
}

type PaymentClient interface {
	Authorize(ctx context.Context, orderID string, amount int64) (*PaymentResult, error)
}

type IDGenerator interface {
	NewID() string
}

var ErrPaymentServiceUnavailable = errors.New("payment service unavailable")

type OrderUseCase struct {
	repo    OrderRepository
	payment PaymentClient
	ids     IDGenerator
}

func New(repo OrderRepository, payment PaymentClient, ids IDGenerator) *OrderUseCase {
	return &OrderUseCase{repo: repo, payment: payment, ids: ids}
}

func (uc *OrderUseCase) CreateOrder(ctx context.Context, customerID, itemName string, amount int64, idempotencyKey string) (*domain.Order, error) {
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

	if idempotencyKey != "" {
		if err := uc.repo.SaveWithIdempotencyKey(ctx, order, idempotencyKey); err != nil {
			return nil, err
		}
	} else {
		if err := uc.repo.Save(ctx, order); err != nil {
			return nil, err
		}
	}

	result, err := uc.payment.Authorize(ctx, order.ID, order.Amount)
	if err != nil {
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

func (uc *OrderUseCase) GetRecentOrders(ctx context.Context, limit int) ([]*domain.Order, error) {
	return uc.repo.FindRecent(ctx, limit)
}

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
