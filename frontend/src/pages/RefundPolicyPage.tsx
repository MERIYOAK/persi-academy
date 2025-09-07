import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CreditCard, Clock, CheckCircle, XCircle, AlertTriangle, Mail, Phone, MessageCircle } from 'lucide-react';
import { config } from '../config/environment';

const RefundPolicyPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
            <p className="text-xl text-red-100 max-w-3xl mx-auto">
              We want you to be completely satisfied with your purchase. Learn about our refund process and how we handle returns.
            </p>
            <p className="text-sm text-red-200 mt-4">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">5-Day Guarantee</h3>
              <p className="text-gray-600 text-sm">Full refund within 5 days of purchase</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Processing</h3>
              <p className="text-gray-600 text-sm">Refunds processed within 5-7 business days</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Original Payment</h3>
              <p className="text-gray-600 text-sm">Refunded to your original payment method</p>
            </div>
          </div>
        </div>

        {/* Policy Content */}
        <div className="space-y-8">
          {/* Overview */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                At {config.APP_NAME}, we stand behind the quality of our educational content. We understand that sometimes a course may not meet your expectations, and we want to ensure you have a positive experience with our platform.
              </p>
              <p className="text-gray-600">
                This refund policy outlines the terms and conditions for requesting and receiving refunds for our courses and services.
              </p>
            </div>
          </section>

          {/* Eligibility */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Eligibility</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5-Day Money-Back Guarantee</h3>
              <p className="text-gray-600 mb-4">
                We offer a 5-day money-back guarantee for course purchases. If you're not completely satisfied with your purchase, you may request a refund within 5 days of the purchase date.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Eligibility Requirements</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Purchase must be within the last 5 days</li>
                <li>Refund request must be submitted through proper channels</li>
                <li>Course must not be completed (less than 90% watched)</li>
                <li>No violation of our Terms of Service</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Non-Eligible Cases</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Requests made after 5 days from purchase</li>
                <li>Courses that have been completed (90% or more watched)</li>
                <li>Violation of platform terms or abuse of refund policy</li>
                <li>Free courses or promotional content</li>
                <li>Corporate or bulk purchases (separate terms apply)</li>
              </ul>
            </div>
          </section>

          {/* How to Request a Refund */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Request a Refund</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Step-by-Step Process</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 rounded-full p-2 w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Contact Support</h4>
                    <p className="text-gray-600">Email our support team at {config.SUPPORT_EMAIL} or use our contact form</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 rounded-full p-2 w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Provide Information</h4>
                    <p className="text-gray-600">Include your order number, email address, and reason for the refund request</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 rounded-full p-2 w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Review Process</h4>
                    <p className="text-gray-600">Our team will review your request within 24-48 hours</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 rounded-full p-2 w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-semibold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Refund Processing</h4>
                    <p className="text-gray-600">If approved, refund will be processed within 5-7 business days</p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Required Information</h3>
              <p className="text-gray-600 mb-4">When requesting a refund, please provide:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Your full name and email address</li>
                <li>Order number or transaction ID</li>
                <li>Course name and purchase date</li>
                <li>Reason for the refund request</li>
                <li>Any additional context that may help us understand your situation</li>
              </ul>
            </div>
          </section>

          {/* Refund Processing */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Processing</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Processing Time</h3>
              <p className="text-gray-600 mb-4">
                Once your refund request is approved, we will process the refund within 5-7 business days. The time it takes for the refund to appear in your account depends on your payment method and financial institution.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Refund Methods</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li><strong>Credit/Debit Cards (via Stripe):</strong> 5-10 business days</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">What Happens After Refund</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Your access to the course will be revoked</li>
                <li>Course progress and certificates will be removed</li>
                <li>You will receive a confirmation email</li>
                <li>Refund will appear on your original payment method</li>
              </ul>
            </div>
          </section>

          {/* Special Circumstances */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Special Circumstances</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Issues</h3>
              <p className="text-gray-600 mb-4">
                If you experience technical issues that prevent you from accessing or completing a course, we may offer a refund or course credit, even beyond the 5-day period. Please contact our support team with detailed information about the technical problems you encountered.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Updates</h3>
              <p className="text-gray-600 mb-4">
                If a course is significantly updated or replaced with new content, we may offer refunds to existing students who are not satisfied with the changes. This is evaluated on a case-by-case basis.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bulk Purchases</h3>
              <p className="text-gray-600">
                For corporate or bulk purchases, different refund terms may apply. Please refer to your specific agreement or contact our sales team for details.
              </p>
            </div>
          </section>

          {/* Disputes and Appeals */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Disputes and Appeals</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">If Your Refund is Denied</h3>
              <p className="text-gray-600 mb-4">
                If your refund request is denied, you may appeal the decision by providing additional information or context. Our support team will review your appeal and may reconsider the decision based on new information.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Escalation Process</h3>
              <p className="text-gray-600">
                If you're not satisfied with the resolution, you may escalate your case to our management team. Please include all previous correspondence and clearly explain why you believe the decision should be reconsidered.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">
                For refund requests or questions about this policy, please contact us through any of the following channels:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Mail className="h-5 w-5 text-red-500 mr-2" />
                    <h3 className="font-semibold text-gray-900">Email Support</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">For refund requests and general inquiries</p>
                  <a href={`mailto:${config.SUPPORT_EMAIL}`} className="text-red-600 hover:text-red-700 text-sm font-medium">
                    {config.SUPPORT_EMAIL}
                  </a>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <MessageCircle className="h-5 w-5 text-red-500 mr-2" />
                    <h3 className="font-semibold text-gray-900">Live Chat</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">Get immediate assistance</p>
                  <a
                    href={`https://wa.me/${config.SUPPORT_WHATSAPP.replace(/[^\\d]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    WhatsApp Chat
                  </a>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Phone className="h-5 w-5 text-red-500 mr-2" />
                    <h3 className="font-semibold text-gray-900">Phone Support</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">Speak with our support team</p>
                  <a href={`tel:${config.SUPPORT_PHONE}`} className="text-red-600 hover:text-red-700 text-sm font-medium">
                    {config.SUPPORT_PHONE}
                  </a>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Important Note</h4>
                    <p className="text-blue-800 text-sm">
                      Please include your order number and email address in all communications to help us process your request more efficiently.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I get a refund if I don't like the course content?</h3>
              <p className="text-gray-600">Yes, if you're not satisfied with the course content, you can request a refund within 30 days of purchase, regardless of the reason.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if I've watched most of the course?</h3>
              <p className="text-gray-600">If you've watched less than 90% of the course content, you're still eligible for a refund within the 5-day period.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How long does it take to receive my refund?</h3>
              <p className="text-gray-600">Refunds are processed within 5-7 business days after approval, but the time to appear in your account depends on your payment method.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I get a refund for a free course?</h3>
              <p className="text-gray-600">No, refunds are not available for free courses or promotional content.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens to my certificate if I get a refund?</h3>
              <p className="text-gray-600">If you receive a refund, your course access and any earned certificates will be revoked.</p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help with a Refund?</h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you with any questions about refunds or to process your refund request.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Contact Support
            </Link>
            <a
              href={`mailto:${config.SUPPORT_EMAIL}`}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Email Refund Request
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
