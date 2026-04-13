import React from "react";
import { Link } from "react-router-dom";
import { HotelIcon, LocationIcon, BookingIcon, UserIcon } from "./Icons";
import "../styles/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <HotelIcon size={24} color="white" />
              </div>
              <span className="footer-logo-text">BookingHub</span>
            </div>
            <p className="footer-description">
              Your trusted platform for finding and booking the perfect hotel
              stay. Discover amazing accommodations worldwide at the best
              prices.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link to="/" className="footer-link">
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/bookings" className="footer-link">
                  <BookingIcon size={16} />
                  <span>My Bookings</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="footer-link">
                  <UserIcon size={16} />
                  <span>Login</span>
                </Link>
              </li>
              <li>
                <Link to="/register" className="footer-link">
                  <span>Sign Up</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Support</h4>
            <ul className="footer-links">
              <li>
                <a href="#help" className="footer-link">
                  <span>Help Center</span>
                </a>
              </li>
              <li>
                <a href="#contact" className="footer-link">
                  <span>Contact Us</span>
                </a>
              </li>
              <li>
                <a href="#faq" className="footer-link">
                  <span>FAQ</span>
                </a>
              </li>
              <li>
                <a href="#privacy" className="footer-link">
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a href="#terms" className="footer-link">
                  <span>Terms of Service</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Company</h4>
            <ul className="footer-links">
              <li>
                <a href="#about" className="footer-link">
                  <span>About Us</span>
                </a>
              </li>
              <li>
                <a href="#careers" className="footer-link">
                  <span>Careers</span>
                </a>
              </li>
              <li>
                <a href="#blog" className="footer-link">
                  <span>Blog</span>
                </a>
              </li>
              <li>
                <a href="#partners" className="footer-link">
                  <span>Partners</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} BookingHub. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <a href="#privacy" className="footer-bottom-link">
              Privacy
            </a>
            <a href="#terms" className="footer-bottom-link">
              Terms
            </a>
            <a href="#cookies" className="footer-bottom-link">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
