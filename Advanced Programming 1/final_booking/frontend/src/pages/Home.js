import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hotelAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  HotelIcon,
  LocationIcon,
  StarIcon,
  SearchIcon,
} from "../components/Icons";
import "../styles/Home.css";

const Home = () => {
  const [searchParams, setSearchParams] = useState({
    city: "",
    checkIn: "",
    checkOut: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
  });
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Load all hotels on initial mount
    loadAllHotels();
  }, []);

  const loadAllHotels = async () => {
    try {
      setLoading(true);
      const response = await hotelAPI.getAll();
      setHotels(response.data || []);
      setError("");
    } catch (err) {
      console.error("Error loading hotels:", err);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      // Filter out empty parameters
      const params = {};
      if (searchParams.city) params.city = searchParams.city;
      if (searchParams.checkIn) params.check_in = searchParams.checkIn;
      if (searchParams.checkOut) params.check_out = searchParams.checkOut;
      if (searchParams.minPrice)
        params.min_price = parseInt(searchParams.minPrice);
      if (searchParams.maxPrice)
        params.max_price = parseInt(searchParams.maxPrice);
      if (searchParams.minRating)
        params.min_rating = parseFloat(searchParams.minRating);

      const response = await hotelAPI.search(params);
      setHotels(response.data || []);

      if (!response.data || response.data.length === 0) {
        setError("No hotels found matching your criteria");
      }
    } catch (err) {
      setError("Error searching hotels. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchParams({
      city: "",
      checkIn: "",
      checkOut: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
    });
    setSearched(false);
    loadAllHotels();
  };

  const handleHotelClick = (hotelId) => {
    navigate(`/hotels/${hotelId}`);
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

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Find Your Perfect Stay</h1>
          <p className="hero-subtitle">
            Search from thousands of hotels worldwide
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-grid">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={searchParams.city}
                  onChange={handleChange}
                  placeholder="Where are you going?"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="checkIn">Check-in</label>
                <input
                  type="date"
                  id="checkIn"
                  name="checkIn"
                  value={searchParams.checkIn}
                  onChange={handleChange}
                  min={getTodayDate()}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="checkOut">Check-out</label>
                <input
                  type="date"
                  id="checkOut"
                  name="checkOut"
                  value={searchParams.checkOut}
                  onChange={handleChange}
                  min={searchParams.checkIn || getTomorrowDate()}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="minPrice">Min Price</label>
                <input
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  value={searchParams.minPrice}
                  onChange={handleChange}
                  placeholder="Min price per day"
                  className="form-control"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxPrice">Max Price</label>
                <input
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  value={searchParams.maxPrice}
                  onChange={handleChange}
                  placeholder="Max price per day"
                  className="form-control"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="minRating">Min Rating</label>
                <select
                  id="minRating"
                  name="minRating"
                  value={searchParams.minRating}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="">Any Rating</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>
            </div>

            <div className="search-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                <SearchIcon size={18} />
                {loading ? "Searching..." : "Search Hotels"}
              </button>
              {searched && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="results-section">
        <div className="container">
          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading hotels...</p>
            </div>
          ) : (
            <>
              {hotels.length > 0 ? (
                <>
                  <div className="results-header">
                    <h2>{searched ? "Search Results" : "Featured Hotels"}</h2>
                    <p className="results-count">
                      {hotels.length} {hotels.length === 1 ? "hotel" : "hotels"}{" "}
                      found
                    </p>
                  </div>

                  <div className="hotels-grid">
                    {hotels.map((hotel) => (
                      <div
                        key={hotel.id}
                        className="hotel-card"
                        onClick={() => handleHotelClick(hotel.id)}
                      >
                        <div className="hotel-image">
                          <div className="hotel-image-placeholder">
                            <HotelIcon size={80} />
                          </div>
                          {hotel.rating && (
                            <div className="hotel-rating">
                              <span className="star">
                                <StarIcon size={16} color="#f59e0b" filled />
                              </span>
                              <span>{hotel.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        <div className="hotel-info">
                          <h3 className="hotel-name">{hotel.name}</h3>
                          <p className="hotel-location">
                            <LocationIcon size={16} />
                            {hotel.city}, {hotel.address}
                          </p>
                          {hotel.description && (
                            <p className="hotel-description">
                              {hotel.description.length > 100
                                ? `${hotel.description.substring(0, 100)}...`
                                : hotel.description}
                            </p>
                          )}
                          {hotel.rooms && hotel.rooms.length > 0 && (
                            <div className="hotel-price">
                              <span className="price-label">From</span>
                              <span className="price-amount">
                                $
                                {Math.min(
                                  ...hotel.rooms.map((r) => r.price_per_day),
                                )}
                              </span>
                              <span className="price-period">per night</span>
                            </div>
                          )}
                          <button className="btn btn-outline btn-sm">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                !loading &&
                searched && (
                  <div className="no-results">
                    <h3>No hotels found</h3>
                    <p>Try adjusting your search criteria</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
