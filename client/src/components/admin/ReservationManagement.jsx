// src/components/admin/ReservationManagement.jsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useNotification } from '../components/notifications/NotificationProvider';

export const ReservationManagement = ({ reservation, onUpdate }) => {
  const { addNotification } = useNotification();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    seatNumber: reservation.Seat_Number,
    coach: reservation.Coach,
    status: reservation.Status
  });

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/reservations/${reservation.Reservation_Num}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        addNotification({
          title: 'Success',
          message: 'Reservation updated successfully',
          type: 'success'
        });
        onUpdate();
        setEditing(false);
      } else {
        throw new Error('Failed to update reservation');
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message,
        type: 'error'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Reservation #{reservation.Reservation_Num}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <Input
              label="Seat Number"
              value={formData.seatNumber}
              onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
            />
            <Input
              label="Coach"
              value={formData.coach}
              onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
            />
            <select
              className="w-full border rounded-md p-2"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Pending">Pending</option>
            </select>
            <div className="flex space-x-2">
              <Button onClick={handleUpdate}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p>Seat: {reservation.Seat_Number}</p>
            <p>Coach: {reservation.Coach}</p>
            <p>Status: {reservation.Status}</p>
            <Button onClick={() => setEditing(true)}>Edit</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// src/components/admin/StaffAssignment.jsx
export const StaffAssignment = () => {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    staffId: '',
    trainId: '',
    date: '',
    type: ''
  });
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/staff/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        addNotification({
          title: 'Success',
          message: 'Staff assigned successfully',
          type: 'success'
        });
        setFormData({
          staffId: '',
          trainId: '',
          date: '',
          type: ''
        });
      } else {
        throw new Error('Failed to assign staff');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Staff to Train</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            label="Staff ID"
            value={formData.staffId}
            onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
          />
          <Input
            label="Train ID"
            value={formData.trainId}
            onChange={(e) => setFormData({ ...formData, trainId: e.target.value })}
          />
          <Input
            type="date"
            label="Date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <select
            className="w-full border rounded-md p-2"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="">Select Type</option>
            <option value="Driver">Driver</option>
            <option value="Engineer">Engineer</option>
          </select>
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Staff'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// src/components/admin/WaitlistManagement.jsx
export const WaitlistManagement = () => {
  const { addNotification } = useNotification();
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/waitlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWaitlist(data);
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to fetch waitlist',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/waitlist/promote/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        addNotification({
          title: 'Success',
          message: 'Passenger promoted successfully',
          type: 'success'
        });
        fetchWaitlist();
      } else {
        throw new Error('Failed to promote passenger');
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: error.message,
        type: 'error'
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waitlist Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {waitlist.map((entry) => (
            <div key={entry.Waiting_ID} className="border p-4 rounded-lg">
              <p>Passenger: {entry.Passenger_Name}</p>
              <p>Train: {entry.Train_ID}</p>
              <p>Date: {new Date(entry.Reservation_Date).toLocaleDateString()}</p>
              <Button onClick={() => handlePromote(entry.Waiting_ID)}>
                Promote to Confirmed
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};