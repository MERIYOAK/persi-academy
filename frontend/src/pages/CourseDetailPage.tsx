import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Users, Star, Play, CheckCircle, Award, Download, BookOpen, ShoppingCart, Loader, ArrowLeft, Eye, Lock } from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnailURL?: string;
  price: number;
  category?: string;
  level?: string;
  videos?: Array<{
    _id: string;
    title: string;
    description?: string;
    duration?: number;
    thumbnailURL?: string;
  }>;
  instructor?: string;
  totalDuration?: number;
  totalVideos?: number;
  rating?: number;
  students?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PurchaseStatus {
  hasPurchased: boolean;
  courseId: string;
}

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    setUserToken(token);
  }, []);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        console.log('🔧 Fetching course details...');
        console.log(`   - Course ID: ${id}`);

        const response = await fetch(`http://localhost:5000/api/courses/${id}`);
        
        if (!response.ok) {
          throw new Error('Course not found');
        }

        const data = await response.json();
        
        // Handle both enhanced and legacy response formats
        let courseData;
        if (data.success && data.data && data.data.course) {
          // Enhanced controller response format
          courseData = data.data.course;
          console.log('✅ Course data fetched (enhanced format):', courseData);
        } else if (data._id) {
          // Legacy controller response format
          courseData = data;
          console.log('✅ Course data fetched (legacy format):', courseData);
        } else {
          throw new Error('Invalid course data format');
        }
        
        setCourse(courseData);

      } catch (error) {
        console.error('❌ Error fetching course:', error);
        setError(error instanceof Error ? error.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  // Fetch purchase status
  useEffect(() => {
    const fetchPurchaseStatus = async () => {
      if (!userToken || !id) return;

      try {
        console.log('🔧 Checking purchase status...');
        
        const response = await fetch(`http://localhost:5000/api/payment/check-purchase/${id}`, {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPurchaseStatus(data);
          console.log('✅ Purchase status:', data);
        }
      } catch (error) {
        console.error('❌ Error checking purchase status:', error);
      }
    };

    fetchPurchaseStatus();
  }, [userToken, id]);

  const handlePurchase = async () => {
    if (!userToken) {
      navigate('/login');
      return;
    }

    try {
      setIsPurchasing(true);
      console.log('🔧 Initiating purchase...');

      const response = await fetch('http://localhost:5000/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          courseId: id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      console.log('✅ Checkout session created:', data);
      window.location.href = data.url;

    } catch (error) {
      console.error('❌ Purchase error:', error);
      alert(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
    }
    return `${minutes}:00`;
  };

  const formatTotalDuration = (videos?: Array<{ duration?: number }>) => {
    if (!videos) return '0:00';
    const totalSeconds = videos.reduce((acc, video) => acc + (video.duration || 0), 0);
    return formatDuration(totalSeconds);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-16 w-16 text-red-600 animate-spin mx-auto mb-6" />
          <p className="text-gray-600 text-lg font-medium">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-600 mb-6">
            <BookOpen className="h-20 w-20 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Course Not Found</h2>
          <p className="text-gray-600 mb-8">
            {error || 'The course you are looking for does not exist or has been removed.'}
          </p>
          <Link
            to="/courses"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Browse All Courses
          </Link>
        </div>
      </div>
    );
  }

  const totalDuration = formatTotalDuration(course.videos);
  const totalVideos = course.videos?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:bg-gray-100 px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Courses</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                {course.category && (
                  <>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {course.category}
                    </span>
                    <span className="text-red-200">•</span>
                  </>
                )}
                {course.level && (
                  <>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {course.level}
                    </span>
                    <span className="text-red-200">•</span>
                  </>
                )}
                <span className="text-red-200">English</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {course.title}
              </h1>
              
              <p className="text-xl text-red-100 mb-8 leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">{course.rating || 4.8}</span>
                  <span className="text-red-200">({course.students || 0} students)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-red-200" />
                  <span>{totalDuration} total</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-red-200" />
                  <span>{totalVideos} lessons</span>
                </div>
              </div>
              
              {/* Instructor */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-red-200 text-sm">Created by</p>
                  <p className="font-semibold text-lg">{course.instructor || 'YT Academy'}</p>
                  <p className="text-red-200 text-sm">
                    Updated {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Purchase Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-2xl p-8 sticky top-8">
                {course.thumbnailURL ? (
                  <img
                    src={course.thumbnailURL}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg mb-6"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <span className="text-4xl font-bold text-gray-800">${course.price}</span>
                    {course.price > 0 && (
                      <span className="text-xl text-gray-500 line-through">${Math.round(course.price * 1.5)}</span>
                    )}
                  </div>
                  {course.price > 0 && (
                    <p className="text-green-600 font-semibold">Save ${Math.round(course.price * 0.5)}!</p>
                  )}
                </div>
                
                {purchaseStatus?.hasPurchased ? (
                  <div className="text-center mb-4">
                    <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg flex items-center justify-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Course Purchased</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl mb-4 flex items-center justify-center space-x-2"
                  >
                    {isPurchasing ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        <span>Enroll Now</span>
                      </>
                    )}
                  </button>
                )}
                
                <p className="text-center text-gray-600 text-sm mb-6">
                  30-day money-back guarantee
                </p>
                
                {/* Course Features */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span>{totalDuration} on-demand video</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="h-4 w-4 text-red-600" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Download className="h-4 w-4 text-red-600" />
                    <span>Downloadable resources</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-red-600" />
                    <span>Lifetime access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Course Curriculum */}
            <section>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Course Curriculum</h2>
              {course.videos && course.videos.length > 0 ? (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">All Lessons</h3>
                    <p className="text-sm text-gray-600">{totalVideos} lessons • {totalDuration}</p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {course.videos.map((video, index) => (
                      <div key={video._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {purchaseStatus?.hasPurchased ? (
                              <Play className="h-5 w-5 text-red-600" />
                            ) : (
                              <Lock className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">
                              {index + 1}. {video.title}
                            </h4>
                            {video.description && (
                              <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(video.duration)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Lessons Available</h3>
                  <p className="text-gray-600">This course doesn't have any lessons yet.</p>
                </div>
              )}
            </section>

            {/* Course Description */}
            <section>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">About This Course</h2>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {course.description}
                </p>
              </div>
            </section>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Course Stats */}
            <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Course Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Duration</span>
                  <span className="font-semibold">{totalDuration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Lessons</span>
                  <span className="font-semibold">{totalVideos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Students Enrolled</span>
                  <span className="font-semibold">{course.students || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Course Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{course.rating || 4.8}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-semibold">
                    {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
              </div>
            </section>

            {/* Course Features */}
            <section className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">What's Included</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Lifetime access to course content</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Certificate of completion</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Downloadable resources</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Mobile and TV access</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">30-day money-back guarantee</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;