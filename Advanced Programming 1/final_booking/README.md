# Booking Platform

A comprehensive hotel booking platform built with Go and vanilla JavaScript, featuring user authentication, hotel management, room booking with availability checking, and protection against double bookings.

## Live Demo

The platform includes a modern, responsive web interface built with vanilla JavaScript, HTML5, and CSS3.

## Features

### For Users:
- User registration and login with JWT authentication
- Search hotels by city and rating
- View hotel and room details
- Create and cancel bookings
- View booking history

### For Hotel Owners:
- Add and manage hotels
- Add and manage rooms
- Control availability and pricing
- View booking list for their hotels
- Update booking status

### System Features:
- REST API
- Real-time availability checking
- Protection against double booking with database constraints
- Role-based access control
- Comprehensive logging
- PostgreSQL database with GORM

## Technology Stack

### Backend
- **Language**: Go 1.25
- **Database**: PostgreSQL 16
- **ORM**: GORM
- **Authentication**: JWT
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure, Presentation)

### Frontend
- **JavaScript**: Vanilla ES6+
- **HTML5** & **CSS3**
- **Design**: Modern, responsive, mobile-first
- **No frameworks** - Pure JavaScript for maximum performance

## Project Structure

```
booking/
├── cmd/
│   └── main.go
├── internal/
│   ├── app/
│   │   └── app.go
│   ├── application/
│   │   └── usecases/
│   │       ├── auth.go
│   │       ├── hotel.go
│   │       ├── room.go
│   │       └── booking.go
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user.go
│   │   │   ├── hotel.go
│   │   │   ├── room.go
│   │   │   └── booking.go
│   │   └── repository/
│   │       ├── user.go
│   │       ├── hotel.go
│   │       ├── room.go
│   │       └── booking.go
│   ├── infrastructure/
│   │   ├── migrations/
│   │   └── repository/
│   │       └── postgres/
│   ├── middleware/
├── middleware/
│   │   ├── auth.go
│   │   ├── context.go
│   │   └── logger.go
│   └── presentation/
│       └── http/
│           ├── auth/
│           ├── hotels/
│           ├── rooms/
│           └── bookings/
├── web/                  # Frontend application
│   ├── css/
│   │   └── style.css    # Modern responsive styles
│   ├── js/
│   │   ├── api.js       # API client
│   │   ├── auth.js      # Authentication
│   │   ├── hotels.js    # Hotel management
│   │   ├── rooms.js     # Room operations
│   │   ├── bookings.js  # Booking management
│   │   ├── owner.js     # Owner dashboard
│   │   └── app.js       # Main app controller
│   └── index.html       # Single-page application
└── pkg/
├── hasher/
└── jwt/
```

## Setup

### Prerequisites
- Go 1.25+
- PostgreSQL 16
- Docker (optional)

### Environment Variables

Create a `.env` file in the root directory:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=booking_user
POSTGRES_PASSWORD=booking_password
POSTGRES_DB=booking_db
JWT_SECRET=your_secret_key_here
```

### Using Docker Compose

```bash
docker-compose up -d
```

### Manual Setup

1. Install dependencies:
```bash
go mod download
```

2. Create PostgreSQL database:
```bash
createdb booking_db
```

3. Run the application:
```bash
go run cmd/main.go
```

The server will start on `http://localhost:8080`

### 6. Load Demo Data (Optional)

To quickly test the platform with sample data:

```bash
chmod +x demo_data.sh
./demo_data.sh
```

This creates:
- 3 users (1 guest + 2 hotel owners)
- 4 hotels in different cities
- 14 rooms across all hotels
- 1 sample booking

**Demo Credentials:**
- Guest: `alice@example.com` / `password123`
- Owner 1: `robert@hotelowner.com` / `password123`
- Owner 2: `maria@hotelowner.com` / `password123`

### 7. Access the Web Interface

Open your browser and navigate to:

```
http://localhost:8080
```

