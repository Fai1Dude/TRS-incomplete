// src/components/trains/TrainSearch.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { useUser } from '../../contexts/UserContext';
import { useNotification } from '../notifications/NotificationProvider';

const TrainSearch = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: new Date()
  });
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedDate = searchParams.date.toISOString().split('T')[0];
      const response = await fetch(`http://localhost:5000/api/trains/search?from=${encodeURIComponent(searchParams.from)}&to=${encodeURIComponent(searchParams.to)}&date=${formattedDate}`);
      
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data);
        if (data.length === 0) {
          addNotification({
            title: 'No Results',
            message: 'No trains found for the selected route and date.',
            type: 'info'
          });
        }
      } else {
        throw new Error(data.message || 'Failed to search trains');
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (trainId) => {
    if (!user) {
      addNotification({
        title: 'Login Required',
        message: 'Please login to book tickets',
        type: 'info'
      });
      navigate('/login');
      return;
    }
    navigate(`/booking/${trainId}`);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Search Trains</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="From Station"
              value={searchParams.from}
              onChange={(e) => setSearchParams({ ...searchParams, from: e.target.value })}
              required
            />
            <Input
              placeholder="To Station"
              value={searchParams.to}
              onChange={(e) => setSearchParams({ ...searchParams, to: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={searchParams.date}
              onSelect={(date) => date && setSearchParams({ ...searchParams, date })}
              disabled={(date) => date < new Date()}
              className="border rounded-md"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Searching...' : 'Search Trains'}
          </Button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-6 space-y-4">
            {searchResults.map((train) => (
              <div 
                key={train.Train_ID}
                className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-semibold">{train.EName} to {train.AName}</p>
                  <p className="text-sm text-gray-500">
                    Departure: {new Date(train.Departure_Time).toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Available Seats: {train.Available_Seats}
                  </p>
                </div>
                <Button 
                  onClick={() => handleBooking(train.Train_ID)}
                  disabled={train.Available_Seats === 0}
                >
                  {train.Available_Seats === 0 ? 'Full' : 'Book Now'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainSearch;