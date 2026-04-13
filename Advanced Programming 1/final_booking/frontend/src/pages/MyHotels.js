import React, { useState, useEffect } from "react";
import { hotelAPI, roomAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";
import "./MyHotels.css";

function MyHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [expandedHotel, setExpandedHotel] = useState(null);
  const navigate = useNavigate();

  const [hotelForm, setHotelForm] = useState({
    name: "",
    description: "",
    city: "",
    address: "",
    rating: 0,
  });

  const [roomForm, setRoomForm] = useState({
    room_number: "",
    type: "",
    price_per_night: "",
    capacity: "",
    description: "",
  });

  useEffect(() => {
    fetchMyHotels();
  }, []);

  const fetchMyHotels = async () => {
    try {
      setLoading(true);
      const response = await hotelAPI.getByOwner();
      setHotels(response.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load hotels");
    } finally {
      setLoading(false);
    }
  };

  const fetchHotelRooms = async (hotelId) => {
    try {
      const response = await roomAPI.getByHotel(hotelId);
      setHotels((prevHotels) =>
        prevHotels.map((hotel) =>
          hotel.id === hotelId
            ? { ...hotel, rooms: response.data || [] }
            : hotel,
        ),
      );
    } catch (err) {
      console.error("Failed to load rooms:", err);
    }
  };

  const handleExpandHotel = async (hotelId) => {
    if (expandedHotel === hotelId) {
      setExpandedHotel(null);
    } else {
      setExpandedHotel(hotelId);
      const hotel = hotels.find((h) => h.id === hotelId);
      if (!hotel.rooms) {
        await fetchHotelRooms(hotelId);
      }
    }
  };

  const handleHotelSubmit = async (e) => {
    e.preventDefault();
    try {
      const hotelData = {
        ...hotelForm,
        rating: parseFloat(hotelForm.rating),
      };

      if (editingHotel) {
        await hotelAPI.update(editingHotel.id, hotelData);
      } else {
        await hotelAPI.create(hotelData);
      }

      setShowHotelModal(false);
      setEditingHotel(null);
      resetHotelForm();
      fetchMyHotels();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save hotel");
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      const roomData = {
        ...roomForm,
        price_per_night: parseFloat(roomForm.price_per_night),
        capacity: parseInt(roomForm.capacity, 10),
      };

      if (editingRoom) {
        await roomAPI.update(selectedHotelId, editingRoom.id, roomData);
      } else {
        await roomAPI.create(selectedHotelId, roomData);
      }

      setShowRoomModal(false);
      setEditingRoom(null);
      resetRoomForm();
      await fetchHotelRooms(selectedHotelId);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save room");
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this hotel? This will also delete all associated rooms.",
      )
    ) {
      return;
    }

    try {
      await hotelAPI.delete(hotelId);
      fetchMyHotels();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete hotel");
    }
  };

  const handleDeleteRoom = async (hotelId, roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) {
      return;
    }

    try {
      await roomAPI.delete(hotelId, roomId);
      await fetchHotelRooms(hotelId);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete room");
    }
  };

  const openHotelModal = (hotel = null) => {
    if (hotel) {
      setEditingHotel(hotel);
      setHotelForm({
        name: hotel.name,
        description: hotel.description,
        city: hotel.city,
        address: hotel.address,
        rating: hotel.rating,
      });
    } else {
      resetHotelForm();
    }
    setShowHotelModal(true);
  };

  const openRoomModal = (hotelId, room = null) => {
    setSelectedHotelId(hotelId);
    if (room) {
      setEditingRoom(room);
      setRoomForm({
        room_number: room.room_number,
        type: room.type,
        price_per_night: room.price_per_night,
        capacity: room.capacity,
        description: room.description,
      });
    } else {
      resetRoomForm();
    }
    setShowRoomModal(true);
  };

  const resetHotelForm = () => {
    setHotelForm({
      name: "",
      description: "",
      city: "",
      address: "",
      rating: 0,
    });
    setEditingHotel(null);
  };

  const resetRoomForm = () => {
    setRoomForm({
      room_number: "",
      type: "",
      price_per_night: "",
      capacity: "",
      description: "",
    });
    setEditingRoom(null);
  };

  const closeHotelModal = () => {
    setShowHotelModal(false);
    resetHotelForm();
  };

  const closeRoomModal = () => {
    setShowRoomModal(false);
    resetRoomForm();
  };

  const viewHotelBookings = (hotelId) => {
    navigate(`/hotel/${hotelId}/bookings`);
  };

  if (loading) {
    return (
      <div className="my-hotels-container">
        <div className="loading">Loading your hotels...</div>
      </div>
    );
  }

  return (
    <div className="my-hotels-container">
      <div className="my-hotels-header">
        <h1>My Hotels</h1>
        <button className="btn btn-primary" onClick={() => openHotelModal()}>
          <Icons.Plus /> Add New Hotel
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {hotels.length === 0 ? (
        <div className="no-hotels">
          <Icons.Hotel />
          <p>You haven't created any hotels yet.</p>
          <button className="btn btn-primary" onClick={() => openHotelModal()}>
            Create Your First Hotel
          </button>
        </div>
      ) : (
        <div className="hotels-list">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="hotel-card">
              <div className="hotel-card-header">
                <div className="hotel-info">
                  <h2>{hotel.name}</h2>
                  <p className="hotel-location">
                    <Icons.MapPin /> {hotel.city}, {hotel.address}
                  </p>
                  <p className="hotel-rating">
                    <Icons.Star /> {hotel.rating.toFixed(1)}
                  </p>
                </div>
                <div className="hotel-actions">
                  <button
                    className="btn btn-icon"
                    onClick={() => viewHotelBookings(hotel.id)}
                    title="View Bookings"
                  >
                    <Icons.Calendar />
                  </button>
                  <button
                    className="btn btn-icon"
                    onClick={() => openHotelModal(hotel)}
                    title="Edit Hotel"
                  >
                    <Icons.Edit />
                  </button>
                  <button
                    className="btn btn-icon btn-danger"
                    onClick={() => handleDeleteHotel(hotel.id)}
                    title="Delete Hotel"
                  >
                    <span style={{ color: "white", display: "flex" }}>
                      <Icons.Trash size={20} />
                    </span>
                  </button>
                  <button
                    className="btn btn-icon"
                    onClick={() => handleExpandHotel(hotel.id)}
                    title={expandedHotel === hotel.id ? "Collapse" : "Expand"}
                  >
                    {expandedHotel === hotel.id ? (
                      <Icons.ChevronUp />
                    ) : (
                      <Icons.ChevronDown />
                    )}
                  </button>
                </div>
              </div>

              <p className="hotel-description">{hotel.description}</p>

              {expandedHotel === hotel.id && (
                <div className="rooms-section">
                  <div className="rooms-header">
                    <h3>Rooms</h3>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openRoomModal(hotel.id)}
                    >
                      <Icons.Plus /> Add Room
                    </button>
                  </div>

                  {hotel.rooms && hotel.rooms.length > 0 ? (
                    <div className="rooms-list">
                      {hotel.rooms.map((room) => (
                        <div key={room.id} className="room-item">
                          <div className="room-info">
                            <span className="room-number">
                              Room {room.room_number}
                            </span>
                            <span className="room-type">{room.type}</span>
                            <span className="room-capacity">
                              <Icons.Users /> {room.capacity} guests
                            </span>
                            <span className="room-price">
                              ${room.price_per_night}/night
                            </span>
                          </div>
                          <div className="room-actions">
                            <button
                              className="btn btn-icon btn-sm"
                              onClick={() => openRoomModal(hotel.id, room)}
                              title="Edit Room"
                            >
                              <Icons.Edit />
                            </button>
                            <button
                              className="btn btn-icon btn-sm btn-danger"
                              onClick={() =>
                                handleDeleteRoom(hotel.id, room.id)
                              }
                              title="Delete Room"
                            >
                              <span style={{ color: "white", display: "flex" }}>
                                <Icons.Trash size={16} />
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-rooms">No rooms added yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hotel Modal */}
      {showHotelModal && (
        <div className="modal-overlay" onClick={closeHotelModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingHotel ? "Edit Hotel" : "Add New Hotel"}</h2>
              <button className="modal-close" onClick={closeHotelModal}>
                <Icons.X />
              </button>
            </div>
            <form onSubmit={handleHotelSubmit}>
              <div className="form-group">
                <label>Hotel Name *</label>
                <input
                  type="text"
                  value={hotelForm.name}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  value={hotelForm.city}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, city: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  value={hotelForm.address}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, address: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Rating (0-5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={hotelForm.rating}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, rating: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={hotelForm.description}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, description: e.target.value })
                  }
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeHotelModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingHotel ? "Update Hotel" : "Create Hotel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={closeRoomModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRoom ? "Edit Room" : "Add New Room"}</h2>
              <button className="modal-close" onClick={closeRoomModal}>
                <Icons.X />
              </button>
            </div>
            <form onSubmit={handleRoomSubmit}>
              <div className="form-group">
                <label>Room Number *</label>
                <input
                  type="text"
                  value={roomForm.room_number}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, room_number: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Room Type *</label>
                <select
                  value={roomForm.type}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, type: e.target.value })
                  }
                  required
                >
                  <option value="">Select type...</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Suite">Suite</option>
                  <option value="Deluxe">Deluxe</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price per Night ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={roomForm.price_per_night}
                  onChange={(e) =>
                    setRoomForm({
                      ...roomForm,
                      price_per_night: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Capacity (guests) *</label>
                <input
                  type="number"
                  min="1"
                  value={roomForm.capacity}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, capacity: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={roomForm.description}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, description: e.target.value })
                  }
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeRoomModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRoom ? "Update Room" : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyHotels;