The web interface provides:
- 🏠 Home page with search and featured hotels
- 🏨 Hotels listing with filters
- 🔍 Hotel details with room availability
- 📅 Booking management
- 👤 User authentication
- 🎛️ Owner dashboard for hotel management

## Web Interface Features

### Guest Interface
- **Search & Browse**: Search hotels by city, filter by rating
- **Hotel Details**: View comprehensive hotel and room information
- **Real-time Availability**: Check room availability for specific dates
- **Booking Management**: Create, view, and cancel bookings
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### Owner Dashboard
- **Hotel Management**: Create, edit, and delete hotels
- **Room Management**: Add and manage rooms with pricing
- **Booking Overview**: View and manage all bookings
- **Status Control**: Confirm, reject, or complete bookings

### User Experience
- Modern, gradient-based design
- Smooth animations and transitions
- Toast notifications for feedback
- Modal dialogs for actions
- Real-time price calculations
- Intuitive navigation

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response: 201 Created
{
  "token": "jwt_token_here",
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

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "token": "jwt_token_here",
  "user": { ... }
}
```

### User Endpoints

#### Get Current User Profile
```http
GET /users/me
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Hotel Endpoints

#### Get All Hotels
```http
GET /hotels

Response: 200 OK
[
  {
    "id": 1,
    "owner_id": 1,
    "name": "Grand Hotel",
    "description": "Luxury hotel in the city center",
    "city": "New York",
    "address": "123 Main St",
    "rating": 4.5,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Search Hotels
```http
GET /hotels/search?city=New York&min_rating=4.0

Response: 200 OK
[ ... ]
```

#### Get Hotel by ID
```http
GET /hotels/{id}

Response: 200 OK
{
  "id": 1,
  "owner_id": 1,
  "name": "Grand Hotel",
  "description": "Luxury hotel in the city center",
  "city": "New York",
  "address": "123 Main St",
  "rating": 4.5,
  "rooms": [ ... ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Create Hotel (Authenticated)
```http
POST /hotels
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Grand Hotel",
  "description": "Luxury hotel in the city center",
  "city": "New York",
  "address": "123 Main St"
}

Response: 201 Created
{ ... }
```

#### Get My Hotels (Authenticated)
```http
GET /hotels/my
Authorization: Bearer {token}

Response: 200 OK
[ ... ]
```

#### Update Hotel (Authenticated, Owner Only)
```http
PUT /hotels/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Hotel Name",
  "description": "Updated description",
  "city": "New York",
  "address": "456 New St"
}

Response: 200 OK
{ ... }
```

#### Delete Hotel (Authenticated, Owner Only)
```http
DELETE /hotels/{id}
Authorization: Bearer {token}

Response: 204 No Content
```

### Room Endpoints

#### Get Room by ID
```http
GET /rooms/{id}

Response: 200 OK
{
  "id": 1,
  "hotel_id": 1,
  "room_number": "101",
  "type": "Deluxe Suite",
  "description": "Spacious suite with city view",
  "price_per_day": 150,
  "capacity": 2,
  "available": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Get Hotel Rooms
```http
GET /hotels/{hotelId}/rooms

Response: 200 OK
[ ... ]
```

#### Check Room Availability
```http
GET /rooms/{id}/availability?check_in=2024-06-01&check_out=2024-06-05

Response: 200 OK
{
  "room_id": 1,
  "check_in": "2024-06-01",
  "check_out": "2024-06-05",
  "available": true
}
```

#### Search Available Rooms
```http
GET /hotels/{hotelId}/rooms/available?check_in=2024-06-01&check_out=2024-06-05

Response: 200 OK
[ ... ]
```

#### Create Room (Authenticated, Hotel Owner Only)
```http
POST /hotels/{hotelId}/rooms
Authorization: Bearer {token}
Content-Type: application/json

{
  "room_number": "101",
  "type": "Deluxe Suite",
  "description": "Spacious suite with city view",
  "price_per_day": 150,
  "capacity": 2
}

Response: 201 Created
{ ... }
```

#### Update Room (Authenticated, Hotel Owner Only)
```http
PUT /rooms/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "room_number": "101A",
  "type": "Deluxe Suite",
  "description": "Updated description",
  "price_per_day": 175,
  "capacity": 2,
  "available": false
}

Response: 200 OK
{ ... }
```

#### Delete Room (Authenticated, Hotel Owner Only)
```http
DELETE /rooms/{id}
Authorization: Bearer {token}

Response: 204 No Content
```

### Booking Endpoints

#### Create Booking (Authenticated)
```http
POST /bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "hotel_id": 1,
  "room_id": 1,
  "check_in": "2024-06-01",
  "check_out": "2024-06-05"
}

