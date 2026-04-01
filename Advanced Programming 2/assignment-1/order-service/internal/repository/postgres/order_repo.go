package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"order-service/internal/domain"
)

// OrderRepository is a PostgreSQL-backed implementation of the usecase.OrderRepository port.
type OrderRepository struct {
	db *sql.DB
}

// New creates an OrderRepository backed by the given *sql.DB.
func New(db *sql.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

// Save inserts a new order record.
func (r *OrderRepository) Save(ctx context.Context, o *domain.Order) error {
	o.CreatedAt = time.Now().UTC()
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO orders (id, customer_id, item_name, amount, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		o.ID, o.CustomerID, o.ItemName, o.Amount, o.Status, o.CreatedAt,
	)
	return err
}

// SaveWithIdempotencyKey inserts a new order together with its idempotency key atomically.
func (r *OrderRepository) SaveWithIdempotencyKey(ctx context.Context, o *domain.Order, key string) error {
	o.CreatedAt = time.Now().UTC()
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO orders (id, customer_id, item_name, amount, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		o.ID, o.CustomerID, o.ItemName, o.Amount, o.Status, o.CreatedAt,
	)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO idempotency_keys (key, order_id)
		VALUES ($1, $2)`,
		key, o.ID,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// FindByID retrieves an order by primary key.
func (r *OrderRepository) FindByID(ctx context.Context, id string) (*domain.Order, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, customer_id, item_name, amount, status, created_at
		FROM orders WHERE id = $1`, id)

	var o domain.Order
	err := row.Scan(&o.ID, &o.CustomerID, &o.ItemName, &o.Amount, &o.Status, &o.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &o, nil
}

// UpdateStatus sets a new status for the given order ID.
func (r *OrderRepository) UpdateStatus(ctx context.Context, id, status string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE orders SET status = $1 WHERE id = $2`, status, id)
	return err
}

// FindByIdempotencyKey returns the order associated with the given idempotency key.
func (r *OrderRepository) FindByIdempotencyKey(ctx context.Context, key string) (*domain.Order, error) {
	var orderID string
	err := r.db.QueryRowContext(ctx, `
		SELECT order_id FROM idempotency_keys WHERE key = $1`, key).Scan(&orderID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, orderID)
}
