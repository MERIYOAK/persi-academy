import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './i18n'; // Initialize i18n configuration
import { queryClient, initializePersistentCache, saveCacheData } from './lib/queryClient';
import './utils/cacheMigration'; // Auto-migrate old cache entries
import './utils/cacheTester'; // Cache testing utilities
import './utils/userCacheVerifier'; // User data cache verification
import './utils/cachePersistence'; // Enhanced cache persistence
import './utils/cacheInspector'; // Cache inspection utilities
import './utils/cacheClearer'; // Cache clearing utilities
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import ScrollManager from './components/ScrollManager';
import SessionMonitorWrapper from './components/SessionMonitorWrapper';
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
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CoursesPage from './pages/CoursesPage';
import HelpCenterPage from './pages/HelpCenterPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import UserCourseDetailPage from './pages/UserCourseDetailPage';
import CompleteGoogleRegistrationPage from './pages/CompleteGoogleRegistrationPage';
import PaymentFailureHandler from './components/PaymentFailureHandler';

function App() {
  // Initialize persistent cache on app startup
  useEffect(() => {
    initializePersistentCache();
    
    // Start enhanced cache persistence monitoring
    const stopCacheMonitoring = (window as any).CachePersistence?.startCacheMonitoring();
    
    // Save cache data on page unload
    const handleBeforeUnload = () => {
      saveCacheData();
      (window as any).CachePersistence?.forceSaveAllCache();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      if (stopCacheMonitoring) stopCacheMonitoring();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveCacheData(); // Final save on cleanup
      (window as any).CachePersistence?.forceSaveAllCache();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <SessionMonitorWrapper>
          <ScrollManager>
            <PaymentFailureHandler />
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
          <Route path="/checkout/failure" element={<PaymentFailurePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help-center" element={<HelpCenterPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        </Route>

        {/* Google OAuth Callback Route - Outside UserLayout to avoid navbar */}
        <Route path="/auth/google-callback" element={<GoogleCallbackPage />} />
        <Route path="/complete-google-registration" element={<CompleteGoogleRegistrationPage />} />

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
        </Route>
            </Routes>
          </ScrollManager>
        </SessionMonitorWrapper>
      </Router>
    </QueryClientProvider>
  );
}

export default App;