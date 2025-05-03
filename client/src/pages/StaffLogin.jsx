// src/pages/StaffLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useUser } from '../contexts/UserContext';

const StaffLogin = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [step, setStep] = useState('credentials');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    otp: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (step === 'credentials') {
        // First step: send credentials
        const response = await fetch('http://localhost:5000/api/auth/staff-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            phone: formData.phone
          })
        });

        const data = await response.json();
        console.log('Login response:', data);
        
        if (data.success) {
          setStep('otp');
        } else {
          console.error('Login failed:', data.message);
        }
      } else {
        // Second step: verify OTP
        const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            otp: formData.otp
          })
        });

        const data = await response.json();
        console.log('OTP verification response:', data);

        if (data.success) {
          login(data.user, 'dummy-token');
          console.log('Navigation to dashboard...');
          navigate('/staff-dashboard');
        } else {
          console.error('OTP verification failed:', data.message);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {step === 'credentials' ? 'Staff Login' : 'Enter OTP'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 'credentials' ? (
              <>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </>
            ) : (
              <>
                <Input
                  name="otp"
                  placeholder="Enter OTP (1111)"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
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
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffLogin;