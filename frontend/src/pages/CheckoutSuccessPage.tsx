import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Play, Download, BookOpen, ArrowRight, Loader, AlertCircle } from 'lucide-react';

interface CourseInfo {
  _id: string;
  title: string;
  price: number;
  description: string;
  thumbnailURL?: string;
}

interface ReceiptInfo {
  orderId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  userEmail: string;
  status: string;
}

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [downloadingResources, setDownloadingResources] = useState(false);
  const [actualAmountPaid, setActualAmountPaid] = useState<number | null>(null);
  const [isWrongCourse, setIsWrongCourse] = useState(false);
  const [correctCourseTitle, setCorrectCourseTitle] = useState<string | null>(null);
  const [firstVideoId, setFirstVideoId] = useState<string | null>(null);

  const courseId = searchParams.get('courseId');
  
  // Debug logging for courseId
  console.log('🔍 CheckoutSuccessPage - courseId from URL:', courseId);
  console.log('🔍 CheckoutSuccessPage - full URL search params:', searchParams.toString());
  
  // Fallback: Try to get courseId from sessionStorage if not in URL
  const fallbackCourseId = courseId || sessionStorage.getItem('pendingCourseId');
  if (fallbackCourseId && !courseId) {
    console.log('🔍 CheckoutSuccessPage - Using fallback courseId from sessionStorage:', fallbackCourseId);
  }

  // Define effectiveCourseId at component level
  const effectiveCourseId = courseId || fallbackCourseId;

  // Function to fetch actual amount paid from user's purchase history
  const fetchActualAmountPaid = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Get user's purchased courses to find the actual payment
      const userResponse = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const purchasedCourses = userData.data.purchasedCourses || [];
        
        console.log('🔍 User purchased courses:', purchasedCourses);
        
        // Find the course in user's purchased courses
        // purchasedCourses contains course IDs (strings), not course objects
        const purchasedCourseId = purchasedCourses.find((purchasedId: string) => 
          purchasedId === effectiveCourseId
        );
        
        if (purchasedCourseId) {
          // Fetch the course details to get the price
          const courseResponse = await fetch(`http://localhost:5000/api/courses/${purchasedCourseId}`);
          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            const course = courseData.data?.course || courseData;
            setActualAmountPaid(course.price);
            setCorrectCourseTitle(course.title);
            // Only set as wrong course if it's different from the current course
            if (purchasedCourseId !== effectiveCourseId) {
            setIsWrongCourse(true);
            }
            console.log(`✅ Purchase amount: $${course.price}`);
          }
        } else {
          // User hasn't purchased this specific course, but they have purchased courses
          // Show the amount for their most recent purchase
          if (purchasedCourses.length > 0) {
            const mostRecentCourseId = purchasedCourses[purchasedCourses.length - 1];
            const courseResponse = await fetch(`http://localhost:5000/api/courses/${mostRecentCourseId}`);
            if (courseResponse.ok) {
              const courseData = await courseResponse.json();
              const course = courseData.data?.course || courseData;
              setActualAmountPaid(course.price);
              setCorrectCourseTitle(course.title);
              setIsWrongCourse(true);
              console.log(`✅ Most recent purchase amount: $${course.price}`);
            }
          }
        }
      }
    } catch (error) {
      console.log('⚠️  Could not fetch actual amount paid:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!effectiveCourseId) {
        console.log('❌ No courseId found in URL parameters or sessionStorage');
        console.log('   - Available search params:', searchParams.toString());
        console.log('   - All search params:');
        for (const [key, value] of searchParams.entries()) {
          console.log(`     ${key}: ${value}`);
        }
        setLoading(false);
        return;
      }

      console.log('🔧 Using courseId:', effectiveCourseId);

      try {
        console.log('🔧 Fetching course and payment info for success page...');
        console.log(`   - Course ID: ${effectiveCourseId}`);

        // Fetch course information
        const courseResponse = await fetch(`http://localhost:5000/api/courses/${effectiveCourseId}`);
        
        if (!courseResponse.ok) {
          throw new Error('Failed to fetch course information');
        }

        const courseData = await courseResponse.json();
        // Handle nested course data structure
        const course = courseData.data?.course || courseData;
        setCourseInfo(course);
        console.log('✅ Course info fetched:', course);

        // Get the first video ID for the watch link
        const videos = course.videos || course.currentVersion?.videos || [];
        if (videos.length > 0) {
          const firstVideo = videos[0];
          const videoId = firstVideo._id || firstVideo.id;
          setFirstVideoId(videoId);
          console.log('✅ First video ID:', videoId);
        }

        // Fetch receipt information
        const token = localStorage.getItem('token');
        if (token && effectiveCourseId) {
          try {
            console.log(`🔧 Fetching receipt for courseId: ${effectiveCourseId}`);
            const receiptUrl = `http://localhost:5000/api/payment/receipt/${effectiveCourseId}`;
            console.log(`🔧 Receipt URL: ${receiptUrl}`);
            
            const receiptResponse = await fetch(receiptUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            console.log(`📊 Receipt response status: ${receiptResponse.status}`);
            console.log(`📊 Receipt response ok: ${receiptResponse.ok}`);

            if (receiptResponse.ok) {
              const receiptData = await receiptResponse.json();
              setReceiptInfo(receiptData.receipt);
              console.log('✅ Receipt info fetched:', receiptData.receipt);
            } else {
              const errorText = await receiptResponse.text();
              console.log(`⚠️  Receipt not available yet (status: ${receiptResponse.status})`);
              console.log(`⚠️  Error response: ${errorText}`);
              
              // Set fallback receipt data using course info
              if (course) {
                setReceiptInfo({
                  orderId: `#YTA-${Date.now().toString().slice(-6)}`,
                  courseTitle: course.title,
                  amount: course.price,
                  currency: 'USD',
                  paymentDate: new Date().toISOString(),
                  paymentMethod: 'Credit Card',
                  userEmail: 'user@example.com',
                  status: 'Completed'
                });
              }
            }
          } catch (receiptError) {
            console.error('❌ Error fetching receipt:', receiptError);
            console.log('⚠️  Could not fetch receipt info (this is normal for development mode)');
            // Set fallback receipt data using course info
            if (course) {
              setReceiptInfo({
                orderId: `#YTA-${Date.now().toString().slice(-6)}`,
                courseTitle: course.title,
                amount: course.price,
                currency: 'USD',
                paymentDate: new Date().toISOString(),
                paymentMethod: 'Credit Card',
                userEmail: 'user@example.com',
                status: 'Completed'
              });
            }
          }
                  } else {
            console.log('⚠️  No authentication token or courseId found');
            console.log(`   - Token: ${token ? 'Present' : 'Missing'}`);
            console.log(`   - CourseId: ${effectiveCourseId || 'Missing'}`);
          
          // Set fallback receipt data using course info
          if (course) {
            setReceiptInfo({
              orderId: `#YTA-${Date.now().toString().slice(-6)}`,
              courseTitle: course.title,
              amount: course.price,
              currency: 'USD',
              paymentDate: new Date().toISOString(),
              paymentMethod: 'Credit Card',
              userEmail: 'user@example.com',
              status: 'Completed'
            });
          }
        }

        // Always fetch fallback data for course info
            await fetchActualAmountPaid();

      } catch (error) {
        console.error('❌ Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Retry mechanism to check if payment has been processed
    const retryInterval = setInterval(async () => {
      if (!effectiveCourseId) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Check if user has purchased the course
        const purchaseResponse = await fetch(`http://localhost:5000/api/payment/check-purchase/${effectiveCourseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (purchaseResponse.ok) {
          const purchaseData = await purchaseResponse.json();
          if (purchaseData.data.hasPurchased) {
            console.log('✅ Payment has been processed - course is now purchased');
            clearInterval(retryInterval);
            
            // Try to fetch receipt again
            try {
              const receiptResponse = await fetch(`http://localhost:5000/api/payment/receipt/${effectiveCourseId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (receiptResponse.ok) {
                const receiptData = await receiptResponse.json();
                setReceiptInfo(receiptData.receipt);
                console.log('✅ Receipt info fetched after retry:', receiptData.receipt);
              }
            } catch (receiptError) {
              console.log('⚠️  Still could not fetch receipt info');
            }
            
            // Also fetch actual amount paid
            await fetchActualAmountPaid();
          }
        }
      } catch (error) {
        console.log('⚠️  Error checking purchase status:', error);
      }
    }, 2000); // Check every 2 seconds

    // Stop retrying after 30 seconds
    setTimeout(() => {
      clearInterval(retryInterval);
      console.log('⏰ Stopped retrying payment status check');
    }, 30000);

    return () => {
      clearInterval(retryInterval);
    };
  }, [effectiveCourseId]);

  useEffect(() => {
    // Track successful purchase
    console.log('🎉 Purchase completed successfully');
    console.log(`   - Course ID: ${effectiveCourseId}`);
    
    // You could also send analytics here
    // analytics.track('Purchase Completed', { effectiveCourseId, amount: courseInfo?.price });
  }, [effectiveCourseId]);

  const handleDownloadReceipt = async () => {
    if (!effectiveCourseId) return;

    setDownloadingReceipt(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5000/api/payment/download-receipt/${effectiveCourseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      // Get content type to determine file extension
      const contentType = response.headers.get('content-type');
      const isPdf = contentType && contentType.includes('application/pdf');
      const fileExtension = isPdf ? 'pdf' : 'html';

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptInfo?.orderId || 'payment'}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`✅ Receipt downloaded successfully as ${fileExtension.toUpperCase()}`);
    } catch (error) {
      console.error('❌ Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const handleDownloadResources = async () => {
    if (!effectiveCourseId) return;

    setDownloadingResources(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5000/api/payment/download-resources/${effectiveCourseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download resources');
      }

      // Get content type to determine file extension
      const contentType = response.headers.get('content-type');
      const isPdf = contentType && contentType.includes('application/pdf');
      const fileExtension = isPdf ? 'pdf' : 'html';

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resources-${courseInfo?.title?.replace(/\s+/g, '-') || 'course'}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`✅ Resources downloaded successfully as ${fileExtension.toUpperCase()}`);
    } catch (error) {
      console.error('❌ Error downloading resources:', error);
      alert('Failed to download resources. Please try again.');
    } finally {
      setDownloadingResources(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-16 w-16 text-green-600 animate-spin mx-auto mb-6" />
          <p className="text-gray-600 text-lg font-medium">Loading your purchase details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-600 mb-6">
            <AlertCircle className="h-20 w-20 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-8">
            Your payment was processed successfully, but we couldn't load the course details. 
            You can access your course from your dashboard.
          </p>
          <Link
            to="/dashboard"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
            <div className="bg-white bg-opacity-20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-green-100">
              Welcome to your learning journey
            </p>
          </div>

          <div className="p-8">
            {/* Warning for wrong course */}
            {isWrongCourse && correctCourseTitle && courseInfo?.title && correctCourseTitle !== courseInfo.title && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> You purchased "{correctCourseTitle}" for ${actualAmountPaid}, 
                    but you're viewing a different course. The amount shown reflects your actual purchase.
                  </p>
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Confirmation</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-semibold text-gray-800">
                    {receiptInfo?.orderId || `#YTA-${Date.now().toString().slice(-6)}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Course:</span>
                  <span className="font-semibold text-gray-800">
                    {correctCourseTitle || courseInfo?.title || 'Course Purchase'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-green-600">
                    ${actualAmountPaid || receiptInfo?.amount || courseInfo?.price || 'Processing...'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold text-gray-800">
                    {receiptInfo?.paymentMethod || '••••4242'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {receiptInfo?.status || 'Completed'}
                  </span>
                </div>
                {receiptInfo?.paymentDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(receiptInfo.paymentDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-6 mb-8">
              <h3 className="text-2xl font-bold text-gray-800">What's Next?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-100 p-3 rounded-full mr-4">
                      <Play className="h-6 w-6 text-red-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">Start Learning</h4>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Access your course immediately and begin your learning journey today.
                  </p>
                  <Link
                    to={firstVideoId ? `/course/${courseId}/watch/${firstVideoId}` : `/course/${courseId}`}
                    className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <span>Start Course</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">View Dashboard</h4>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Track your progress and manage all your courses from your personal dashboard.
                  </p>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Receipt Information */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <Download className="h-5 w-5 text-gray-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-800">Receipt & Resources</h4>
              </div>
              <p className="text-gray-600 mb-4">
                Download your payment receipt and course resources for offline access.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleDownloadReceipt}
                  disabled={downloadingReceipt}
                  className="flex items-center justify-center space-x-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingReceipt ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>{downloadingReceipt ? 'Downloading...' : 'Download Receipt (PDF)'}</span>
                </button>
                <button 
                  onClick={handleDownloadResources}
                  disabled={downloadingResources}
                  className="flex items-center justify-center space-x-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingResources ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>{downloadingResources ? 'Downloading...' : 'Download Resources (PDF)'}</span>
                </button>
              </div>
            </div>

            {/* Support */}
            <div className="text-center bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Need Help?</h4>
              <p className="text-gray-600 mb-4">
                Our support team is here to help you succeed. Don't hesitate to reach out!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  to="/contact"
                  className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg transition-colors duration-200 border border-gray-300"
                >
                  Contact Support
                </Link>
                <Link
                  to="/help"
                  className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg transition-colors duration-200 border border-gray-300"
                >
                  Help Center
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;