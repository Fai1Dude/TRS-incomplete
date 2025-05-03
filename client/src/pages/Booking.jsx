// src/pages/Booking.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNotification } from '../components/notifications/NotificationProvider';
import { useUser } from '../contexts/UserContext';

const Booking = () => {
  const { trainId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { addNotification } = useNotification();

  const [trainDetails, setTrainDetails] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState('A');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const [trainResponse, seatsResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/trains/${trainId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`http://localhost:5000/api/trains/${trainId}/seats`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const trainData = await trainResponse.json();
        const seatsData = await seatsResponse.json();

        if (!trainResponse.ok || !seatsResponse.ok) {
          throw new Error('Failed to fetch train details');
        }

        setTrainDetails(trainData);
        setAvailableSeats(seatsData);
        addNotification({
          title: 'Train Details Loaded',
          message: 'Please select your preferred seat',
          type: 'info'
        });
      } catch (error) {
        addNotification({
          title: 'Error',
          message: error.message,
          type: 'error'
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainDetails();
  }, [trainId]);

  const handleSeatSelection = (seatNumber) => {
    setSelectedSeat(seatNumber);
    addNotification({
      title: 'Seat Selected',
      message: `You've selected seat ${seatNumber} in Coach ${selectedCoach}`,
      type: 'info'
    });
  };

  const handleCoachChange = (coach) => {
    setSelectedCoach(coach);
    setSelectedSeat(null);
  };

  const handleBooking = async () => {
    if (!selectedSeat) {
      addNotification({
        title: 'Error',
        message: 'Please select a seat',
        type: 'error'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trainId,
          seatNumber: selectedSeat,
          coach: selectedCoach,
          passengerId: user.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        addNotification({
          title: 'Booking Successful',
          message: 'Proceeding to payment',
          type: 'success'
        });
        navigate(`/payment/${data.reservationId}`);
      } else {
        throw new Error(data.message || 'Failed to create reservation');
      }
    } catch (error) {
      addNotification({
        title: 'Booking Failed',
        message: error.message,
        type: 'error'
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Your Seat</CardTitle>
        </CardHeader>
        <CardContent>
          {trainDetails && (
            <div className="space-y-6">
              {/* Train Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Train Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p>From: {trainDetails.EName}</p>
                  <p>To: {trainDetails.AName}</p>
                  <p>Date: {new Date(trainDetails.Date).toLocaleDateString()}</p>
                  <p>Time: {trainDetails.Departure_Time}</p>
                </div>
              </div>

              {/* Coach Selection */}
              <div>
                <h3 className="font-semibold mb-2">Select Coach</h3>
                <div className="flex space-x-2">
                  {['A', 'B', 'C'].map((coach) => (
                    <Button
                      key={coach}
                      variant={selectedCoach === coach ? "default" : "outline"}
                      onClick={() => handleCoachChange(coach)}
                    >
                      Coach {coach}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Seat Selection */}
              <div>
                <h3 className="font-semibold mb-2">Select Seat</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {availableSeats
                    .filter(seat => seat.coach === selectedCoach)
                    .map((seat) => (
                      <Button
                        key={seat.number}
                        variant={selectedSeat === seat.number ? "default" : "outline"}
                        className={!seat.available ? "opacity-50 cursor-not-allowed" : ""}
                        onClick={() => handleSeatSelection(seat.number)}
                        disabled={!seat.available}
                      >
                        {seat.number}
                      </Button>
                    ))}
                </div>
              </div>

              {/* Selected Seat Summary */}
              {selectedSeat && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Selected Seat</h3>
                  <p>Coach: {selectedCoach}</p>
                  <p>Seat Number: {selectedSeat}</p>
                </div>
              )}

              {/* Booking Button */}
              <Button 
                onClick={handleBooking} 
                className="w-full"
                disabled={!selectedSeat}
              >
                Continue to Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Booking;