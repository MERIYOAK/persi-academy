import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, Upload, Award } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface AvatarMenuProps {
  variant: 'user' | 'admin';
  profileImageUrl?: string | null;
}

const AvatarMenu: React.FC<AvatarMenuProps> = ({ variant, profileImageUrl }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Only use admin auth when variant is 'admin'
  const adminAuth = variant === 'admin' ? useAdminAuth() : null;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleLogout = () => {
    if (variant === 'admin' && adminAuth) {
      adminAuth.logout();
    } else {
      localStorage.removeItem('token');
    }
    window.location.href = variant === 'admin' ? '/admin/login' : '/login';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-2 focus:outline-none group p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        aria-label="Open user menu"
      >
        <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center shadow overflow-hidden ${
          variant === 'admin' ? 'bg-red-600' : 'bg-gray-200'
        }`}>
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt="Profile"
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback to icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<svg class="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>';
                }
              }}
            />
          ) : (
            <User className={`h-4 w-4 sm:h-5 sm:w-5 ${variant === 'admin' ? 'text-white' : 'text-gray-700'}`} />
          )}
        </div>
        <svg
          className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 group-hover:text-gray-700 transition-colors duration-200"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.12l3.71-3.89a.75.75 0 111.08 1.04l-4.25 4.46a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-xl ring-1 ring-black/5 z-50">
          <div className="py-1">
            {variant === 'admin' ? (
              <>
                <Link to="/admin/dashboard" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                  <LayoutDashboard className="h-4 w-4 mr-3" /> Admin Dashboard
                </Link>
                <Link to="/admin/upload" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                  <Upload className="h-4 w-4 mr-3" /> Upload Course
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                  <LayoutDashboard className="h-4 w-4 mr-3" /> Dashboard
                </Link>
                <Link to="/profile" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                  <User className="h-4 w-4 mr-3" /> Profile
                </Link>
                <Link to="/certificates" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                  <Award className="h-4 w-4 mr-3" /> My Certificates
                </Link>
              </>
            )}
            <div className="border-t border-gray-100 my-1"></div>
            <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
              <LogOut className="h-4 w-4 mr-3" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarMenu; 