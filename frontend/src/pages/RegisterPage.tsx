import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, Phone } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import { buildApiUrl } from '../config/environment';
import { config } from '../config/environment';

const RegisterPage = () => {
  const navigate = useNavigate();

  const fields = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'Enter your first name',
      required: true
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Enter your last name',
      required: true
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Enter your email',
      required: true
    },
    {
      name: 'phoneNumber',
      label: 'Phone Number',
      type: 'tel',
      placeholder: config.SUPPORT_PHONE,
      required: true
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Create a password',
      required: true
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Confirm your password',
      required: true
    },
    {
      name: 'profilePhoto',
      label: 'Profile Photo',
      type: 'file',
      required: false
    }
  ];

  const links = [
    {
      text: 'Already have an account?',
      linkText: 'Sign in here',
      href: '/login'
    }
  ];

  const handleSubmit = async (data: Record<string, string | File>) => {
    console.log('Register data:', data);
    
    // Basic validation
    if (data.password !== data.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Phone number validation
    const phoneNumber = data.phoneNumber as string;
    if (!phoneNumber) {
      alert('Phone number is required');
      return;
    }

    // Basic phone number format validation (international format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert('Please enter a valid international phone number (e.g., +1234567890)');
      return;
    }
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', `${data.firstName} ${data.lastName}`);
      formData.append('email', data.email as string);
      formData.append('phoneNumber', phoneNumber);
      formData.append('password', data.password as string);
      
      // Add profile photo if selected
      if (data.profilePhoto) {
        formData.append('profilePhoto', data.profilePhoto);
      }

      // Make API call to register user
      const response = await fetch(buildApiUrl('/api/auth/register'), {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        if (result.data.verificationRequired) {
          // Show verification message and redirect to home page
          alert(result.message || 'Registration successful! Please check your email to verify your account.');
          navigate('/'); // Redirect to home page, not dashboard
        } else {
          // This shouldn't happen for manual registration, but handle it just in case
          alert('Registration successful! Please check your email to verify your account.');
          navigate('/'); // Redirect to home page
        }
      } else {
        alert(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please check your connection and try again.');
    }
  };

  return (
    <AuthForm
              title="Join QENDIEL Academy"
      subtitle="Create your account to start your YouTube journey"
      fields={fields}
      submitText="Create Account"
      onSubmit={handleSubmit}
      links={links}
      socialAuth={true}
    />
  );
};

export default RegisterPage;