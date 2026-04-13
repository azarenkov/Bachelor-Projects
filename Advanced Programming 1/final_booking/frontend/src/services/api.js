import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
};

// User API
export const userAPI = {
  getProfile: () => api.get("/users/me"),
  updateProfile: (data) => api.put("/users/me", data),
};

// Hotel API
export const hotelAPI = {
  getAll: (params) => api.get("/hotels", { params }),
  getById: (id) => api.get(`/hotels/${id}`),
  search: (searchParams) => api.post("/hotels/search", searchParams),
  create: (data) => api.post("/hotels", data),
  update: (id, data) => api.put(`/hotels/${id}`, data),
  delete: (id) => api.delete(`/hotels/${id}`),
  getByOwner: () => api.get("/hotels/my"),
};

// Room API
export const roomAPI = {
  getByHotel: (hotelId) => api.get(`/hotels/${hotelId}/rooms`),
  getById: (roomId) => api.get(`/rooms/${roomId}`),
  create: (hotelId, data) => api.post(`/hotels/${hotelId}/rooms`, data),
  update: (hotelId, roomId, data) => api.put(`/rooms/${roomId}`, data),
  delete: (hotelId, roomId) => api.delete(`/rooms/${roomId}`),
  checkAvailability: (roomId, checkIn, checkOut) =>
    api.get(`/rooms/${roomId}/availability`, {
      params: { check_in: checkIn, check_out: checkOut },
    }),
  searchAvailable: (hotelId, checkIn, checkOut) =>
    api.get(`/hotels/${hotelId}/rooms/available`, {
      params: { check_in: checkIn, check_out: checkOut },
    }),
};

// Booking API
export const bookingAPI = {
  create: (data) => api.post("/bookings", data),
  getById: (id) => api.get(`/bookings/${id}`),
  getMyBookings: () => api.get("/bookings/my"),
  getByHotel: (hotelId) => api.get(`/hotels/${hotelId}/bookings`),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  cancel: (id) => api.delete(`/bookings/${id}`),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),
  getAllUsers: () => api.get("/admin/users"),
  getAllBookings: () => api.get("/admin/bookings"),
  getAllHotels: () => api.get("/admin/hotels"),
  updateUserRole: (userId, role) =>
    api.put(`/admin/users/${userId}/role`, { role }),
};

export default api;
