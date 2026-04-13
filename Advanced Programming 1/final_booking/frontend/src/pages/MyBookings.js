import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { bookingAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  LocationIcon,
  BedIcon,
  CalendarIcon,
  BookingIcon,
} from "../components/Icons";
import "../styles/MyBookings.css";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    loadBookings();
  }, [isAuthenticated, navigate]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data || []);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      setCancellingId(bookingId);
      await bookingAPI.cancel(bookingId);
      // Reload bookings to reflect the change
      await loadBookings();
      alert("Booking cancelled successfully");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert(
        err.response?.data?.error ||
          "Failed to cancel booking. Please try again.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "confirmed":
        return "status-confirmed";
      case "pending":
        return "status-pending";
      case "cancelled":
        return "status-cancelled";
      case "completed":
        return "status-completed";
      default:
        return "";
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const canCancelBooking = (booking) => {
    if (booking.status === "cancelled" || booking.status === "completed") {
      return false;
    }
    const checkInDate = new Date(booking.check_in);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkInDate > today;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return nights;
  };

  const isUpcoming = (checkIn) => {
    const checkInDate = new Date(checkIn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkInDate >= today;
  };

  const isPast = (checkOut) => {
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkOutDate < today;
  };

  // Separate bookings into categories
  const upcomingBookings = bookings.filter(
    (b) =>
      isUpcoming(b.check_in) &&
      b.status !== "cancelled" &&
      b.status !== "completed",
  );
  const pastBookings = bookings.filter(
    (b) =>
      isPast(b.check_out) ||
      b.status === "completed" ||
      b.status === "cancelled",
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="my-bookings-container">
      <div className="container">
        <div className="bookings-header">
          <h1>My Bookings</h1>
          <button onClick={() => navigate("/")} className="btn btn-outline">
            Book New Hotel
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {bookings.length === 0 ? (
          <div className="no-bookings">
            <div className="no-bookings-icon">
              <BookingIcon size={80} color="currentColor" />
            </div>
            <h2>No bookings yet</h2>
            <p>You haven't made any bookings yet. Start exploring hotels!</p>
            <button onClick={() => navigate("/")} className="btn btn-primary">
              Browse Hotels
            </button>
          </div>
        ) : (
          <>
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <div className="bookings-section">
                <h2 className="section-title">Upcoming Bookings</h2>
                <div className="bookings-list">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="booking-card">
                      <div className="booking-header">
                        <div className="booking-status">
                          <span
                            className={`status-badge ${getStatusClass(booking.status)}`}
                          >
                            {getStatusText(booking.status)}
                          </span>
                          <span className="booking-id">
                            Booking #{booking.id}
                          </span>
                        </div>
                        <div className="booking-actions">
                          {canCancelBooking(booking) && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="btn btn-danger btn-sm"
                              disabled={cancellingId === booking.id}
                            >
                              {cancellingId === booking.id
                                ? "Cancelling..."
                                : "Cancel Booking"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="booking-details">
                        <div className="hotel-info">
                          <h3 className="hotel-name">
                            {booking.hotel?.name || "Hotel Information"}
                          </h3>
                          {booking.hotel && (
                            <p className="hotel-location">
                              <LocationIcon size={16} />
                              {booking.hotel.city}, {booking.hotel.address}
                            </p>
                          )}
                          {booking.room && (
                            <p className="room-info">
                              <BedIcon size={16} />
                              {booking.room.type} - Room #
                              {booking.room.room_number}
                            </p>
                          )}
                        </div>

                        <div className="booking-dates">
                          <div className="date-info">
                            <span className="date-label">
                              <CalendarIcon size={12} />
                              Check-in
                            </span>
                            <span className="date-value">
                              {formatDate(booking.check_in)}
                            </span>
                          </div>
                          <div className="date-separator">→</div>
                          <div className="date-info">
                            <span className="date-label">
                              <CalendarIcon size={12} />
                              Check-out
                            </span>
                            <span className="date-value">
                              {formatDate(booking.check_out)}
                            </span>
                          </div>
                        </div>

                        <div className="booking-summary">
                          <div className="summary-item">
                            <span className="summary-label">Duration:</span>
                            <span className="summary-value">
                              {calculateNights(
                                booking.check_in,
                                booking.check_out,
                              )}{" "}
                              {calculateNights(
                                booking.check_in,
                                booking.check_out,
                              ) === 1
                                ? "night"
                                : "nights"}
                            </span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-label">Total Price:</span>
                            <span className="summary-value total-price">
                              ${booking.total_price}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="booking-footer">
                        <span className="booking-date">
                          Booked on {formatDate(booking.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <div className="bookings-section">
                <h2 className="section-title">Past Bookings</h2>
                <div className="bookings-list">
                  {pastBookings.map((booking) => (
                    <div key={booking.id} className="booking-card booking-past">
                      <div className="booking-header">
                        <div className="booking-status">
                          <span
                            className={`status-badge ${getStatusClass(booking.status)}`}
                          >
                            {getStatusText(booking.status)}
                          </span>
                          <span className="booking-id">
                            Booking #{booking.id}
                          </span>
                        </div>
                      </div>

                      <div className="booking-details">
                        <div className="hotel-info">
                          <h3 className="hotel-name">
                            {booking.hotel?.name || "Hotel Information"}
                          </h3>
                          {booking.hotel && (
                            <p className="hotel-location">
                              <LocationIcon size={16} />
                              {booking.hotel.city}, {booking.hotel.address}
                            </p>
                          )}
                          {booking.room && (
                            <p className="room-info">
                              <BedIcon size={16} />
                              {booking.room.type} - Room #
                              {booking.room.room_number}
                            </p>
                          )}
                        </div>

                        <div className="booking-dates">
                          <div className="date-info">
                            <span className="date-label">
                              <CalendarIcon size={12} />
                              Check-in
                            </span>
                            <span className="date-value">
                              {formatDate(booking.check_in)}
                            </span>
                          </div>
                          <div className="date-separator">→</div>
                          <div className="date-info">
                            <span className="date-label">
                              <CalendarIcon size={12} />
                              Check-out
                            </span>
                            <span className="date-value">
                              {formatDate(booking.check_out)}
                            </span>
                          </div>
                        </div>

                        <div className="booking-summary">
                          <div className="summary-item">
                            <span className="summary-label">Duration:</span>
                            <span className="summary-value">
                              {calculateNights(
                                booking.check_in,
                                booking.check_out,
                              )}{" "}
                              {calculateNights(
                                booking.check_in,
                                booking.check_out,
                              ) === 1
                                ? "night"
                                : "nights"}
                            </span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-label">Total Price:</span>
                            <span className="summary-value total-price">
                              ${booking.total_price}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="booking-footer">
                        <span className="booking-date">
                          Booked on {formatDate(booking.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
