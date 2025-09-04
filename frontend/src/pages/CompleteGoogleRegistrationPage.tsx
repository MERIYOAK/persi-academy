import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Phone, CheckCircle, XCircle, Loader } from 'lucide-react';
import { buildApiUrl } from '../config/environment';
import ScrollToTop from '../components/ScrollToTop';

const CompleteGoogleRegistrationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState<'input' | 'loading' | 'success' | 'error'>('input');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Get user data from URL parameters
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  const name = searchParams.get('name');

  useEffect(() => {
    // Validate required parameters
    if (!userId || !email || !name) {
      setStatus('error');
      setError('Invalid registration link. Please try signing in with Google again.');
    }
  }, [userId, email, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid international phone number (e.g., +1234567890)');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const response = await fetch(buildApiUrl('/api/auth/complete-google-registration'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          phoneNumber: phoneNumber.trim()
        })
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(result.message || 'Registration completed successfully!');
        
        // Store the token and redirect to dashboard
        if (result.data?.token) {
          localStorage.setItem('token', result.data.token);
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } else {
        setStatus('error');
        setError(result.message || 'Failed to complete registration. Please try again.');
      }
    } catch (error) {
      console.error('Complete registration error:', error);
      setStatus('error');
      setError('Network error. Please check your connection and try again.');
    }
  };

  const handleRetry = () => {
    setStatus('input');
    setError('');
    setPhoneNumber('');
  };

  if (status === 'error' && (!userId || !email || !name)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <ScrollToTop />
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid Registration Link</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center pt-16 pb-12 px-4">
      <ScrollToTop />
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Complete Registration</h2>
            <p className="mt-2 text-gray-600">
              Welcome, {name}! Please provide your phone number to complete your account setup.
            </p>
            <p className="mt-1 text-sm text-gray-500">{email}</p>
          </div>

          {status === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    id="phoneNumber"
                    type="tel"
                    required
                    className="appearance-none relative block w-full pl-12 pr-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Enter your phone number in international format (e.g., +1234567890)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Complete Registration
              </button>
            </form>
          )}

          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader className="h-16 w-16 text-red-600 animate-spin mx-auto" />
              <h3 className="text-xl font-semibold text-gray-800">Completing Registration...</h3>
              <p className="text-gray-600">Please wait while we set up your account.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-800">Registration Complete!</h3>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-800">Registration Failed</h3>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={handleRetry}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompleteGoogleRegistrationPage;
