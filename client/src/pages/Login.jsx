// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useUser } from '../contexts/UserContext';
import { useNotification } from '../components/notifications/NotificationProvider';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const { addNotification } = useNotification();

  // State management
  const [userType, setUserType] = useState('passenger');
  const [step, setStep] = useState('credentials');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    otp: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (userType === 'passenger') {
      if (!formData.name || !formData.phone) {
        addNotification({
          title: 'Validation Error',
          message: 'Please fill in all required fields',
          type: 'error'
        });
        return false;
      }
    } else {
      if (!formData.email || !formData.phone) {
        addNotification({
          title: 'Validation Error',
          message: 'Please fill in all required fields',
          type: 'error'
        });
        return false;
      }
    }
    return true;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Use different endpoints for staff and passenger
      const endpoint = userType === 'staff' 
        ? 'http://localhost:5000/api/auth/staff-login'
        : 'http://localhost:5000/api/auth/login';
      

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: userType,
          name: formData.name,
          phone: formData.phone,
          email: formData.email
        })
      });

      const data = await response.json();

      if (data.success) {
        setStep('otp');
        addNotification({
          title: 'OTP Sent',
          message: 'Please use 1111 as the OTP code',
          type: 'success'
        });
      } else {
        addNotification({
          title: 'Error',
          message: data.message || 'Failed to send OTP',
          type: 'error'
        });
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to connect to server',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

// In Login.jsx, modify the handleVerifyOTP function
console.log('Sending login request:', { passengerName: formData.name, phone: formData.phone });
const handleVerifyOTP = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Select the appropriate OTP verification endpoint
    const endpoint = userType === 'staff' 
      ? 'http://localhost:5000/api/auth/verify-otp'
      : 'http://localhost:5000/api/auth/user-verify-otp';

    // Send OTP verification request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: formData.name, // For user verification
        otp: formData.otp
      })
    });

    const data = await response.json();
    console.log('OTP Response:', data);

    if (data.success) {
      login(data.user, 'dummy-token');
      navigate(userType === 'staff' ? '/staff-dashboard' : '/user-dashboard');

      addNotification({
        title: 'Success',
        message: 'Successfully logged in!',
        type: 'success'
      });
    } else {
      addNotification({
        title: 'Error',
        message: data.message || 'Invalid OTP',
        type: 'error'
      });
    }
  } catch (error) {
    console.error('Error during OTP verification:', error);
    addNotification({
      title: 'Error',
      message: 'Verification failed',
      type: 'error'
    });
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {step === 'credentials' ? 'Login' : 'Verify OTP'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'credentials' ? (
            <>
              <Tabs value={userType} onValueChange={setUserType}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="passenger">Passenger</TabsTrigger>
                  <TabsTrigger value="staff">Staff</TabsTrigger>
                </TabsList>

                <TabsContent value="passenger">
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                      <Input
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        name="phone"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="staff">
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                      <Input
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        name="phone"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Continue as guest?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate('/')}
                  >
                    Book Now
                  </Button>
                </p>
              </div>
            </>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <Input
                  name="otp"
                  placeholder="Enter OTP"
                  value={formData.otp}
                  onChange={handleInputChange}
                  maxLength="6"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setStep('credentials')}
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;