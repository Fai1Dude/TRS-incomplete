// src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useUser } from '../contexts/UserContext';

const Reports = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('activeTrains');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    trainId: '',
    passengerId: ''
  });

  const fetchReportData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      switch (activeTab) {
        case 'activeTrains':
          endpoint = `/api/reports/active-trains?date=${filters.date}`;
          break;
        case 'stations':
          endpoint = `/api/reports/stations?trainId=${filters.trainId}`;
          break;
        case 'reservations':
          endpoint = `/api/reports/reservations?passengerId=${filters.passengerId}`;
          break;
        case 'waitlist':
          endpoint = `/api/reports/waitlist?trainId=${filters.trainId}`;
          break;
        case 'loadFactor':
          endpoint = `/api/reports/load-factor?date=${filters.date}`;
          break;
        case 'dependents':
          endpoint = `/api/reports/dependents?date=${filters.date}`;
          break;
      }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const renderReportContent = () => {
    if (loading) return <p className="text-center py-4">Loading...</p>;
    if (error) return <p className="text-center text-red-500 py-4">{error}</p>;

    switch (activeTab) {
      case 'activeTrains':
        return (
          <div className="space-y-4">
            <Input 
              type="date" 
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Train ID</th>
                  <th>Route</th>
                  <th>Departure</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map(train => (
                  <tr key={train.Train_ID}>
                    <td>{train.Train_ID}</td>
                    <td>{train.EName} - {train.AName}</td>
                    <td>{train.Departure_Time}</td>
                    <td>{train.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'loadFactor':
        return (
          <div className="space-y-4">
            <Input 
              type="date" 
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Train ID</th>
                  <th>Route</th>
                  <th>Load Factor</th>
                  <th>Total Seats</th>
                  <th>Occupied Seats</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map(train => (
                  <tr key={train.Train_ID}>
                    <td>{train.Train_ID}</td>
                    <td>{train.EName} - {train.AName}</td>
                    <td>{train.loadFactor}%</td>
                    <td>{train.totalSeats}</td>
                    <td>{train.occupiedSeats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      // Add other cases for different reports...
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="activeTrains">Active Trains</TabsTrigger>
              {user?.role === 'admin' && (
                <>
                  <TabsTrigger value="stations">Stations</TabsTrigger>
                  <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
                  <TabsTrigger value="loadFactor">Load Factor</TabsTrigger>
                  <TabsTrigger value="dependents">Dependents</TabsTrigger>
                </>
              )}
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {renderReportContent()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;