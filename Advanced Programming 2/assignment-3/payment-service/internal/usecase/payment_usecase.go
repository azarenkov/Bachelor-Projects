package usecase

import (
	"context"
	"errors"
	"log"
	"time"

	events "github.com/azarenkov/ap2-events"

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

type EventPublisher interface {
	PublishPaymentCompleted(ctx context.Context, evt events.PaymentCompletedEvent) error
}

type PaymentUseCase struct {
	repo      PaymentRepository
	ids       IDGenerator
	publisher EventPublisher
}

func New(repo PaymentRepository, ids IDGenerator, publisher EventPublisher) *PaymentUseCase {
	return &PaymentUseCase{repo: repo, ids: ids, publisher: publisher}
}

func (uc *PaymentUseCase) Authorize(ctx context.Context, orderID string, amount int64, customerEmail string) (*domain.Payment, error) {
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
		CustomerEmail: customerEmail,
		Status:        status,
	}

	if err := uc.repo.Save(ctx, p); err != nil {
		return nil, err
	}

	if uc.publisher != nil {
		evt := events.PaymentCompletedEvent{
			MessageID:     uc.ids.NewID(),
			OrderID:       p.OrderID,
			TransactionID: p.TransactionID,
			Amount:        p.Amount,
			CustomerEmail: p.CustomerEmail,
			Status:        p.Status,
			OccurredAt:    p.CreatedAt.UTC().Format(time.RFC3339),
		}
		if err := uc.publisher.PublishPaymentCompleted(ctx, evt); err != nil {
			log.Printf("publish payment.completed failed: order_id=%s err=%v", p.OrderID, err)
		}
	}

	return p, nil
}

func (uc *PaymentUseCase) GetByOrderID(ctx context.Context, orderID string) (*domain.Payment, error) {
	return uc.repo.FindByOrderID(ctx, orderID)
}
