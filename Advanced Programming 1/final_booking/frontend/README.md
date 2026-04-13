# Hotel Booking System - Frontend

React-based frontend application for the Hotel Booking System.

## Features

- 🔐 User Authentication (Login/Register)
- 🏨 Hotel Search & Browse
- 🛏️ Room Selection & Booking
- 📅 Booking Management
- 💳 Booking History
- 📱 Responsive Design
- 🎨 Modern UI/UX

## Tech Stack

- **React** 18.2.0 - UI Framework
- **React Router** 6.20.1 - Routing
- **Axios** - HTTP Client
- **Context API** - State Management
- **CSS3** - Styling

## Prerequisites

- Node.js 14+ and npm/yarn
- Running backend API (default: http://localhost:8080)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL (optional):
```env
REACT_APP_API_URL=http://localhost:8080
```

## Running the Application

### Development Mode
```bash
npm start
```
The app will open at [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Header.js
│   ├── Footer.js
│   └── PrivateRoute.js
├── context/            # Context providers
│   └── AuthContext.js
├── pages/              # Page components
│   ├── Home.js
│   ├── Login.js
│   ├── Register.js
│   ├── HotelDetails.js
│   └── MyBookings.js
├── services/           # API services
│   └── api.js
├── styles/             # CSS files
│   ├── App.css
│   ├── Auth.css
│   ├── Header.css
│   ├── Footer.css
│   ├── Home.css
│   ├── HotelDetails.css
│   └── MyBookings.css
├── App.js              # Main app component
└── index.js            # Entry point
```

## Available Routes

- `/` - Home page with hotel search
- `/login` - User login
- `/register` - User registration
- `/hotels/:id` - Hotel details and booking
- `/bookings` - My bookings (protected)
- `/admin` - Admin dashboard (protected, admin only)

## API Integration

The frontend communicates with the backend API using Axios. All API calls are centralized in `src/services/api.js`.

### Authentication
Authentication uses JWT tokens stored in localStorage:
- Token is automatically added to request headers
- Auto-redirect to login on 401 responses
- Token refresh handled automatically

### API Endpoints Used

#### Auth
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

#### Users
- `GET /users/me` - Get current user profile

#### Hotels
- `GET /hotels` - Get all hotels
- `GET /hotels/:id` - Get hotel details
- `POST /hotels/search` - Search hotels

#### Rooms
- `GET /hotels/:hotelId/rooms` - Get hotel rooms

#### Bookings
- `POST /bookings` - Create booking
- `GET /bookings/my` - Get user's bookings
- `DELETE /bookings/:id` - Cancel booking

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:8080 |

## Features Detail

### Home Page
- Hero section with search form
- Search by city, dates, price range, rating
- Grid display of hotels
- Hotel cards with images, ratings, pricing

### Hotel Details
- Hotel information display
- Room listing with availability
- Date selection for booking
- Price calculation
- Booking summary

### My Bookings
- View all bookings (upcoming & past)
- Booking status indicators
- Cancel upcoming bookings
- Booking details with hotel and room info

### Authentication
- Form validation
- Error handling
- Auto-login after registration
- Persistent sessions

## Styling

The application uses custom CSS with:
- CSS Variables for theming
- Responsive design (mobile-first)
- Smooth transitions and animations
- Modern card-based layouts
- Gradient backgrounds

### Color Scheme
- Primary: `#2563eb` (Blue)
- Success: `#10b981` (Green)
- Danger: `#ef4444` (Red)
- Warning: `#f59e0b` (Orange)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Code Style
- Functional components with hooks
- Consistent naming conventions
- Component composition
- Separation of concerns

### Best Practices
- Error handling for all API calls
- Loading states for async operations
- Input validation
- Responsive design
- Accessibility considerations

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure:
- Backend is running on correct port
- Backend has CORS enabled
- API URL in .env is correct

### Proxy Configuration
The package.json includes a proxy configuration for development:
```json
"proxy": "http://localhost:8080"
```

### Build Issues
Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is part of the Hotel Booking System.

## Support

For issues and questions, please open an issue in the repository.