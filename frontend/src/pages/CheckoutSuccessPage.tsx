import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Play, Download, BookOpen, ArrowRight } from 'lucide-react';

const CheckoutSuccessPage = () => {
  useEffect(() => {
    // Track successful purchase
    console.log('Purchase completed successfully');
  }, []);

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
              Welcome to your YouTube success journey
            </p>
          </div>

          <div className="p-8">
            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Confirmation</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-semibold text-gray-800">#YTA-{Date.now().toString().slice(-6)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Course:</span>
                  <span className="font-semibold text-gray-800">YouTube Monetization Masterclass</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-green-600">$97.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold text-gray-800">••••4242</span>
                </div>
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
                    Access your course immediately and begin your YouTube journey today.
                  </p>
                  <Link
                    to="/course/1/watch/1"
                    className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <span>Watch Now</span>
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
                A confirmation email with your receipt and course access details has been sent to your email address.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="flex items-center justify-center space-x-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200">
                  <Download className="h-4 w-4" />
                  <span>Download Receipt</span>
                </button>
                <button className="flex items-center justify-center space-x-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200">
                  <Download className="h-4 w-4" />
                  <span>Download Resources</span>
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