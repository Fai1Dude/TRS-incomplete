import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '../contexts/UserContext';
import { AlertCircle, Users, Train, Calendar as CalendarIcon } from 'lucide-react';

const TrainManagement = () => {
  const { user } = useUser();
  const [activeTrains, setActiveTrains] = useState([]);
  const [stations, setStations] = useState([]);
  const [waitlistPassengers, setWaitlistPassengers] = useState([]);
  const [loadFactor, setLoadFactor] = useState([]);
  const [dependents, setDependents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTrain, setSelectedTrain] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveTrains();
  }, []);

  const fetchActiveTrains = async () => {
    try {
      const response = await fetch('/api/reports/active-trains');
      const data = await response.json();
      setActiveTrains(data);
    } catch (error) {
      console.error('Error fetching active trains:', error);
    }
  };

  const fetchStations = async (trainId) => {
    if (!user?.role === 'admin') return;
    try {
      const response = await fetch(`/api/reports/stations/${trainId}`);
      const data = await response.json();
      setStations(data);
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  const fetchWaitlistPassengers = async (trainId) => {
    if (!user?.role === 'admin') return;
    try {
      const response = await fetch(`/api/reports/waitlist/${trainId}`);
      const data = await response.json();
      setWaitlistPassengers(data);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    }
  };

  const fetchLoadFactor = async (date) => {
    if (!user?.role === 'admin') return;
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const response = await fetch(`/api/reports/load-factor?date=${formattedDate}`);
      const data = await response.json();
      setLoadFactor(data);
    } catch (error) {
      console.error('Error fetching load factor:', error);
    }
  };

  const fetchDependents = async (date) => {
    if (!user?.role === 'admin') return;
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const response = await fetch(`/api/reports/dependents?date=${formattedDate}`);
      const data = await response.json();
      setDependents(data);
    } catch (error) {
      console.error('Error fetching dependents:', error);
    }
  };

  const promoteWaitlistPassenger = async (waitingId) => {
    if (!user?.role === 'admin') return;
    try {
      await fetch(`/api/admin/waitlist/promote/${waitingId}`, {
        method: 'POST'
      });
      fetchWaitlistPassengers(selectedTrain);
    } catch (error) {
      console.error('Error promoting passenger:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Trains Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Train className="h-5 w-5" />
            Active Trains
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeTrains.map(train => (
              <div key={train.Train_ID} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{train.EName} to {train.AName}</p>
                  <p className="text-sm text-gray-500">
                    Departure: {new Date(train.Departure_Time).toLocaleTimeString()}
                  </p>
                </div>
                {user?.role === 'admin' && (
                  <Button onClick={() => setSelectedTrain(train.Train_ID)}>
                    View Details
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Only Sections */}
      {user?.role === 'admin' && (
        <>
          {/* Stations Section */}
          <Card>
            <CardHeader>
              <CardTitle>Train Stations</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter Train ID"
                value={selectedTrain}
                onChange={(e) => {
                  setSelectedTrain(e.target.value);
                  fetchStations(e.target.value);
                }}
              />
              <div className="mt-4 space-y-2">
                {stations.map(station => (
                  <div key={station.Station_ID} className="p-2 border rounded">
                    <p>{station.Station_Name} - {station.City}</p>
                    <p className="text-sm text-gray-500">Sequence: {station.Seq_Num}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Load Factor Section */}
          <Card>
            <CardHeader>
              <CardTitle>Load Factor Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Calendar
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    fetchLoadFactor(date);
                  }}
                />
              </div>
              <div className="space-y-2">
                {loadFactor.map(train => (
                  <div key={train.Train_ID} className="p-4 border rounded-lg">
                    <p className="font-medium">{train.EName} to {train.AName}</p>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 rounded-full h-2"
                        style={{ width: `${train.load_factor}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Load Factor: {train.load_factor}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Waitlist Management Section */}
          <Card>
            <CardHeader>
              <CardTitle>Waitlist Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter Train ID"
                value={selectedTrain}
                onChange={(e) => {
                  setSelectedTrain(e.target.value);
                  fetchWaitlistPassengers(e.target.value);
                }}
              />
              <div className="mt-4 space-y-4">
                {waitlistPassengers.map(passenger => (
                  <div key={passenger.Waiting_ID} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{passenger.Passenger_Name}</p>
                        <p className="text-sm text-gray-500">
                          Loyalty Tier: {passenger.Tier}
                        </p>
                      </div>
                      <Button onClick={() => promoteWaitlistPassenger(passenger.Waiting_ID)}>
                        Promote
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dependents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Travelling Dependents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  fetchDependents(date);
                }}
              />
              <div className="mt-4 space-y-2">
                {dependents.map(dependent => (
                  <div key={dependent.Dependent_ID} className="p-4 border rounded-lg">
                    <p className="font-medium">{dependent.Dependent_Name}</p>
                    <p className="text-sm text-gray-500">
                      Age: {dependent.Age} | Relationship: {dependent.Relationship}
                    </p>
                    <p className="text-sm text-gray-500">
                      Primary Passenger: {dependent.Passenger_Name}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TrainManagement;