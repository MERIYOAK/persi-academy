import React, { useState, useMemo, useEffect } from 'react';
import { buildApiUrl } from '../../config/environment';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen } from 'lucide-react';
import AvatarMenu from './AvatarMenu';
import LanguageToggler from '../LanguageToggler';
import { useNavbarAutoHide } from '../../hooks/useNavbarAutoHide';

const UserNavbar: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const { isVisible } = useNavbarAutoHide(100);
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  // Close mobile menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  const navigation = useMemo(() => ([
    { name: t('navbar.home'), href: '/' },
    { name: t('navbar.courses'), href: '/courses' },
    { name: t('navbar.about'), href: '/about' },
    { name: t('navbar.contact'), href: '/contact' },
  ]), [t]);

  const isActive = (path: string) => location.pathname === path;

  // Fetch profile image when user is authenticated
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!isAuthenticated) {
        setProfileImageUrl(null);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // First, get user data to check if they have a profile photo
        const userResponse = await fetch(buildApiUrl('/api/auth/me'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (userResponse.ok) {
          const userResult = await userResponse.json();
          
          // Only fetch profile photo if user has a profilePhotoKey
          if (userResult.data.profilePhotoKey) {
            const photoResponse = await fetch(buildApiUrl('/api/auth/users/me/photo'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

            if (photoResponse.ok) {
              const photoResult = await photoResponse.json();
              setProfileImageUrl(photoResult.data.photoUrl);
            } else {
              console.log('Profile photo not available');
              setProfileImageUrl(null);
            }
          } else {
            // User doesn't have a profile photo
            setProfileImageUrl(null);
          }
        }
      } catch (error) {
        console.log('Profile photo not available');
        setProfileImageUrl(null);
      }
    };

    fetchProfileImage();
  }, [isAuthenticated]);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 transition-transform duration-200 hover:scale-105">
              <div className="bg-red-600 p-1.5 sm:p-2 rounded-lg shadow-lg">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="hidden sm:block text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{t('brand.name')}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 text-sm font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  isActive(item.href)
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-700 hover:text-red-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageToggler />
            {isAuthenticated ? (
              <AvatarMenu variant="user" profileImageUrl={profileImageUrl} />
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-red-600 transition-all duration-300 ease-in-out transform hover:scale-105 font-semibold"
                >
                  {t('navbar.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                >
                  {t('navbar.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button - Enhanced for touch */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageToggler />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-700 hover:text-red-600 transition-all duration-300 ease-in-out transform hover:scale-105 rounded-lg hover:bg-gray-100"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Enhanced for Small Screens */}
      {isOpen && (
        <div 
          className="md:hidden transition-all duration-300 ease-in-out"
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            maxHeight: 'calc(100vh - 4rem)',
            overflowY: 'auto'
          }}
        >
          <div className="px-3 sm:px-4 pt-3 pb-4 space-y-1">
            {/* Navigation Links */}
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-4 py-3 text-sm sm:text-base font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 rounded-lg ${
                  isActive(item.href)
                    ? 'text-red-600 bg-red-50 border-l-4 border-red-600'
                    : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            

            
            {/* Divider */}
            <div className="border-t border-gray-200 my-3"></div>
            
            {/* Auth Section */}
              {isAuthenticated ? (
               <div className="px-4 py-2">
                 <div className="text-xs text-gray-500 mb-3 font-medium">ACCOUNT</div>
                 <div className="space-y-2">
                                       <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-3 text-sm sm:text-base font-semibold text-gray-700 hover:text-red-600 transition-all duration-300 ease-in-out rounded-lg hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                     <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                     </svg>
                     {t('navbar.dashboard')}
                   </Link>
                                       <Link
                      to="/profile"
                      className="flex items-center px-4 py-3 text-sm sm:text-base font-semibold text-gray-700 hover:text-red-600 transition-all duration-300 ease-in-out rounded-lg hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                     <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                     </svg>
                     {t('navbar.profile')}
                   </Link>
                                       <Link
                      to="/certificates"
                      className="flex items-center px-4 py-3 text-sm sm:text-base font-semibold text-gray-700 hover:text-red-600 transition-all duration-300 ease-in-out rounded-lg hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                     <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                     </svg>
                     My Certificates
                   </Link>
                   <div className="border-t border-gray-200 my-2"></div>
                                       <button
                      onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                        setIsOpen(false);
                      }}
                      className="w-full text-left flex items-center px-4 py-3 text-sm sm:text-base font-semibold text-gray-700 hover:text-red-600 transition-all duration-300 ease-in-out rounded-lg hover:bg-gray-50"
                    >
                     <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                     </svg>
                     {t('navbar.logout')}
                   </button>
                 </div>
                </div>
              ) : (
              <div className="space-y-3">
                <div className="text-xs text-gray-500 px-4 font-medium">AUTHENTICATION</div>
                                     <Link
                     to="/login"
                   className="block px-4 py-3 text-sm sm:text-base font-semibold text-gray-700 hover:text-red-600 transition-all duration-300 ease-in-out rounded-lg hover:bg-gray-50"
                     onClick={() => setIsOpen(false)}
                   >
                     {t('navbar.login')}
                   </Link>
                                     <Link
                     to="/register"
                   className="block mx-4 py-3 px-4 bg-red-600 text-white text-center rounded-lg hover:bg-red-700 transition-all duration-300 ease-in-out transform hover:scale-105 font-semibold text-sm sm:text-base shadow-lg"
                     onClick={() => setIsOpen(false)}
                   >
                     {t('navbar.register')}
                   </Link>
                </div>
              )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar; 