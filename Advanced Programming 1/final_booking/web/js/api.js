const API_BASE_URL = 'http://localhost:8080';

class API {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers
                }
            });

            const text = await response.text();
            let data;

            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                data = text;
            }

            if (!response.ok) {
                throw new Error(data || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async register(name, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        this.setAuth(data.token, data.user);
        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setAuth(data.token, data.user);
        return data;
    }

    async getProfile() {
        return this.request('/users/me');
    }

    async getAllHotels() {
        return this.request('/hotels');
    }

    async searchHotels(city, minRating) {
        let url = '/hotels/search?';
        if (city) url += `city=${encodeURIComponent(city)}&`;
        if (minRating) url += `min_rating=${minRating}`;
        return this.request(url);
    }

    async getHotel(id) {
        return this.request(`/hotels/${id}`);
    }

    async createHotel(hotelData) {
        return this.request('/hotels', {
            method: 'POST',
            body: JSON.stringify(hotelData)
        });
    }

    async getMyHotels() {
        return this.request('/hotels/my');
    }

    async updateHotel(id, hotelData) {
        return this.request(`/hotels/${id}`, {
            method: 'PUT',
            body: JSON.stringify(hotelData)
        });
    }

    async deleteHotel(id) {
        return this.request(`/hotels/${id}`, {
            method: 'DELETE'
        });
    }

    async getRoom(id) {
        return this.request(`/rooms/${id}`);
    }

    async getHotelRooms(hotelId) {
        return this.request(`/hotels/${hotelId}/rooms`);
    }

    async checkRoomAvailability(roomId, checkIn, checkOut) {
        return this.request(`/rooms/${roomId}/availability?check_in=${checkIn}&check_out=${checkOut}`);
    }

    async searchAvailableRooms(hotelId, checkIn, checkOut) {
        return this.request(`/hotels/${hotelId}/rooms/available?check_in=${checkIn}&check_out=${checkOut}`);
    }

    async createRoom(hotelId, roomData) {
        return this.request(`/hotels/${hotelId}/rooms`, {
            method: 'POST',
            body: JSON.stringify(roomData)
        });
    }

    async updateRoom(id, roomData) {
        return this.request(`/rooms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(roomData)
        });
    }

    async deleteRoom(id) {
        return this.request(`/rooms/${id}`, {
            method: 'DELETE'
        });
    }

    async createBooking(bookingData) {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    async getBooking(id) {
        return this.request(`/bookings/${id}`);
    }

    async getMyBookings() {
        return this.request('/bookings/my');
    }

    async getHotelBookings(hotelId) {
        return this.request(`/hotels/${hotelId}/bookings`);
    }

    async cancelBooking(id) {
        return this.request(`/bookings/${id}`, {
            method: 'DELETE'
        });
    }

    async updateBookingStatus(id, status) {
        return this.request(`/bookings/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        return this.user;
    }
}

const api = new API();