Response: 201 Created
{
  "id": 1,
  "user_id": 1,
  "hotel_id": 1,
  "room_id": 1,
  "check_in": "2024-06-01T00:00:00Z",
  "check_out": "2024-06-05T00:00:00Z",
  "total_price": 600,
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z",
  "hotel": { ... },
  "room": { ... }
}
```

#### Get Booking by ID (Authenticated)
```http
GET /bookings/{id}
Authorization: Bearer {token}

Response: 200 OK
{ ... }
```

#### Get My Bookings (Authenticated)
```http
GET /bookings/my
Authorization: Bearer {token}

Response: 200 OK
[ ... ]
```

#### Get Hotel Bookings (Authenticated, Hotel Owner Only)
```http
GET /hotels/{hotelId}/bookings
Authorization: Bearer {token}

Response: 200 OK
[ ... ]
```

#### Cancel Booking (Authenticated, Booking Owner Only)
```http
DELETE /bookings/{id}
Authorization: Bearer {token}

Response: 204 No Content
```

#### Update Booking Status (Authenticated, Hotel Owner Only)
```http
PATCH /bookings/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "confirmed"
}

Response: 204 No Content
```

## Booking Status Values

- `pending` - Booking created, waiting for confirmation
- `confirmed` - Booking confirmed by hotel owner
- `cancelled` - Booking cancelled
- `completed` - Booking completed (check-out date passed)

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful GET/PUT/PATCH request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Booking conflict (room not available)
- `500 Internal Server Error` - Server error

Error responses include a plain text message describing the error.

## Double Booking Protection

The system prevents double bookings through:

1. Database-level constraints and indexes on `(room_id, check_in, check_out)`
2. Application-level conflict checking before creating bookings
3. Transaction isolation to prevent race conditions
4. Real-time availability checking

## Logging

All HTTP requests are logged with:
- HTTP method and path
- Remote address
- Response status code
- Request duration
- Response size

Example log:
```
[POST] /bookings 127.0.0.1:54321 - Status: 201 - Duration: 45ms - Size: 342 bytes
```

## Screenshots & Demo

### Home Page
- Hero section with search functionality
- Popular destinations
- Featured hotels grid

### Hotel Details
- Hotel information and location
- Available rooms with pricing
- Instant booking capability
- Availability checking

### Booking Management
- Personal booking history
- Booking status tracking
- Cancellation options

### Owner Dashboard
- Hotel and room management
- Booking requests
- Status updates

## Testing

### Backend Tests
```bash
go test ./...
```

### API Integration Tests
```bash
chmod +x test_api.sh
./test_api.sh
```

### Manual Testing
1. Start the application
2. Open `http://localhost:8080`
3. Follow the Quick Start workflow in `QUICKSTART.md`

## Performance

- **Frontend**: No frameworks, pure JavaScript for fast load times
- **Backend**: Concurrent request handling with Go
- **Database**: Indexed queries for fast searches
- **Caching**: Browser caching for static assets

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Development

### Frontend Development
All frontend code is in the `web/` directory:
- Modify `web/css/style.css` for styling
- Update `web/js/*.js` for functionality
- Edit `web/index.html` for structure

Changes are reflected immediately on page refresh (no build step required).

### Backend Development
```bash
# Run with auto-reload (install air first)
air

# Or manually
go run cmd/main.go
```
