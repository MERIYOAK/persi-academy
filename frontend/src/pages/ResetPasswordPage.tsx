import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/environment';

import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Check if we have a token in the URL (reset mode)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setIsResetMode(true);
    }
  }, [searchParams]);

  const requestResetFields = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Enter your email address',
      required: true
    }
  ];

  const resetPasswordFields = [
    {
      name: 'newPassword',
      label: 'New Password',
      type: 'password',
      placeholder: 'Enter your new password',
      required: true
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Confirm your new password',
      required: true
    }
  ];

  const links = [
    {
      text: 'Remember your password?',
      linkText: 'Sign in here',
      href: '/login'
    },
    {
      text: "Don't have an account?",
      linkText: 'Sign up here',
      href: '/register'
    }
  ];

  const handleRequestReset = async (data: Record<string, string | File>) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await fetch(buildApiUrl('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Request reset error:', error);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data: Record<string, string | File>) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const token = searchParams.get('token');
      const newPassword = data.newPassword as string;
      const confirmPassword = data.confirmPassword as string;

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Validate password strength
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      const response = await fetch(buildApiUrl('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Record<string, string | File>) => {
    if (isResetMode) {
      await handleResetPassword(data);
    } else {
      await handleRequestReset(data);
    }
  };

  if (isResetMode) {
    return (
      <AuthForm
        title="Set New Password"
        subtitle="Enter your new password below"
        fields={resetPasswordFields}
        submitText={loading ? "Resetting..." : "Reset Password"}
        onSubmit={handleSubmit}
        links={links}
        message={message}
        error={error}
        loading={loading}
      />
    );
  }

  return (
    <AuthForm
      title="Reset Password"
      subtitle="Enter your email address and we'll send you a link to reset your password"
      fields={requestResetFields}
      submitText={loading ? "Sending..." : "Send Reset Link"}
      onSubmit={handleSubmit}
      links={links}
      message={message}
      error={error}
      loading={loading}
    />
  );
};

export default ResetPasswordPage;