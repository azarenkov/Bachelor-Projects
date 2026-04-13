# API Examples - Curl Commands

This document contains curl command examples for testing the Booking Platform API.

## Setup

```bash
BASE_URL="http://localhost:8080"
```

---

## Authentication

### Register User

```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Login

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Profile

```bash
TOKEN="your_token_here"

curl -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Hotels

### Get All Hotels

```bash
curl -X GET "$BASE_URL/hotels"
```

### Search Hotels by City

```bash
curl -X GET "$BASE_URL/hotels/search?city=New%20York"
```

### Search Hotels by City and Rating

```bash
curl -X GET "$BASE_URL/hotels/search?city=New%20York&min_rating=4.0"
```

### Get Hotel by ID

```bash
curl -X GET "$BASE_URL/hotels/1"
```

### Create Hotel (Authenticated)

```bash
TOKEN="your_token_here"

curl -X POST "$BASE_URL/hotels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Grand Hotel",
    "description": "Luxury hotel in the city center",
    "city": "New York",
    "address": "123 Main Street"
  }'
```

### Get My Hotels (Authenticated)

```bash
TOKEN="your_token_here"

curl -X GET "$BASE_URL/hotels/my" \
  -H "Authorization: Bearer $TOKEN"
```

### Update Hotel (Authenticated, Owner Only)

```bash
TOKEN="your_token_here"
HOTEL_ID=1

curl -X PUT "$BASE_URL/hotels/$HOTEL_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Grand Hotel - Updated",
    "description": "Updated description",
    "city": "New York",
    "address": "123 Main Street"
  }'
```

### Delete Hotel (Authenticated, Owner Only)

```bash
TOKEN="your_token_here"
HOTEL_ID=1

curl -X DELETE "$BASE_URL/hotels/$HOTEL_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Rooms

### Get Room by ID

```bash
curl -X GET "$BASE_URL/rooms/1"
```

### Get All Rooms in Hotel

```bash
HOTEL_ID=1

curl -X GET "$BASE_URL/hotels/$HOTEL_ID/rooms"
```

### Check Room Availability

```bash
ROOM_ID=1

curl -X GET "$BASE_URL/rooms/$ROOM_ID/availability?check_in=2024-06-01&check_out=2024-06-05"
```

### Search Available Rooms in Hotel

```bash
HOTEL_ID=1

curl -X GET "$BASE_URL/hotels/$HOTEL_ID/rooms/available?check_in=2024-06-01&check_out=2024-06-05"
```

### Create Room (Authenticated, Hotel Owner Only)

```bash
TOKEN="your_token_here"
HOTEL_ID=1

curl -X POST "$BASE_URL/hotels/$HOTEL_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "room_number": "101",
    "type": "Deluxe Suite",
    "description": "Spacious suite with city view",
    "price_per_day": 150,
    "capacity": 2
  }'
```

### Update Room (Authenticated, Hotel Owner Only)

```bash
TOKEN="your_token_here"
ROOM_ID=1

curl -X PUT "$BASE_URL/rooms/$ROOM_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "room_number": "101A",
    "type": "Deluxe Suite",
    "description": "Updated description",
    "price_per_day": 175,
    "capacity": 2,
    "available": true
  }'
```

### Mark Room as Unavailable

```bash
TOKEN="your_token_here"
ROOM_ID=1

curl -X PUT "$BASE_URL/rooms/$ROOM_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "available": false
  }'
```

### Delete Room (Authenticated, Hotel Owner Only)

```bash
TOKEN="your_token_here"
ROOM_ID=1

curl -X DELETE "$BASE_URL/rooms/$ROOM_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Bookings

### Create Booking (Authenticated)

```bash
TOKEN="your_token_here"

curl -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "hotel_id": 1,
    "room_id": 1,
    "check_in": "2024-06-01",
    "check_out": "2024-06-05"
  }'
```

### Get Booking by ID (Authenticated)

```bash
TOKEN="your_token_here"
BOOKING_ID=1

curl -X GET "$BASE_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Get My Bookings (Authenticated)

```bash
TOKEN="your_token_here"

curl -X GET "$BASE_URL/bookings/my" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Hotel Bookings (Authenticated, Hotel Owner Only)

```bash
TOKEN="your_token_here"
HOTEL_ID=1

curl -X GET "$BASE_URL/hotels/$HOTEL_ID/bookings" \
  -H "Authorization: Bearer $TOKEN"
```

### Cancel Booking (Authenticated, Booking Owner Only)

```bash
TOKEN="your_token_here"
BOOKING_ID=1

curl -X DELETE "$BASE_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Update Booking Status (Authenticated, Hotel Owner Only)

#### Confirm Booking

```bash
TOKEN="your_token_here"
BOOKING_ID=1

curl -X PATCH "$BASE_URL/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "confirmed"
  }'
```

#### Mark as Completed

```bash
TOKEN="your_token_here"
BOOKING_ID=1

curl -X PATCH "$BASE_URL/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "completed"
  }'
```

---

## Complete User Flow Example

### 1. Register as Hotel Owner

```bash
OWNER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hotel Owner",
    "email": "owner@example.com",
    "password": "password123"
  }')

OWNER_TOKEN=$(echo "$OWNER_RESPONSE" | jq -r '.token')
echo "Owner Token: $OWNER_TOKEN"
```

### 2. Create Hotel

```bash
HOTEL_RESPONSE=$(curl -s -X POST "$BASE_URL/hotels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{
    "name": "Grand Hotel",
    "description": "Luxury hotel in the city center",
    "city": "New York",
    "address": "123 Main Street"
  }')

HOTEL_ID=$(echo "$HOTEL_RESPONSE" | jq -r '.id')
echo "Hotel ID: $HOTEL_ID"
```

### 3. Add Rooms to Hotel

```bash
ROOM_RESPONSE=$(curl -s -X POST "$BASE_URL/hotels/$HOTEL_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{
    "room_number": "101",
    "type": "Deluxe Suite",
    "description": "Spacious suite with city view",
    "price_per_day": 150,
    "capacity": 2
  }')

ROOM_ID=$(echo "$ROOM_RESPONSE" | jq -r '.id')
echo "Room ID: $ROOM_ID"
```

### 4. Register as Guest

```bash
GUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }')

GUEST_TOKEN=$(echo "$GUEST_RESPONSE" | jq -r '.token')
echo "Guest Token: $GUEST_TOKEN"
```

### 5. Search for Hotels

```bash
curl -X GET "$BASE_URL/hotels/search?city=New%20York" | jq '.'
```

### 6. Check Room Availability

```bash
curl -X GET "$BASE_URL/rooms/$ROOM_ID/availability?check_in=2024-06-01&check_out=2024-06-05" | jq '.'
```

### 7. Create Booking

```bash
BOOKING_RESPONSE=$(curl -s -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GUEST_TOKEN" \
  -d "{
    \"hotel_id\": $HOTEL_ID,
    \"room_id\": $ROOM_ID,
    \"check_in\": \"2024-06-01\",
    \"check_out\": \"2024-06-05\"
  }")

BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '.id')
echo "Booking ID: $BOOKING_ID"
```

### 8. Hotel Owner Views Bookings

```bash
curl -X GET "$BASE_URL/hotels/$HOTEL_ID/bookings" \
  -H "Authorization: Bearer $OWNER_TOKEN" | jq '.'
```

### 9. Hotel Owner Confirms Booking

```bash
curl -X PATCH "$BASE_URL/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{
    "status": "confirmed"
  }'
```

### 10. Guest Views Their Bookings

```bash
curl -X GET "$BASE_URL/bookings/my" \
  -H "Authorization: Bearer $GUEST_TOKEN" | jq '.'
```

---

## Testing Double Booking Protection

```bash
# First booking - should succeed
BOOKING1=$(curl -s -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GUEST_TOKEN" \
  -d "{
    \"hotel_id\": $HOTEL_ID,
    \"room_id\": $ROOM_ID,
    \"check_in\": \"2024-06-01\",
    \"check_out\": \"2024-06-05\"
  }")

echo "First booking: $BOOKING1"

# Second booking for same dates - should fail with 409 Conflict
curl -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GUEST_TOKEN" \
  -d "{
    \"hotel_id\": $HOTEL_ID,
    \"room_id\": $ROOM_ID,
    \"check_in\": \"2024-06-01\",
    \"check_out\": \"2024-06-05\"
  }"
```

---

## Error Cases

### Invalid Token

```bash
curl -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer invalid_token"
```

**Expected:** 401 Unauthorized

### Unauthorized Access

```bash
# Try to update hotel you don't own
curl -X PUT "$BASE_URL/hotels/999" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GUEST_TOKEN" \
  -d '{
    "name": "Hacked Hotel"
  }'
```

**Expected:** 403 Forbidden

### Invalid Date Format

```bash
curl -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GUEST_TOKEN" \
  -d '{
    "hotel_id": 1,
    "room_id": 1,
    "check_in": "01-06-2024",
    "check_out": "05-06-2024"
  }'
```

**Expected:** 400 Bad Request

### Check-in Date in Past

```bash
curl -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GUEST_TOKEN" \
  -d '{
    "hotel_id": 1,
    "room_id": 1,
    "check_in": "2020-01-01",
    "check_out": "2020-01-05"
  }'
```

**Expected:** 400 Bad Request

---

## Notes

- All dates must be in `YYYY-MM-DD` format
- JWT tokens expire after the configured time (check JWT_SECRET env)
- Use `jq` for pretty-printing JSON responses
- Replace `$BASE_URL`, `$TOKEN`, etc. with actual values
- For testing, use the provided `test_api.sh` script for automated flow