package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"payment-service/internal/domain"
)

type PaymentRepository struct {
	db *sql.DB
}

func New(db *sql.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

func (r *PaymentRepository) Save(ctx context.Context, p *domain.Payment) error {
	query := `
		INSERT INTO payments (id, order_id, transaction_id, amount, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`
	p.CreatedAt = time.Now().UTC()
	_, err := r.db.ExecContext(ctx, query,
		p.ID, p.OrderID, p.TransactionID, p.Amount, p.Status, p.CreatedAt,
	)
	return err
}

func (r *PaymentRepository) FindByOrderID(ctx context.Context, orderID string) (*domain.Payment, error) {
	query := `
		SELECT id, order_id, transaction_id, amount, status, created_at
		FROM payments WHERE order_id = $1`
	row := r.db.QueryRowContext(ctx, query, orderID)

	var p domain.Payment
	err := row.Scan(&p.ID, &p.OrderID, &p.TransactionID, &p.Amount, &p.Status, &p.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}
