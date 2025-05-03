// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useUser } from '../../contexts/UserContext';
import { useNotification } from '../notifications/NotificationProvider';
import { apiService } from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const { addNotification } = useNotification();
  const [step, setStep] = useState('credentials');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    otp: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (step === 'credentials') {
        const response = await apiService.login({
          name: formData.name,
          phone: formData.phone
        });

        if (response.success) {
          setStep('otp');
          addNotification({
            title: 'Success',
            message: 'OTP sent successfully',
            type: 'success'
          });
        }
      } else {
        const response = await apiService.verifyOtp({
          name: formData.name,
          otp: formData.otp
        });

        if (response.success) {
          apiService.setToken(response.token);
          login(response.user);
          navigate('/passenger-dashboard');
        }
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
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{step === 'credentials' ? 'Login' : 'Enter OTP'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 'credentials' ? (
              <>
                <Input
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </>
            ) : (
              <Input
                placeholder="Enter OTP"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                maxLength="4"
                required
              />
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : step === 'credentials' ? 'Send OTP' : 'Verify OTP'}
            </Button>
            {step === 'otp' && (
              <Button 
                type="button" 
                variant="link" 
                className="w-full"
                onClick={() => setStep('credentials')}
              >
                Back to Login
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;