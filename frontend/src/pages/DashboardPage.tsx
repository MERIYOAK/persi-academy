import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Search, Filter, Trophy, TrendingUp, Clock, Users } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';

interface UserData {
  name: string;
  email: string;
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
  isCompleted: boolean;
  lastWatched?: string | null;
  videos?: any[];
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed'>('all');

  // Fetch user data and enrolled courses with progress
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch user data
        const userResponse = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userResult = await userResponse.json();
        setUserData(userResult.data.user);

        // Fetch dashboard progress data
        const progressResponse = await fetch('http://localhost:5000/api/progress/dashboard', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
        if (!progressResponse.ok) {
          throw new Error('Failed to fetch progress data');
        }

        const progressResult = await progressResponse.json();
        setEnrolledCourses(progressResult.data.courses);

          } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Filter courses based on search term and status
  const filteredCourses = useMemo(() => {
    let filtered = enrolledCourses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
    }

    // Filter by status
    switch (filterStatus) {
      case 'in-progress':
        filtered = filtered.filter(course => !course.isCompleted && course.progress > 0);
        break;
      case 'completed':
        filtered = filtered.filter(course => course.isCompleted);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  }, [enrolledCourses, searchTerm, filterStatus]);

  // Calculate dashboard statistics
  const dashboardStats = useMemo(() => {
    const totalCourses = enrolledCourses.length;
    const completedCourses = enrolledCourses.filter(course => course.isCompleted).length;
    const inProgressCourses = enrolledCourses.filter(course => !course.isCompleted && course.progress > 0).length;
    const notStartedCourses = enrolledCourses.filter(course => course.progress === 0).length;
    const averageProgress = totalCourses > 0 
      ? Math.round(enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / totalCourses)
      : 0;

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      notStartedCourses,
      averageProgress
    };
  }, [enrolledCourses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow p-6 h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">Error Loading Dashboard</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userData?.name || 'Learner'}! 👋
          </h1>
          <p className="text-gray-600">
            Continue your learning journey where you left off
          </p>
        </div>

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalCourses}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats.completedCourses}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardStats.inProgressCourses}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardStats.averageProgress}%</p>
                </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
              placeholder="Search your courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'in-progress' | 'completed')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            </div>
          </div>

        {/* Course Grid */}
        <div className="space-y-6">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {enrolledCourses.length === 0 ? 'No courses purchased yet' : 'No courses found'}
              </h3>
              <p className="text-gray-500 mb-6">
                {enrolledCourses.length === 0 
                  ? 'Start your learning journey by purchasing your first course'
                  : 'Try adjusting your search terms or filters'
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
                <DashboardCard 
                  key={course._id} 
                  {...course}
                  isCompleted={course.isCompleted}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">Ready to learn more?</h3>
              <p className="text-red-100">
                Explore our latest courses and continue your learning journey
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/courses"
                className="bg-white text-red-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;