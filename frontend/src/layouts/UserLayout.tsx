import React from 'react';
import { Outlet } from 'react-router-dom';
import UserNavbar from '../components/nav/UserNavbar';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';

const UserLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UserNavbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer className="relative z-30" />
      <ScrollToTop />
    </div>
  );
};

export default UserLayout; 