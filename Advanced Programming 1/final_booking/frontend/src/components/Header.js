import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HotelIcon, UserIcon, LogoutIcon, BookingIcon } from "./Icons";
import "../styles/Header.css";

const Header = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <HotelIcon size={28} />
            </div>
            <span className="logo-text">BookingHub</span>
          </Link>

          <nav className="nav">
            <Link to="/" className="nav-link">
              Home
            </Link>

            {isAuthenticated() ? (
              <>
                <Link to="/bookings" className="nav-link nav-link-icon">
                  <BookingIcon size={18} />
                  <span>My Bookings</span>
                </Link>

                <Link to="/my-hotels" className="nav-link nav-link-icon">
                  <HotelIcon size={18} />
                  <span>My Hotels</span>
                </Link>

                {isAdmin() && (
                  <Link to="/admin" className="nav-link">
                    Admin Dashboard
                  </Link>
                )}

                <div className="user-menu">
                  <div className="user-info">
                    <div className="user-avatar">
                      <UserIcon size={18} color="white" />
                    </div>
                    <span className="user-name">{user?.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm logout-btn"
                  >
                    <LogoutIcon size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
