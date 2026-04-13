-- +goose Up
CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    hotel_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_price INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    CONSTRAINT check_dates CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings(room_id, check_in, check_out);

-- +goose Down
DROP TABLE IF EXISTS bookings;
