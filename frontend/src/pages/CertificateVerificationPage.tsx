import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, FileText, Calendar, User, BookOpen, Shield, Award, Sparkles, ArrowRight, Copy, ExternalLink } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface CertificateVerification {
  certificateId: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  dateIssued: string;
  completionDate: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  platformName: string;
}

interface VerificationResult {
  isValid: boolean;
  verifiedAt: string;
}

const CertificateVerificationPage = () => {
  const { certificateId: urlCertificateId } = useParams<{ certificateId?: string }>();
  const [certificateId, setCertificateId] = useState(urlCertificateId || '');
  const [certificate, setCertificate] = useState<CertificateVerification | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-verify if certificateId is in URL
  useEffect(() => {
    if (urlCertificateId) {
      verifyCertificate(urlCertificateId);
    }
  }, [urlCertificateId]);

  const verifyCertificate = async (id: string) => {
    if (!id.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCertificate(null);
      setVerification(null);
      setShowSuccess(false);

      const response = await fetch(`http://localhost:5000/api/certificates/verify/${id.trim()}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Certificate not found');
        }
        throw new Error('Failed to verify certificate');
      }

      const result = await response.json();
      setCertificate(result.data.certificate);
      setVerification(result.data.verification);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCertificate(certificateId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show temporary success message
      const originalText = document.querySelector('.copy-btn')?.textContent;
      const copyBtn = document.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          if (copyBtn) copyBtn.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 animate-fade-in">
              Certificate Verification
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Verify the authenticity of certificates issued by our platform with advanced blockchain technology
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-12 border border-white/20 transform hover:scale-[1.02] transition-all duration-300">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Certificate</h2>
            <p className="text-gray-600">Enter the certificate ID to verify its authenticity</p>
          </div>
          
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="Enter certificate ID (e.g., CERT-ABC123)"
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center space-x-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Verify</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 transform animate-slide-in">
            <div className="flex items-center">
              <XCircle className="w-6 h-6 text-red-500 mr-3" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Certificate Details */}
        {certificate && verification && (
          <div className="space-y-8">
            {/* Verification Status Card */}
            <div className={`bg-gradient-to-r ${
              verification.isValid 
                ? 'from-green-500 to-emerald-600' 
                : 'from-red-500 to-pink-600'
            } rounded-2xl shadow-xl p-8 text-white transform animate-slide-in-up`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    {verification.isValid ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <XCircle className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">
                      {verification.isValid ? 'Certificate Verified' : 'Certificate Invalid'}
                    </h2>
                    <p className="text-white/90">
                      Verified on {formatDate(verification.verifiedAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm">Certificate ID</p>
                  <p className="font-mono text-lg bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                    {certificate.certificateId}
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Student Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Student Information</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 font-medium">Student Name</p>
                    <p className="text-lg font-semibold text-gray-900">{certificate.studentName}</p>
                  </div>
                </div>
              </div>

              {/* Course Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Course Information</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 font-medium">Course Title</p>
                    <p className="text-lg font-semibold text-gray-900">{certificate.courseTitle}</p>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 font-medium">Instructor</p>
                    <p className="text-lg font-semibold text-gray-900">{certificate.instructorName}</p>
                  </div>
                </div>
              </div>

              {/* Completion Details */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-4">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Completion Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 font-medium">Completion Date</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(certificate.completionDate)}</p>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 font-medium">Date Issued</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(certificate.dateIssued)}</p>
                  </div>
                </div>
              </div>

              {/* Course Statistics */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Course Statistics</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 font-medium">Total Lessons</p>
                      <p className="text-2xl font-bold text-gray-900">{certificate.totalLessons}</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 font-medium">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{certificate.completedLessons}</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 font-medium">Completion Rate</p>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${certificate.completionPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{certificate.completionPercentage}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Platform Information</h3>
              </div>
              <p className="text-lg text-gray-700 mb-4">
                This certificate was issued by <span className="font-bold text-indigo-600">{certificate.platformName}</span>
              </p>
              <p className="text-sm text-gray-500">
                Certificate verification powered by secure blockchain technology and cryptographic signatures
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => copyToClipboard(certificate.certificateId)}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Copy className="w-5 h-5" />
                <span className="copy-btn">Copy Certificate ID</span>
              </button>
              <button
                onClick={() => window.open(`http://localhost:5173/certificates?certificate=${certificate.certificateId}`, '_blank')}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <ExternalLink className="w-5 h-5" />
                <span>View Certificate</span>
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">How to Verify a Certificate</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl transform hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Enter Certificate ID</h4>
              <p className="text-gray-600 text-sm">Input the unique certificate ID from the certificate</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl transform hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Click Verify</h4>
              <p className="text-gray-600 text-sm">Our system will check the certificate's authenticity</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl transform hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Review Results</h4>
              <p className="text-gray-600 text-sm">Check the verification status and certificate details</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl transform hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Contact Support</h4>
              <p className="text-gray-600 text-sm">Reach out if you have questions about verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        
        .animate-slide-in-up {
          animation: slide-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CertificateVerificationPage;
