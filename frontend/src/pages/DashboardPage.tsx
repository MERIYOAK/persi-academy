import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, TrendingUp, Award, User, Settings, LogOut, Search, Play, CheckCircle } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  authProvider: string;
  profilePhotoKey?: string;
  isVerified: boolean;
  createdAt: string;
  purchasedCourses?: string[];
}

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  totalLessons: number;
  price: number;
  instructor: string;
  category: string;
  rating: number;
  enrolledStudents: number;
}

interface EnrolledCourse extends Course {
  progress: number;
  completedLessons: number;
  lastWatched?: string;
  enrolledAt: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Fetch user data and enrolled courses
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch user profile
        const userResponse = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userResult = await userResponse.json();
        setUserData(userResult.data);

        // Fetch profile image if available
        if (userResult.data.profilePhotoKey) {
          try {
            const photoResponse = await fetch('http://localhost:5000/api/auth/users/me/photo', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (photoResponse.ok) {
              const photoResult = await photoResponse.json();
              setProfileImageUrl(photoResult.data.photoUrl);
            }
          } catch (photoError) {
            console.log('Profile photo not available');
          }
        }

        // Fetch enrolled courses (for now, we'll use purchased courses as enrolled)
        const coursesResponse = await fetch('http://localhost:5000/api/courses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (coursesResponse.ok) {
          const coursesResult = await coursesResponse.json();
          const allCourses = coursesResult.data.courses || [];
          
          // Filter courses that user has purchased and add mock progress data
          const userCourses = allCourses
            .filter((course: Course) => (userResult.data.purchasedCourses || []).includes(course._id))
            .map((course: Course) => ({
              ...course,
              progress: Math.floor(Math.random() * 100), // Mock progress for now
              completedLessons: Math.floor(Math.random() * course.totalLessons),
              lastWatched: Math.floor(Math.random() * course.totalLessons) + 1,
              enrolledAt: new Date().toISOString()
            }));
          
          setEnrolledCourses(userCourses);
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/profile'); // You can create a profile/settings page
  };

  const filteredCourses = enrolledCourses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      icon: BookOpen,
      label: 'Enrolled Courses',
      value: enrolledCourses.length,
      color: 'text-blue-600'
    },
    {
      icon: Award,
      label: 'Completed',
      value: enrolledCourses.filter(course => course.progress === 100).length,
      color: 'text-green-600'
    },
    {
      icon: Clock,
      label: 'Total Watch Time',
      value: `${enrolledCourses.reduce((total, course) => {
        const hours = parseFloat(course.duration.replace(' hours', ''));
        return total + (hours * course.progress / 100);
      }, 0).toFixed(1)} hours`,
      color: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      label: 'Learning Streak',
      value: `${Math.floor(Math.random() * 30) + 1} days`,
      color: 'text-red-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <User className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <User className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">Please log in to access your dashboard</p>
          <Link
            to="/login"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-full">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={userData.name}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={() => setProfileImageUrl(null)}
                  />
                ) : (
                  <User className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Welcome back, {userData.name}!
                </h1>
                <p className="text-gray-600">
                  Member since {new Date(userData.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })} • Continue your learning journey
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <button 
                onClick={handleSettings}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Learning Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
              Continue Learning
            </h2>
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {enrolledCourses.length === 0 ? 'No courses enrolled yet' : 'No courses found'}
              </h3>
              <p className="text-gray-500 mb-6">
                {enrolledCourses.length === 0 
                  ? 'Start your learning journey by enrolling in your first course'
                  : 'Try adjusting your search terms or browse our course catalog'
                }
              </p>
              <Link
                to="/courses"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <DashboardCard key={course._id} {...course} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">Ready to learn more?</h3>
              <p className="text-red-100">
                Explore our full course catalog and continue building your YouTube empire.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/courses"
                className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors duration-200 text-center"
              >
                Browse Courses
              </Link>
              <Link
                to="/certificates"
                className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors duration-200 text-center"
              >
                View Certificates
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;