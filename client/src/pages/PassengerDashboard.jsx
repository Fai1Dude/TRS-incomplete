// src/pages/PassengerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useNotification } from '../components/notifications/NotificationProvider';
import { useUser } from '../contexts/UserContext';
import { 
  Train, 
  Calendar, 
  Clock, 
  CreditCard, 
  Award,
  AlertCircle 
} from 'lucide-react';

const PassengerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { addNotification } = useNotification();

  const [activeBookings, setActiveBookings] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const userId = user?.id; // Get the userId from the user object

        const [activeRes, historyRes, loyaltyRes] = await Promise.all([
          fetch(`http://localhost:5000/api/reservations/active/${userId}`, { headers }),
          fetch(`http://localhost:5000/api/reservations/history/${userId}`, { headers }),
          fetch(`http://localhost:5000/api/loyalty/${userId}`, { headers }),
        ]);

        const [bookingsData, historyData, loyaltyData] = await Promise.all([
          activeRes.json(),
          historyRes.json(),
          loyaltyRes.json()
        ]);

        setActiveBookings(bookingsData);
        setBookingHistory(historyData);
        setLoyaltyInfo(loyaltyData);

        addNotification({
          title: 'Welcome Back',
          message: 'Your dashboard has been updated',
          type: 'info'
        });
      } catch (error) {
        setError(error.message);
        addNotification({
          title: 'Error',
          message: 'Failed to load dashboard data',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const handleCancelBooking = async (reservationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/reservations/${reservationId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setActiveBookings(prev => 
          prev.filter(booking => booking.Reservation_Num !== reservationId)
        );
        addNotification({
          title: 'Booking Cancelled',
          message: 'Your booking has been cancelled successfully',
          type: 'success'
        });
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message,
        type: 'error'
      });
    }
  };

  const renderBookingCard = (booking, isActive = true) => (
    <Card key={booking.Reservation_Num} className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Train className="w-4 h-4" />
                <span className="font-semibold">
                  {booking.EName} to {booking.AName}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{new Date(booking.Date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{booking.Departure_Time}</span>
              </div>
              <div className="text-sm">
                Seat: {booking.Seat_Number} (Coach {booking.Coach})
              </div>
            </div>

            {isActive && (
              <div className="space-y-2">
                {!booking.Payment_ID && (
                  <Button
                    onClick={() => navigate(`/payment/${booking.Reservation_Num}`)}
                    className="w-full"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => handleCancelBooking(booking.Reservation_Num)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {!booking.Payment_ID && isActive && (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-2 rounded">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Payment pending</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Welcome back, {user?.name}</CardTitle>
            <Button onClick={() => navigate('/')}>
              Book New Trip
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loyaltyInfo && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-5 h-5" />
                <h3 className="font-semibold">Loyalty Status</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Points</p>
                  <p className="font-semibold">{loyaltyInfo.points}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-semibold">{loyaltyInfo.Classtype}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available Discount</p>
                  <p className="font-semibold">{loyaltyInfo.Discount_Amount}%</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings Section */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active Bookings</TabsTrigger>
              <TabsTrigger value="history">Booking History</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-4">
              {activeBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active bookings. Ready to plan your next trip?
                </div>
              ) : (
                activeBookings.map(booking => renderBookingCard(booking))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              {bookingHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No booking history yet.
                </div>
              ) : (
                bookingHistory.map(booking => renderBookingCard(booking, false))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PassengerDashboard;