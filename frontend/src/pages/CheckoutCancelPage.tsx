import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';

const CheckoutCancelPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Cancel Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-12 text-center">
            <div className="bg-white bg-opacity-20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-16 w-16 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Payment Cancelled
            </h1>
            <p className="text-xl text-red-100">
              Your transaction was not completed
            </p>
          </div>

          <div className="p-8">
            {/* Information */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Don't worry, no charges were made
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Your payment was cancelled and no money has been charged to your account. 
                You can try again anytime or contact our support team if you experienced any issues.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/course/1"
                  className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Try Again</span>
                </Link>
                
                <Link
                  to="/"
                  className="flex items-center justify-center space-x-2 border-2 border-gray-300 hover:border-red-300 text-gray-700 hover:text-red-600 px-6 py-4 rounded-lg transition-all duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Browse Courses</span>
                </Link>
              </div>
            </div>

            {/* Common Issues */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Common reasons for cancelled payments:
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You clicked the back button or closed the payment window</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Network connection was interrupted during payment</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Payment session expired due to inactivity</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You decided to review the purchase later</span>
                </li>
              </ul>
            </div>

            {/* Alternative Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Still interested in the course?
              </h3>
              <p className="text-gray-600 mb-4">
                The course will remain available with all its benefits. You can complete your purchase anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/course/1"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 text-center"
                >
                  View Course Details
                </Link>
                <button className="border border-blue-300 hover:border-blue-400 text-blue-600 px-6 py-2 rounded-lg transition-colors duration-200">
                  Save for Later
                </button>
              </div>
            </div>

            {/* Support */}
            <div className="text-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <HelpCircle className="h-8 w-8 text-gray-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-800">Need Assistance?</h4>
              </div>
              <p className="text-gray-600 mb-4">
                If you encountered any issues during checkout or have questions about the course, 
                our support team is ready to help.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  to="/contact"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  Contact Support
                </Link>
                <Link
                  to="/faq"
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  View FAQ
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