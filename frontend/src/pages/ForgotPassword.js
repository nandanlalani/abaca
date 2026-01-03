import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Mail, Clock, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('email'); // 'email', 'otp', 'reset', 'link-sent'
  const [resetMethod, setResetMethod] = useState('link'); // 'link' or 'otp'
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (resetMethod === 'link') {
        const response = await api.post('/auth/forgot-password', { email });
        if (response.data.success) {
          toast.success('Password reset link sent to your email');
          setStep('link-sent');
        }
      } else {
        const response = await api.post('/auth/send-otp', { email });
        if (response.data.success) {
          toast.success('OTP sent to your email');
          setStep('otp');
          setResendTimer(60);
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Email not found in our system. Please contact your administrator.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to send reset request');
      }
    }

    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      if (response.data.success) {
        toast.success('OTP verified successfully');
        setStep('reset');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Email not found in our system. Please contact your administrator.');
      } else {
        toast.error(error.response?.data?.message || 'Invalid OTP');
      }
    }

    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password-otp', { 
        email, 
        otp, 
        new_password: newPassword 
      });
      if (response.data.success) {
        toast.success('Password reset successfully');
        window.location.href = '/signin';
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Email not found in our system. Please contact your administrator.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      }
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      const response = await api.post('/auth/send-otp', { email });
      if (response.data.success) {
        toast.success('New OTP sent to your email');
        setResendTimer(60);
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResendTimer(0);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1766866763822-985dbc6f3405?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MjQyMTd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwb2ZmaWNlJTIwYXJjaGl0ZWN0dXJlJTIwYnJpZ2h0fGVufDB8fHx8MTc2NzM4OTY3NXww&ixlib=rb-4.1.0&q=85)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <Card className="w-full max-w-md relative z-10 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight">
            {step === 'email' ? 'Forgot Password' : 
             step === 'otp' ? 'Enter OTP' : 
             step === 'reset' ? 'Reset Password' : 'Check Your Email'}
          </CardTitle>
          <CardDescription className="text-base">
            {step === 'email' ? 'Choose how you want to reset your password' :
             step === 'otp' ? 'Enter the OTP sent to your email' :
             step === 'reset' ? 'Enter your new password' :
             'We\'ve sent a reset link to your email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <div className="space-y-4">
              <div className="flex space-x-2 mb-4">
                <Button
                  type="button"
                  variant={resetMethod === 'link' ? 'default' : 'outline'}
                  onClick={() => setResetMethod('link')}
                  className="flex-1"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Link
                </Button>
                <Button
                  type="button"
                  variant={resetMethod === 'otp' ? 'default' : 'outline'}
                  onClick={() => setResetMethod('otp')}
                  className="flex-1"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  OTP Code
                </Button>
              </div>
              
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 
                   resetMethod === 'link' ? 'Send Reset Link' : 'Send OTP Code'}
                </Button>
              </form>
            </div>
          )}

          {step === 'link-sent' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Check your email and click the link to reset your password. The link will expire in 1 hour.
                </p>
              </div>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => handleEmailSubmit({ preventDefault: () => {} })}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Link
                </Button>
                <Button variant="ghost" className="w-full" onClick={resetForm}>
                  Use Different Email
                </Button>
              </div>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                />
                <p className="text-xs text-muted-foreground text-center">
                  OTP sent to {email}
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              
              <div className="text-center space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || loading}
                  className="text-sm"
                >
                  {resendTimer > 0 ? (
                    <>
                      <Clock className="w-4 h-4 mr-1" />
                      Resend in {resendTimer}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Resend OTP
                    </>
                  )}
                </Button>
                <br />
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  Use Different Email
                </Button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {step === 'email' && (
            <div className="mt-6 text-center text-sm">
              <Link to="/signin" className="text-primary hover:underline">
                Back to Sign In
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
