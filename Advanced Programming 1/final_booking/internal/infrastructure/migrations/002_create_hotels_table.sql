-- +goose Up
CREATE TABLE IF NOT EXISTS hotels (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    city VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    rating DECIMAL(2,1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hotels_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON hotels(owner_id);
CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);

-- +goose Down
DROP TABLE IF EXISTS hotels;
