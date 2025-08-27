import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './i18n'; // Initialize i18n configuration
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import ScrollManager from './components/ScrollManager';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import ProfilePage from './pages/ProfilePage';
import CertificatesPage from './pages/CertificatesPage';
import CertificateVerificationPage from './pages/CertificateVerificationPage';
import CourseDetailPage from './pages/CourseDetailPage';
import DashboardPage from './pages/DashboardPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import AdminUploadPage from './pages/AdminUploadPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import AdminCourseViewPage from './pages/AdminCourseViewPage';
import AdminCourseEditPage from './pages/AdminCourseEditPage';
import AdminCourseVideosPage from './pages/AdminCourseVideosPage';
import AdminVideoUploadPage from './pages/AdminVideoUploadPage';
import AdminVideoPlayerPage from './pages/AdminVideoPlayerPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CoursesPage from './pages/CoursesPage';
import HelpCenterPage from './pages/HelpCenterPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import UserCourseDetailPage from './pages/UserCourseDetailPage';

function App() {
  return (
    <Router>
      <ScrollManager>
        <Routes>
        <Route element={<UserLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/resend-verification" element={<ResendVerificationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/verify" element={<CertificateVerificationPage />} />
          <Route path="/verify/:certificateId" element={<CertificateVerificationPage />} />
          <Route path="/course/:id" element={<CourseDetailPage />} />
          <Route path="/my-course/:id" element={<UserCourseDetailPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/course/:id/watch/:videoId" element={<VideoPlayerPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help-center" element={<HelpCenterPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
        </Route>

        {/* Google OAuth Callback Route - Outside UserLayout to avoid navbar */}
        <Route path="/auth/google-callback" element={<GoogleCallbackPage />} />

        <Route path="/admin" element={
          <AdminAuthProvider>
            <AdminLayout />
          </AdminAuthProvider>
        }>
          <Route path="login" element={<AdminLoginPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="upload" element={<AdminUploadPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="courses/:courseId" element={<AdminCourseViewPage />} />
          <Route path="courses/:courseId/edit" element={<AdminCourseEditPage />} />
          <Route path="courses/:courseId/videos" element={<AdminCourseVideosPage />} />
          <Route path="courses/:courseId/videos/:videoId" element={<AdminVideoPlayerPage />} />
          <Route path="courses/:courseId/videos/upload" element={<AdminVideoUploadPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
      </ScrollManager>
    </Router>
  );
}

export default App;