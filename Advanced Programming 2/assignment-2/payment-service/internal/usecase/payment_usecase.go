package usecase

import (
	"context"
	"errors"

	"payment-service/internal/domain"
)

var ErrDuplicateOrder = errors.New("payment for this order already exists")

type PaymentRepository interface {
	Save(ctx context.Context, p *domain.Payment) error
	FindByOrderID(ctx context.Context, orderID string) (*domain.Payment, error)
}

type IDGenerator interface {
	NewID() string
}

type PaymentUseCase struct {
	repo PaymentRepository
	ids  IDGenerator
}

func New(repo PaymentRepository, ids IDGenerator) *PaymentUseCase {
	return &PaymentUseCase{repo: repo, ids: ids}
}

func (uc *PaymentUseCase) Authorize(ctx context.Context, orderID string, amount int64) (*domain.Payment, error) {
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

func (uc *PaymentUseCase) GetByOrderID(ctx context.Context, orderID string) (*domain.Payment, error) {
	return uc.repo.FindByOrderID(ctx, orderID)
}
