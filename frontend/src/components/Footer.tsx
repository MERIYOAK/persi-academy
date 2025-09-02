import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Mail, Phone, MapPin, Youtube, Twitter, Instagram, Shield } from 'lucide-react';
import logoImage from '../assets/images/LOGO.jpg';

interface FooterProps {
  className?: string;
  openCookieSettingsRef?: React.MutableRefObject<(() => void) | null>;
}

const Footer: React.FC<FooterProps> = ({ className = '', openCookieSettingsRef }) => {
  const { t } = useTranslation();
  
  return (
    <footer className={`bg-gray-900 text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
                        <Link to="/" className="flex items-center space-x-3">
              <img 
                src={logoImage} 
                                  alt="QENDIEL Academy Logo" 
                className="h-12 w-auto object-contain"
              />
              <span className="text-2xl font-bold">{t('brand.name')}</span>
            </Link>
            <p className="text-gray-400 leading-relaxed">
              {t('footer.contact_info')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors duration-200">
                <Youtube className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors duration-200">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors duration-200">
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{t('footer.social_links')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/courses" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {t('navbar.courses')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {t('navbar.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {t('navbar.contact')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {t('navbar.dashboard')}
                </Link>
              </li>
            </ul>
            
            {/* Verify Certificate Button */}
            <div className="pt-2">
              <Link 
                to="/verify" 
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">{t('footer.verify_certificate')}</span>
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{t('footer.follow_us')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help-center" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {t('footer.help_center')}
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {t('footer.terms_of_service')}
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {t('footer.privacy_policy')}
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {t('footer.refund_policy')}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openCookieSettingsRef?.current && openCookieSettingsRef.current()}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {t('footer.cookie_settings')}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{t('footer.contact_info')}</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-red-500" />
                <span className="text-gray-400">{t('footer.email')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-red-500" />
                <span className="text-gray-400">{t('footer.phone')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-red-500" />
                <span className="text-gray-400">{t('footer.address')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center gap-2 text-gray-400 text-sm">
              <p>
                © {new Date().getFullYear()} {t('footer.copyright')}
              </p>
              <span className="hidden md:inline">•</span>
              <span className="inline-flex items-center tilt-wobble">
                <span className="mr-1">{t('footer.made_by')}</span>
                <a
                  href="https://www.meronvault.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-block font-extrabold tracking-wider bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent drop-shadow transition-all duration-500 transform hover:scale-125 hover:-rotate-6 hover:skew-x-6 hover:skew-y-1 hover:brightness-125 animate-neon-pulse spin-on-hover"
                >
                  MERONI
                  <span className="absolute inset-0 -z-10 pointer-events-none blur-md opacity-80 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded animate-gradient-shift"></span>
                </a>
              </span>
            </div>
            <div className="flex hide-under-500 space-x-6 mt-4 md:mt-0">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                {t('footer.privacy_policy')}
              </Link>
              <Link to="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                {t('footer.terms_of_service')}
              </Link>
              <Link to="/help-center" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                {t('footer.help')}
              </Link>
              <Link to="/verify" className="text-gray-400 hover:text-white text-sm transition-colors duration-200 flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>{t('footer.verify_certificate')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;