import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/environment';

import { Link } from 'react-router-dom';
import { formatDuration } from '../utils/durationFormatter';
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Play, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Eye,
  Clock,
  HardDrive,
  Star,
  Target,
  Award,
  Zap
} from 'lucide-react';

interface GeneralStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeSessions: number;
  activeCourses: number;
  inactiveCourses: number;
  archivedCourses: number;
  totalVersions: number;
  totalVideos: number;
  recentCourses: Array<{
    _id: string;
    title: string;
    status: string;
    createdAt: string;
    price: number;
  }>;
  recentTransactions: Array<{
    _id: string;
    amount: number;
    createdAt: string;
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    courseId: {
      _id: string;
      title: string;
    };
  }>;
}

interface CourseStats {
  courses: {
    total: number;
    active: number;
    inactive: number;
    archived: number;
  };
  versions: number;
  enrollments: number;
  averageEnrollmentsPerCourse: string;
}

interface VideoStats {
  videos: {
    total: number;
    active: number;
    processing: number;
    archived: number;
  };
  storage: {
    totalFileSize: number;
    totalFileSizeGB: string;
  };
  duration: {
    totalSeconds: number;
    totalHours: string;
  };
  averageFileSize: string;
}

const AdminAnalyticsPage: React.FC = () => {
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        throw new Error('Admin token not found');
      }

      const headers = {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      };

      // Fetch all analytics data in parallel
      const [generalResponse, courseResponse, videoResponse] = await Promise.all([
        fetch(buildApiUrl('/api/admin/stats'), { headers }),
        fetch(buildApiUrl('/api/courses/admin/statistics'), { headers }),
        fetch(buildApiUrl('/api/videos/admin/statistics'), { headers })
      ]);

      if (!generalResponse.ok || !courseResponse.ok || !videoResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [generalData, courseData, videoData] = await Promise.all([
        generalResponse.json(),
        courseResponse.json(),
        videoResponse.json()
      ]);

      setGeneralStats(generalData.data);
      setCourseStats(courseData.data);
      setVideoStats(videoData.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Using the centralized formatDuration utility

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchAnalyticsData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-gray-600">Comprehensive insights into your platform performance</p>
              {lastUpdated && (
                <p className="mt-1 text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={fetchAnalyticsData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {generalStats ? formatNumber(generalStats.totalUsers) : '0'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <Activity className="h-4 w-4 mr-1" />
                {generalStats ? formatNumber(generalStats.activeSessions) : '0'} active sessions
              </div>
            </div>
          </div>

          {/* Total Courses */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {generalStats ? formatNumber(generalStats.totalCourses) : '0'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <Target className="h-4 w-4 mr-1" />
                {courseStats ? formatNumber(courseStats.enrollments) : '0'} total enrollments
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {generalStats ? formatCurrency(generalStats.totalRevenue) : '$0'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                From completed transactions
              </div>
            </div>
          </div>

          {/* Total Videos */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Play className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Videos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {generalStats ? formatNumber(generalStats.totalVideos) : '0'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {videoStats ? formatDuration(videoStats.duration.totalSeconds) : '0:00'} total duration
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Analytics */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Course Analytics</h2>
                  <p className="text-gray-600 mt-1">Course performance and status overview</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="p-6">
              {courseStats && (
                <div className="space-y-6">
                  {/* Course Status Distribution */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Course Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">Active</span>
                          <span className="text-2xl font-bold text-green-900">{courseStats.courses.active}</span>
                        </div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-yellow-800">Inactive</span>
                          <span className="text-2xl font-bold text-yellow-900">{courseStats.courses.inactive}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">Archived</span>
                          <span className="text-2xl font-bold text-gray-900">{courseStats.courses.archived}</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-800">Versions</span>
                          <span className="text-2xl font-bold text-blue-900">{courseStats.versions}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enrollment Stats */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Enrollment Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Enrollments</span>
                        <span className="font-semibold">{formatNumber(courseStats.enrollments)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Average per Course</span>
                        <span className="font-semibold">{courseStats.averageEnrollmentsPerCourse}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Analytics */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Video Analytics</h2>
                  <p className="text-gray-600 mt-1">Video content and storage overview</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Play className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="p-6">
              {videoStats && (
                <div className="space-y-6">
                  {/* Video Status Distribution */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Video Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">Active</span>
                          <span className="text-2xl font-bold text-green-900">{videoStats.videos.active}</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-800">Processing</span>
                          <span className="text-2xl font-bold text-blue-900">{videoStats.videos.processing}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">Archived</span>
                          <span className="text-2xl font-bold text-gray-900">{videoStats.videos.archived}</span>
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-orange-800">Total</span>
                          <span className="text-2xl font-bold text-orange-900">{videoStats.videos.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Storage and Duration */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Storage & Duration</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Storage</span>
                        <span className="font-semibold">{videoStats.storage.totalFileSizeGB} GB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Duration</span>
                        <span className="font-semibold">{formatDuration(videoStats.duration.totalSeconds)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Average File Size</span>
                        <span className="font-semibold">{formatFileSize(parseFloat(videoStats.averageFileSize))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Courses */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Recent Courses</h2>
                  <p className="text-gray-600 mt-1">Latest course additions</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="p-6">
              {generalStats?.recentCourses && generalStats.recentCourses.length > 0 ? (
                <div className="space-y-4">
                  {generalStats.recentCourses.map((course) => (
                    <div key={course._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500">{formatDate(course.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          course.status === 'active' ? 'bg-green-100 text-green-800' :
                          course.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {course.status}
                        </span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatCurrency(course.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent courses</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
                  <p className="text-gray-600 mt-1">Latest revenue activity</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="p-6">
              {generalStats?.recentTransactions && generalStats.recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {generalStats.recentTransactions.map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{transaction.courseId.title}</h3>
                        <p className="text-sm text-gray-500">{transaction.userId.name}</p>
                        <p className="text-xs text-gray-400">{formatDate(transaction.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage; 