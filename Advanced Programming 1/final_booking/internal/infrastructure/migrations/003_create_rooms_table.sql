-- +goose Up
CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    hotel_id BIGINT NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    price_per_day INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rooms_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms(hotel_id);

-- +goose Down
DROP TABLE IF EXISTS rooms;
