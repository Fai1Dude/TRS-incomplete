// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './components/notifications/NotificationProvider';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import StaffLogin from './pages/StaffLogin';
import PassengerDashboard from './pages/PassengerDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import Reports from './pages/Reports';

const App = () => {
  return (
    <UserProvider>
      <NotificationProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/staff-login" element={<StaffLogin />} />
              <Route path="/passenger-dashboard" element={<PassengerDashboard />} />
              <Route path="/staff-dashboard" element={<StaffDashboard />} />
              <Route path="/booking/:trainId" element={<Booking />} />
              <Route path="/payment/:reservationId" element={<Payment />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </MainLayout>
        </Router>
      </NotificationProvider>
    </UserProvider>
  );
};

export default App;