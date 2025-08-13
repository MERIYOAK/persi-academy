import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert, BookOpen } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import AvatarMenu from './AvatarMenu';

const AdminNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAdminAuth();

  const navigation = useMemo(() => ([
    { name: 'Dashboard', href: '/admin/dashboard' },
    { name: 'Courses', href: '/admin/courses' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Settings', href: '/admin/settings' },
  ]), []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-red-700 to-red-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">YT Academy</span>
            </Link>
            <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-white text-red-700">Admin</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-white border-b-2 border-white'
                    : 'text-red-100 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <AvatarMenu variant="admin" />
            ) : (
              <Link
                to="/admin/login"
                className="text-white/90 hover:text-white transition-colors duration-200 flex items-center space-x-1"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Admin Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-white/90 transition-colors duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-red-800 border-t border-red-700 animate-in slide-in-from-top-2">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-white bg-red-700'
                    : 'text-red-100 hover:text-white hover:bg-red-700'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="border-t border-red-700 pt-4 pb-3">
              {isAuthenticated ? (
                <div className="px-3">
                  <AvatarMenu variant="admin" />
                </div>
              ) : (
                <Link
                  to="/admin/login"
                  className="block px-3 py-2 text-base font-medium text-white hover:text-white/90"
                  onClick={() => setIsOpen(false)}
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar; 