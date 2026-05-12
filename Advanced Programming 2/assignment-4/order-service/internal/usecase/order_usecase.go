package usecase

import (
	"context"
	"errors"
	"log"

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
	Authorize(ctx context.Context, orderID string, amount int64, customerEmail string) (*PaymentResult, error)
}

type IDGenerator interface {
	NewID() string
}

type OrderCache interface {
	GetOrder(ctx context.Context, id string) (*domain.Order, error)
	SetOrder(ctx context.Context, o *domain.Order) error
	Invalidate(ctx context.Context, id string) error
}

var (
	ErrPaymentServiceUnavailable = errors.New("payment service unavailable")
	ErrCacheMiss                 = errors.New("cache miss")
)

type OrderUseCase struct {
	repo    OrderRepository
	payment PaymentClient
	ids     IDGenerator
	cache   OrderCache
}

func New(repo OrderRepository, payment PaymentClient, ids IDGenerator, cache OrderCache) *OrderUseCase {
	return &OrderUseCase{repo: repo, payment: payment, ids: ids, cache: cache}
}

func (uc *OrderUseCase) CreateOrder(ctx context.Context, customerID, itemName, customerEmail string, amount int64, idempotencyKey string) (*domain.Order, error) {
	if idempotencyKey != "" {
		existing, err := uc.repo.FindByIdempotencyKey(ctx, idempotencyKey)
		if err == nil && existing != nil {
			return existing, nil
		}
	}

	order, err := domain.NewOrder(uc.ids.NewID(), customerID, itemName, customerEmail, amount)
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

	result, err := uc.payment.Authorize(ctx, order.ID, order.Amount, order.CustomerEmail)
	if err != nil {
		_ = uc.repo.UpdateStatus(ctx, order.ID, domain.StatusFailed)
		order.Status = domain.StatusFailed
		uc.invalidate(ctx, order.ID)
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

	uc.invalidate(ctx, order.ID)
	return order, nil
}

func (uc *OrderUseCase) GetOrder(ctx context.Context, id string) (*domain.Order, error) {
	if uc.cache != nil {
		cached, err := uc.cache.GetOrder(ctx, id)
		if err == nil && cached != nil {
			return cached, nil
		}
		if err != nil && !errors.Is(err, ErrCacheMiss) {
			log.Printf("order cache get failed (degrading to DB): id=%s err=%v", id, err)
		}
	}

	o, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if o == nil {
		return nil, domain.ErrOrderNotFound
	}

	if uc.cache != nil {
		if err := uc.cache.SetOrder(ctx, o); err != nil {
			log.Printf("order cache set failed: id=%s err=%v", id, err)
		}
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

	uc.invalidate(ctx, id)
	return o, nil
}

func (uc *OrderUseCase) invalidate(ctx context.Context, id string) {
	if uc.cache == nil {
		return
	}
	if err := uc.cache.Invalidate(ctx, id); err != nil {
		log.Printf("order cache invalidate failed: id=%s err=%v", id, err)
	}
}
