-- migrations/001_create_orders.sql
CREATE TABLE IF NOT EXISTS orders (
    id          TEXT        PRIMARY KEY,
    customer_id TEXT        NOT NULL,
    item_name   TEXT        NOT NULL,
    amount      BIGINT      NOT NULL,
    status      TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    key      TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id)
);
