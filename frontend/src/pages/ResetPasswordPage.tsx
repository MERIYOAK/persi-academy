import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

const ResetPasswordPage = () => {
  const navigate = useNavigate();

  const fields = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Enter your email address',
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

  const handleSubmit = async (data: Record<string, string | File>) => {
    console.log('Reset password data:', data);
    // Here you would typically make an API call to send a reset password email
    // For demo purposes, we'll just simulate the request
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Password reset email sent! Check your inbox for further instructions.');
    navigate('/login');
  };

  return (
    <AuthForm
      title="Reset Password"
      subtitle="Enter your email address and we'll send you a link to reset your password"
      fields={fields}
      submitText="Send Reset Link"
      onSubmit={handleSubmit}
      links={links}
    />
  );
};

export default ResetPasswordPage;