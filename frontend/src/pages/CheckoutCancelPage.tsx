import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, ShoppingCart, RefreshCw } from 'lucide-react';

const CheckoutCancelPage = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');

  console.log('❌ Payment cancelled');
  console.log(`   - Course ID: ${courseId}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Cancel Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-600 px-8 py-12 text-center">
            <div className="bg-white bg-opacity-20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-16 w-16 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Payment Cancelled
            </h1>
            <p className="text-xl text-red-100">
              No worries, you can try again anytime
            </p>
          </div>

          <div className="p-8">
            {/* Cancellation Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">What Happened?</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-red-100 p-2 rounded-full mt-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Payment was cancelled</h4>
                    <p className="text-gray-600 text-sm">
                      You cancelled the payment process before it was completed.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full mt-1">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">No charges were made</h4>
                    <p className="text-gray-600 text-sm">
                      Your payment method was not charged. Your course is still available for purchase.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-full mt-1">
                    <RefreshCw className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">You can try again</h4>
                    <p className="text-gray-600 text-sm">
                      Simply click the "Try Again" button below to restart the payment process.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-6 mb-8">
              <h3 className="text-2xl font-bold text-gray-800">What would you like to do?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-100 p-3 rounded-full mr-4">
                      <RefreshCw className="h-6 w-6 text-red-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">Try Again</h4>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Complete your purchase and get immediate access to the course.
                  </p>
                  <Link
                    to={`/course/${courseId}`}
                    className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <span>Try Again</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">Browse Courses</h4>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Explore our full catalog of courses and find the perfect one for you.
                  </p>
                  <Link
                    to="/courses"
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <span>Browse Courses</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Common Issues */}
            <div className="bg-yellow-50 rounded-lg p-6 mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Having trouble?</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-yellow-100 p-2 rounded-full mt-1">
                    <span className="text-yellow-800 text-sm font-bold">!</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800">Payment method issues</h5>
                    <p className="text-gray-600 text-sm">
                      Make sure your card details are correct and you have sufficient funds.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-yellow-100 p-2 rounded-full mt-1">
                    <span className="text-yellow-800 text-sm font-bold">!</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800">Browser problems</h5>
                    <p className="text-gray-600 text-sm">
                      Try refreshing the page or using a different browser.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-yellow-100 p-2 rounded-full mt-1">
                    <span className="text-yellow-800 text-sm font-bold">!</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800">Still having issues?</h5>
                    <p className="text-gray-600 text-sm">
                      Our support team is here to help you complete your purchase.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="text-center bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Need Help?</h4>
              <p className="text-gray-600 mb-4">
                Our support team is here to help you complete your purchase successfully.
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

export default CheckoutCancelPage;