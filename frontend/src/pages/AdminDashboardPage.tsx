import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { BookOpen, Users, Play, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminUser {
  email: string;
  role: string;
  type: string;
}

interface AdminStats {
  totalCourses: number;
  totalUsers: number;
  totalVideos: number;
  totalRevenue: number;
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { adminUser, isAuthenticated, isLoading } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login');
      return;
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:5000/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        } else {
          console.error('Failed to fetch admin stats');
        }
      } catch (error) {
        console.error('Error loading admin stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadStats();
    }
    
    // Refresh stats when a course is created
    const onCreated = () => loadStats();
    window.addEventListener('course:created', onCreated as EventListener);
    return () => window.removeEventListener('course:created', onCreated as EventListener);
  }, [isAuthenticated]);

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const adminStats = [
    { 
      title: 'Total Users', 
      value: stats ? formatNumber(stats.totalUsers) : '...', 
      icon: Users, 
      color: 'bg-blue-500' 
    },
    { 
      title: 'Total Courses', 
      value: stats ? formatNumber(stats.totalCourses) : '...', 
      icon: BookOpen, 
      color: 'bg-green-500' 
    },
    { 
      title: 'Total Revenue', 
      value: stats ? formatCurrency(stats.totalRevenue) : '...', 
      icon: TrendingUp, 
      color: 'bg-purple-500' 
    },
    { 
      title: 'Total Videos', 
      value: stats ? formatNumber(stats.totalVideos) : '...', 
      icon: Play, 
      color: 'bg-red-500' 
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page title */}
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back{adminUser?.email ? `, ${adminUser.email}` : ''}</p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex space-x-4">
            <Link
              to="/admin/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Course
            </Link>
            <Link
              to="/admin/courses"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              View All Courses
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {adminStats.map((stat) => (
              <div key={stat.title} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/admin/upload"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-red-100">
                  <Plus className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Upload Course</h3>
                  <p className="text-sm text-gray-500">Add a new course to the platform</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/courses"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Manage Courses</h3>
                  <p className="text-sm text-gray-500">View and edit existing courses</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-500">Manage user accounts and permissions</p>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage; 