import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

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
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', `${data.firstName} ${data.lastName}`);
      formData.append('email', data.email as string);
      formData.append('password', data.password as string);
      
      // Add profile photo if selected
      if (data.profilePhoto) {
        formData.append('profilePhoto', data.profilePhoto);
      }

      // Make API call to register user
      const response = await fetch('http://localhost:5000/api/auth/register', {
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
      title="Join YT Academy"
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