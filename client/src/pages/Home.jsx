import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calendar } from '../components/ui/calendar';
import { useUser } from '../contexts/UserContext';
import { useNotification } from '../components/notifications/NotificationProvider';
import 'react-day-picker/dist/style.css';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { addNotification } = useNotification();
  const [searchParams, setSearchParams] = React.useState({
    from: '',
    to: '',
    date: new Date(),
  });
  const [searchResults, setSearchResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Format the date as YYYY-MM-DD
    const formattedDate = searchParams.date.toISOString().split('T')[0];
    
    console.log('Search params:', {
      from: searchParams.from,
      to: searchParams.to,
      date: formattedDate
    });
    
    try {
      const url = `http://localhost:5000/api/trains/search?from=${encodeURIComponent(searchParams.from)}&to=${encodeURIComponent(searchParams.to)}&date=${encodeURIComponent(formattedDate)}`;
      console.log('Making API call to:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Search results:', data);
      
      if (data.length === 0) {
        addNotification({
          title: 'No Trains Found',
          message: 'No available trains for the selected route and date.',
          type: 'info'
        });
      } else {
        setSearchResults(data);
        addNotification({
          title: 'Trains Found',
          message: `Found ${data.length} trains for your search.`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      addNotification({
        title: 'Search Error',
        message: 'Failed to search for trains. Please ensure the backend server is running.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = (trainId) => {
    if (!user) {
      navigate('/login');
    } else {
      navigate(`/booking/${trainId}`);
    }
  };

  return (
    <div className="space-y-8 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Search Available Trains</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="From"
                value={searchParams.from}
                onChange={(e) => setSearchParams({ ...searchParams, from: e.target.value })}
                required
                className="w-full"
              />
              <Input
                placeholder="To"
                value={searchParams.to}
                onChange={(e) => setSearchParams({ ...searchParams, to: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div className="flex justify-center border rounded-lg p-4">
              <Calendar
                mode="single"
                selected={searchParams.date}
                onSelect={(date) => date && setSearchParams({ ...searchParams, date })}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search Trains'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Trains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                      Arrival: {new Date(train.Arrival_Time).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button onClick={() => handleBooking(train.Train_ID)}>
                    Book Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Home;