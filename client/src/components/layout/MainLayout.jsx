// src/components/layout/MainLayout.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useUser } from '../../contexts/UserContext';

const MainLayout = ({ children }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-primary">Train Reservation</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <Link to="/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-700">
                    Welcome, {user.name}
                  </span>
                  {user.role === 'staff' ? (
                    <Link to="/staff-dashboard">
                      <Button variant="outline">Dashboard</Button>
                    </Link>
                  ) : (
                    <Link to="/passenger-dashboard">
                      <Button variant="outline">My Bookings</Button>
                    </Link>
                  )}
                  <Button variant="ghost" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Train Reservation System
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;