import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HotelDetails from "./pages/HotelDetails";
import MyBookings from "./pages/MyBookings";
import MyHotels from "./pages/MyHotels";
import HotelBookings from "./pages/HotelBookings";
import "./styles/App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/hotels/:id" element={<HotelDetails />} />
              <Route
                path="/bookings"
                element={
                  <PrivateRoute>
                    <MyBookings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-hotels"
                element={
                  <PrivateRoute>
                    <MyHotels />
                  </PrivateRoute>
                }
              />
              <Route
                path="/hotel/:hotelId/bookings"
                element={
                  <PrivateRoute>
                    <HotelBookings />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
