import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import api from '../utils/api';
import { CheckCircle, XCircle } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      await api.get(`/auth/verify-email?token=${token}`);
      setStatus('success');
      toast.success('Email verified successfully');
    } catch (error) {
      setStatus('error');
      toast.error('Verification failed');
    }
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
      <Card className="w-full max-w-md relative z-10 shadow-xl text-center">
        <CardHeader className="space-y-4">
          {status === 'verifying' && (
            <>
              <div className="mx-auto animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <CardTitle className="text-2xl">Verifying Email</CardTitle>
              <CardDescription>Please wait...</CardDescription>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <CardTitle className="text-2xl">Email Verified!</CardTitle>
              <CardDescription>Your email has been successfully verified</CardDescription>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <CardTitle className="text-2xl">Verification Failed</CardTitle>
              <CardDescription>Invalid or expired verification link</CardDescription>
            </>
          )}
        </CardHeader>
        {status !== 'verifying' && (
          <CardContent>
            <Button onClick={() => navigate('/signin')} className="w-full">
              Go to Sign In
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmail;
