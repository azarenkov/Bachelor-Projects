import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bookingAPI, hotelAPI } from "../services/api";
import { Icons } from "../components/Icons";
import "./HotelBookings.css";

function HotelBookings() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, [hotelId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hotelResponse, bookingsResponse] = await Promise.all([
        hotelAPI.getById(hotelId),
        bookingAPI.getByHotel(hotelId),
      ]);
      setHotel(hotelResponse.data);
      const bookingsData = bookingsResponse.data || [];
      console.log("Bookings data from backend:", bookingsData);
      if (bookingsData.length > 0) {
        console.log("First booking sample:", bookingsData[0]);
      }
      setBookings(bookingsData);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await bookingAPI.updateStatus(bookingId, newStatus);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update booking status");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f59e0b",
      confirmed: "#10b981",
      cancelled: "#ef4444",
      completed: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    // Handle different date formats from backend
    let date;
    if (dateString.includes("T")) {
      // ISO format: 2024-01-15T00:00:00Z
      date = new Date(dateString);
    } else if (dateString.includes("-")) {
      // YYYY-MM-DD format
      const [year, month, day] = dateString.split("-");
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;

    let start, end;

    // Parse dates handling different formats
    if (checkIn.includes("T")) {
      start = new Date(checkIn);
    } else if (checkIn.includes("-")) {
      const [year, month, day] = checkIn.split("-");
      start = new Date(year, month - 1, day);
    } else {
      start = new Date(checkIn);
    }

    if (checkOut.includes("T")) {
      end = new Date(checkOut);
    } else if (checkOut.includes("-")) {
      const [year, month, day] = checkOut.split("-");
      end = new Date(year, month - 1, day);
    } else {
      end = new Date(checkOut);
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.status === filter;
  });

  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  if (loading) {
    return (
      <div className="hotel-bookings-container">
        <div className="loading">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="hotel-bookings-container">
      <div className="bookings-header">
        <button className="btn-back" onClick={() => navigate("/my-hotels")}>
          <Icons.ChevronLeft /> Back to My Hotels
        </button>
        {hotel && (
          <div className="hotel-title">
            <h1>Bookings for {hotel.name}</h1>
            <p className="hotel-subtitle">
              <Icons.MapPin /> {hotel.city}, {hotel.address}
            </p>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="bookings-stats">
        <div className="stat-card">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value">{bookingStats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>
            {bookingStats.pending}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmed</div>
          <div className="stat-value" style={{ color: "#10b981" }}>
            {bookingStats.confirmed}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: "#6b7280" }}>
            {bookingStats.completed}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cancelled</div>
          <div className="stat-value" style={{ color: "#ef4444" }}>
            {bookingStats.cancelled}
          </div>
        </div>
      </div>

      <div className="bookings-filters">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending
        </button>
        <button
          className={`filter-btn ${filter === "confirmed" ? "active" : ""}`}
          onClick={() => setFilter("confirmed")}
        >
          Confirmed
        </button>
        <button
          className={`filter-btn ${filter === "completed" ? "active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
        <button
          className={`filter-btn ${filter === "cancelled" ? "active" : ""}`}
          onClick={() => setFilter("cancelled")}
        >
          Cancelled
        </button>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="no-bookings">
          <Icons.Calendar />
          <p>No {filter !== "all" ? filter : ""} bookings found.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-id">
                  Booking #{booking.id}
                  <span
                    className="booking-status"
                    style={{ backgroundColor: getStatusColor(booking.status) }}
                  >
                    {booking.status}
                  </span>
                </div>
                <div className="booking-total">${booking.total_price}</div>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <Icons.User />
                    <span>Guest ID: {booking.user_id}</span>
                  </div>
                  <div className="detail-item">
                    <Icons.Hotel />
                    <span>Room #{booking.room_id}</span>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-item">
                    <Icons.Calendar />
                    <span>Check-in: {formatDate(booking.check_in)}</span>
                  </div>
                  <div className="detail-item">
                    <Icons.Calendar />
                    <span>Check-out: {formatDate(booking.check_out)}</span>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-item">
                    <Icons.Moon />
                    <span>
                      {calculateNights(booking.check_in, booking.check_out)}{" "}
                      night(s)
                    </span>
                  </div>
                  <div className="detail-item">
                    <Icons.Clock />
                    <span>Booked: {formatDate(booking.created_at)}</span>
                  </div>
                </div>
              </div>

              {booking.status === "pending" && (
                <div className="booking-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusChange(booking.id, "confirmed")}
                  >
                    <Icons.Check /> Confirm
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleStatusChange(booking.id, "cancelled")}
                  >
                    <Icons.X /> Cancel
                  </button>
                </div>
              )}

              {booking.status === "confirmed" && (
                <div className="booking-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleStatusChange(booking.id, "completed")}
                  >
                    <Icons.Check /> Mark as Completed
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleStatusChange(booking.id, "cancelled")}
                  >
                    <Icons.X /> Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HotelBookings;
