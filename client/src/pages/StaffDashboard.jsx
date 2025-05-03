// src/pages/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useUser } from '../contexts/UserContext';

const StaffDashboard = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('reservations');
  const [reservations, setReservations] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      switch (activeTab) {
        case 'reservations':
          const resResponse = await fetch('http://localhost:5000/api/admin/reservations', { headers });
          const resData = await resResponse.json();
          setReservations(resData);
          break;
        case 'waitlist':
          const waitResponse = await fetch('http://localhost:5000/api/admin/waitlist', { headers });
          const waitData = await waitResponse.json();
          setWaitlist(waitData);
          break;
        case 'staff':
          const staffResponse = await fetch('http://localhost:5000/api/admin/staff', { headers });
          const staffData = await staffResponse.json();
          setStaffList(staffData);
          const trainsResponse = await fetch('http://localhost:5000/api/admin/trains', { headers });
          const trainsData = await trainsResponse.json();
          setTrains(trainsData);
          break;
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteWaitlist = async (waitingId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/admin/waitlist/${waitingId}/promote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setWaitlist(waitlist.filter(item => item.Waiting_ID !== waitingId));
    } catch (err) {
      setError('Failed to promote passenger');
    }
  };

  const handleAssignStaff = async (staffId, trainId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/admin/staff/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ staffId, trainId, date: selectedDate })
      });
      fetchDashboardData();
    } catch (err) {
      setError('Failed to assign staff');
    }
  };

  const Reservations = () => (
    <div className="space-y-4">
      {reservations.map((reservation) => (
        <Card key={reservation.Reservation_Num}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Booking #{reservation.Reservation_Num}</p>
                <p className="text-sm text-gray-500">
                  Passenger: {reservation.Passenger_Name}
                </p>
                <p className="text-sm text-gray-500">
                  Train: {reservation.EName} to {reservation.AName}
                </p>
                <p className="text-sm text-gray-500">
                  Date: {new Date(reservation.Date).toLocaleDateString()}
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {/* Handle edit */}}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {/* Handle cancel */}}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const Waitlist = () => (
    <div className="space-y-4">
      {waitlist.map((item) => (
        <Card key={item.Waiting_ID}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">
                  {item.Passenger_Name}
                </p>
                <p className="text-sm text-gray-500">
                  Train: {item.EName} to {item.AName}
                </p>
                <p className="text-sm text-gray-500">
                  Date: {new Date(item.Date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Loyalty Class: {item.Classtype || 'Standard'}
                </p>
              </div>
              <Button
                onClick={() => handlePromoteWaitlist(item.Waiting_ID)}
              >
                Promote to Confirmed
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const StaffAssignment = () => (
    <div className="space-y-4">
      <div className="flex space-x-4 mb-4">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>
      
      {trains.map((train) => (
        <Card key={train.Train_ID}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {train.EName} to {train.AName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Departure: {train.Departure_Time}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {['Driver', 'Ticketing', 'Booking'].map((role) => (
                  <div key={role} className="space-y-2">
                    <p className="text-sm font-medium">{role}</p>
                    <select
                      className="w-full border rounded-md p-2"
                      onChange={(e) => handleAssignStaff(e.target.value, train.Train_ID)}
                    >
                      <option value="">Select Staff</option>
                      {staffList
                        .filter(staff => staff.DType === role)
                        .map(staff => (
                          <option key={staff.Staff_ID} value={staff.Staff_ID}>
                            {staff.StaffFname} {staff.StaffLname}
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Staff Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
              <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
              <TabsTrigger value="staff">Staff Assignment</TabsTrigger>
            </TabsList>

            <TabsContent value="reservations">
              <Reservations />
            </TabsContent>

            <TabsContent value="waitlist">
              <Waitlist />
            </TabsContent>

            <TabsContent value="staff">
              <StaffAssignment />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-500 text-center p-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;