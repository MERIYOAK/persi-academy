import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import { buildApiUrl } from '../config/environment';

const LoginPage = () => {
  const navigate = useNavigate();

  const fields = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Enter your email',
      required: true
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Enter your password',
      required: true
    }
  ];

  const links = [
    {
      text: "Don't have an account?",
      linkText: 'Sign up here',
      href: '/register'
    },
    {
      text: 'Forgot your password?',
      linkText: 'Reset it here',
      href: '/reset-password'
    }
  ];

  const handleSubmit = async (data: Record<string, string | File>) => {
    console.log('Login data:', data);
    
    try {
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Store the auth token
        if (result.data?.token) {
          localStorage.setItem('token', result.data.token);
        }
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        // Handle specific error cases
        if (result.message && result.message.includes('verify your email')) {
          alert('Please verify your email address before logging in. Check your inbox for a verification link.');
        } else {
          alert(result.message || 'Login failed. Please check your credentials and try again.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your connection and try again.');
    }
  };

  return (
    <AuthForm
      title="Welcome Back"
      subtitle="Sign in to your account to continue learning"
      fields={fields}
      submitText="Sign In"
      onSubmit={handleSubmit}
      links={links}
      socialAuth={true}
    />
  );
};

export default LoginPage;