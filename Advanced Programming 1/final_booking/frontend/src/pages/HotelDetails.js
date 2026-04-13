import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { hotelAPI, roomAPI, bookingAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeftIcon,
  LocationIcon,
  StarIcon,
  CalendarIcon,
  UserIcon,
  CheckIcon,
} from "../components/Icons";
import "../styles/HotelDetails.css";

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    selectedRoom: null,
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    loadHotelDetails();
  }, [id]);

  const loadHotelDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const [hotelResponse, roomsResponse] = await Promise.all([
        hotelAPI.getById(id),
        roomAPI.getByHotel(id),
      ]);

      setHotel(hotelResponse.data);
      setRooms(roomsResponse.data || []);
    } catch (err) {
      console.error("Error loading hotel details:", err);
      setError("Failed to load hotel details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData({
      ...bookingData,
      [name]: value,
    });
    setBookingError("");
    setBookingSuccess(false);
  };

  const handleRoomSelect = (room) => {
    setBookingData({
      ...bookingData,
      selectedRoom: room,
    });
    setBookingError("");
    setBookingSuccess(false);
  };

  const calculateTotalPrice = () => {
    if (
      !bookingData.selectedRoom ||
      !bookingData.checkIn ||
      !bookingData.checkOut
    ) {
      return 0;
    }

    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    return days * bookingData.selectedRoom.price_per_day;
  };

  const validateBooking = () => {
    if (!isAuthenticated()) {
      setBookingError("Please login to make a booking");
      return false;
    }

    if (!bookingData.selectedRoom) {
      setBookingError("Please select a room");
      return false;
    }

    if (!bookingData.checkIn || !bookingData.checkOut) {
      setBookingError("Please select check-in and check-out dates");
      return false;
    }

    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      setBookingError("Check-in date cannot be in the past");
      return false;
    }

    if (checkOut <= checkIn) {
      setBookingError("Check-out date must be after check-in date");
      return false;
    }

    return true;
  };

  const handleBooking = async () => {
    if (!validateBooking()) {
      return;
    }

    setBookingLoading(true);
    setBookingError("");
    setBookingSuccess(false);

    try {
      const bookingRequest = {
        hotel_id: parseInt(id),
        room_id: bookingData.selectedRoom.id,
        check_in: bookingData.checkIn,
        check_out: bookingData.checkOut,
      };

      const response = await bookingAPI.create(bookingRequest);
      setBookingSuccess(true);

      // Reset form
      setBookingData({
        checkIn: "",
        checkOut: "",
        selectedRoom: null,
      });

      // Redirect to bookings page after 2 seconds
      setTimeout(() => {
        navigate("/bookings");
      }, 2000);
    } catch (err) {
      console.error("Booking error:", err);
      const errorMessage =
        err.response?.data?.error ||
        "Failed to create booking. Please try again.";
      setBookingError(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading hotel details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate("/")} className="btn btn-primary">
          Back to Home
        </button>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="error-container">
        <h2>Hotel not found</h2>
        <button onClick={() => navigate("/")} className="btn btn-primary">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="hotel-details-container">
      {/* Hotel Header */}
      <div className="hotel-header">
        <div className="container">
          <button onClick={() => navigate("/")} className="btn btn-back">
            <ArrowLeftIcon size={18} />
            Back to Search
          </button>

          <div className="hotel-header-content">
            <div className="hotel-title-section">
              <h1 className="hotel-title">{hotel.name}</h1>
              <div className="hotel-meta">
                <span className="hotel-location">
                  <LocationIcon size={18} />
                  {hotel.city}, {hotel.address}
                </span>
                {hotel.rating > 0 && (
                  <div className="hotel-rating-large">
                    <span className="star">
                      <StarIcon size={20} color="#fbbf24" filled />
                    </span>
                    <span className="rating-value">
                      {hotel.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Hotel Description */}
        {hotel.description && (
          <div className="hotel-description-section">
            <h2>About this hotel</h2>
            <p>{hotel.description}</p>
          </div>
        )}

        {/* Booking Section */}
        <div className="booking-section">
          <h2>Book Your Stay</h2>

          <div className="booking-dates">
            <div className="form-group">
              <label htmlFor="checkIn">Check-in Date</label>
              <input
                type="date"
                id="checkIn"
                name="checkIn"
                value={bookingData.checkIn}
                onChange={handleBookingChange}
                min={getTodayDate()}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkOut">Check-out Date</label>
              <input
                type="date"
                id="checkOut"
                name="checkOut"
                value={bookingData.checkOut}
                onChange={handleBookingChange}
                min={bookingData.checkIn || getTomorrowDate()}
                className="form-control"
              />
            </div>
          </div>

          {bookingSuccess && (
            <div className="success-message">
              <CheckIcon size={18} />
              Booking created successfully! Redirecting to your bookings...
            </div>
          )}

          {bookingError && <div className="error-message">{bookingError}</div>}
        </div>

        {/* Rooms Section */}
        <div className="rooms-section">
          <h2>Available Rooms</h2>

          {rooms.length === 0 ? (
            <div className="no-rooms">
              <p>No rooms available at this hotel.</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`room-card ${
                    bookingData.selectedRoom?.id === room.id ? "selected" : ""
                  } ${!room.available ? "unavailable" : ""}`}
                  onClick={() => room.available && handleRoomSelect(room)}
                >
                  <div className="room-header">
                    <h3 className="room-type">{room.type}</h3>
                    {!room.available && (
                      <span className="unavailable-badge">Unavailable</span>
                    )}
                  </div>

                  <div className="room-details">
                    <p className="room-number">Room #{room.room_number}</p>
                    {room.description && (
                      <p className="room-description">{room.description}</p>
                    )}
                    <div className="room-info">
                      <span className="room-capacity">
                        <UserIcon size={16} />
                        Capacity: {room.capacity}{" "}
                        {room.capacity === 1 ? "person" : "people"}
                      </span>
                    </div>
                  </div>

                  <div className="room-footer">
                    <div className="room-price">
                      <span className="price-amount">
                        ${room.price_per_day}
                      </span>
                      <span className="price-period">per night</span>
                    </div>
                    {room.available && (
                      <button
                        className={`btn ${
                          bookingData.selectedRoom?.id === room.id
                            ? "btn-primary"
                            : "btn-outline"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRoomSelect(room);
                        }}
                      >
                        {bookingData.selectedRoom?.id === room.id
                          ? "Selected"
                          : "Select Room"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Summary */}
        {bookingData.selectedRoom && (
          <div className="booking-summary">
            <h3>Booking Summary</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span>Hotel:</span>
                <span>{hotel.name}</span>
              </div>
              <div className="summary-row">
                <span>Room:</span>
                <span>
                  {bookingData.selectedRoom.type} (#
                  {bookingData.selectedRoom.room_number})
                </span>
              </div>
              {bookingData.checkIn && (
                <div className="summary-row">
                  <span>Check-in:</span>
                  <span>
                    {new Date(bookingData.checkIn).toLocaleDateString()}
                  </span>
                </div>
              )}
              {bookingData.checkOut && (
                <div className="summary-row">
                  <span>Check-out:</span>
                  <span>
                    {new Date(bookingData.checkOut).toLocaleDateString()}
                  </span>
                </div>
              )}
              {bookingData.checkIn && bookingData.checkOut && (
                <>
                  <div className="summary-row">
                    <span>Number of nights:</span>
                    <span>
                      {Math.ceil(
                        (new Date(bookingData.checkOut) -
                          new Date(bookingData.checkIn)) /
                          (1000 * 60 * 60 * 24),
                      )}
                    </span>
                  </div>
                  <div className="summary-row summary-total">
                    <span>Total Price:</span>
                    <span className="total-price">
                      ${calculateTotalPrice()}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={handleBooking}
              disabled={
                bookingLoading ||
                !bookingData.checkIn ||
                !bookingData.checkOut ||
                !isAuthenticated()
              }
            >
              {bookingLoading
                ? "Processing..."
                : isAuthenticated()
                  ? "Confirm Booking"
                  : "Login to Book"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDetails;
