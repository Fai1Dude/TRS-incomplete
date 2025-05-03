// src/pages/Payment.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useNotification } from '../components/notifications/NotificationProvider';
import { CreditCard, Building2, Check } from 'lucide-react';
import TicketGenerator from '../components/ticket/TicketGenerator';

const Payment = () => {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // State management
  const [reservation, setReservation] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);
  
  const [cardDetails, setCardDetails] = useState({
    cardHolder: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  // Fetch reservation details
  useEffect(() => {
    const fetchReservationDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/reservations/${reservationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reservation details');
        }

        const data = await response.json();
        setReservation(data);
        addNotification({
          title: 'Reservation Details',
          message: 'Please complete your payment',
          type: 'info'
        });
      } catch (error) {
        addNotification({
          title: 'Error',
          message: error.message,
          type: 'error'
        });
        navigate('/passenger-dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchReservationDetails();
  }, [reservationId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateCardDetails = () => {
    if (!cardDetails.cardHolder.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Please enter card holder name',
        type: 'error'
      });
      return false;
    }
    if (cardDetails.cardNumber.length !== 16) {
      addNotification({
        title: 'Validation Error',
        message: 'Invalid card number',
        type: 'error'
      });
      return false;
    }
    if (!cardDetails.expiryDate.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
      addNotification({
        title: 'Validation Error',
        message: 'Invalid expiry date (MM/YY)',
        type: 'error'
      });
      return false;
    }
    if (cardDetails.cvv.length !== 3) {
      addNotification({
        title: 'Validation Error',
        message: 'Invalid CVV',
        type: 'error'
      });
      return false;
    }
    return true;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'card' && !validateCardDetails()) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/reservations/${reservationId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod,
          amount: reservation.totalAmount,
          cardDetails: paymentMethod === 'card' ? cardDetails : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentSuccess(true);
        setTicketDetails(data.ticketDetails);
        addNotification({
          title: 'Payment Successful',
          message: 'Your ticket has been generated',
          type: 'success'
        });
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (error) {
      addNotification({
        title: 'Payment Failed',
        message: error.message,
        type: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>;
  }

  if (paymentSuccess && ticketDetails) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Check className="h-6 w-6 text-green-500" />
              <CardTitle>Payment Successful!</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-6">
              Your booking has been confirmed. Here's your ticket:
            </p>
            <TicketGenerator reservationDetails={ticketDetails} />
            <div className="flex justify-center mt-6">
              <Button onClick={() => navigate('/passenger-dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
        </CardHeader>
        <CardContent>
          {reservation && (
            <div className="space-y-6">
              {/* Reservation Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Booking Summary</h3>
                <div className="space-y-2">
                  <p>Train: {reservation.EName} to {reservation.AName}</p>
                  <p>Date: {new Date(reservation.Date).toLocaleDateString()}</p>
                  <p>Time: {reservation.Departure_Time}</p>
                  <p>Seat: {reservation.Seat_Number} (Coach {reservation.Coach})</p>
                  <div className="border-t mt-2 pt-2">
                    <p className="font-semibold">
                      Total Amount: SAR {reservation.totalAmount.toFixed(2)}
                    </p>
                    {reservation.Discount_Amount > 0 && (
                      <p className="text-green-600 text-sm">
                        Loyalty Discount: {reservation.Discount_Amount}% applied
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('card')}
                    className="flex-1"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Credit Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('bank')}
                    className="flex-1"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Bank Transfer
                  </Button>
                </div>

                {paymentMethod === 'card' ? (
                  <form onSubmit={handlePayment} className="space-y-4">
                    <Input
                      name="cardHolder"
                      placeholder="Card Holder Name"
                      value={cardDetails.cardHolder}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="cardNumber"
                      placeholder="Card Number"
                      maxLength="16"
                      value={cardDetails.cardNumber}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        name="expiryDate"
                        placeholder="MM/YY"
                        maxLength="5"
                        value={cardDetails.expiryDate}
                        onChange={handleInputChange}
                        required
                      />
                      <Input
                        name="cvv"
                        type="password"
                        placeholder="CVV"
                        maxLength="3"
                        value={cardDetails.cvv}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : `Pay SAR ${reservation.totalAmount.toFixed(2)}`}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Bank Transfer Details</h4>
                      <div className="space-y-2">
                        <p>Bank: Saudi National Bank</p>
                        <p>Account Number: 1234567890</p>
                        <p>IBAN: SA123456789012345678</p>
                        <p className="mt-4">Reference: BOK-{reservationId}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate('/passenger-dashboard')}
                      className="w-full"
                    >
                      Complete Later
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;