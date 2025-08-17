import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, CheckCircle, Calendar, BookOpen, Award, Share2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Certificate {
  certificateId: string;
  courseTitle: string;
  dateIssued: string;
  completionDate: string;
  pdfUrl: string;
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnailURL?: string;
  };
}

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('http://localhost:5000/api/certificates/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch certificates');
      }

      const result = await response.json();
      setCertificates(result.data.certificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificateId: string, courseTitle: string) => {
    try {
      setDownloading(certificateId);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/certificates/download/${certificateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const result = await response.json();
      
      // Create a temporary link to download the PDF
      const link = document.createElement('a');
      link.href = `http://localhost:5000${result.data.downloadUrl}`;
      link.download = `certificate-${courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      setShowSuccess(certificateId);
      setTimeout(() => setShowSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error downloading certificate:', error);
      setError('Failed to download certificate');
    } finally {
      setDownloading(null);
    }
  };



  const shareCertificate = (certificate: Certificate) => {
    try {
      // Use the public certificate preview URL instead of verification page
      const previewUrl = `http://localhost:5000/certificate-preview/${certificate.certificateId}`;
      console.log('Sharing certificate:', certificate.certificateId, 'URL:', previewUrl);
      
      if (navigator.share) {
        console.log('Using native share API');
        navigator.share({
          title: `Certificate of Completion - ${certificate.courseTitle}`,
          text: `I just completed the course "${certificate.courseTitle}"! View my certificate here:`,
          url: previewUrl
        }).then(() => {
          console.log('Share successful');
          setShowSuccess(certificate.certificateId);
          setTimeout(() => setShowSuccess(null), 2000);
        }).catch((error) => {
          console.log('Share cancelled or failed:', error);
          // Fallback to clipboard
          copyToClipboard(previewUrl, certificate.certificateId);
        });
      } else {
        console.log('Native share not available, using clipboard fallback');
        // Fallback: copy to clipboard
        copyToClipboard(previewUrl, certificate.certificateId);
      }
    } catch (error) {
      console.error('Error sharing certificate:', error);
      setError('Failed to share certificate');
    }
  };

  const copyToClipboard = async (text: string, certificateId: string) => {
    try {
      console.log('Copying to clipboard:', text);
      await navigator.clipboard.writeText(text);
      console.log('Successfully copied to clipboard');
      setShowSuccess(certificateId);
      setTimeout(() => setShowSuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setError('Failed to copy verification link');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your certificates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Certificates</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchCertificates}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
                <p className="mt-1 text-gray-600">
                  Your achievements and certificates of completion
                </p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {certificates.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="text-gray-400 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Certificates Yet</h3>
              <p className="text-gray-600 mb-8">
                Complete your courses to earn beautiful certificates of completion. Start your learning journey today!
              </p>
              <Link
                to="/courses"
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{certificates.length}</h2>
                      <p className="text-gray-600">Certificates Earned</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Latest Achievement</p>
                    <p className="font-semibold text-gray-900">
                      {certificates.length > 0 ? formatDate(certificates[0].completionDate) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((certificate) => (
                <div
                  key={certificate.certificateId}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  {/* Certificate Header */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-6 h-6" />
                          <span className="font-semibold">Certificate</span>
                        </div>
                        <span className="text-sm opacity-90">#{certificate.certificateId.slice(-8)}</span>
                      </div>
                      <div className="text-sm opacity-90">
                        Course Completed Successfully
                      </div>
                    </div>
                  </div>

                  {/* Certificate Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                      {certificate.courseTitle}
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Completed: {formatDate(certificate.completionDate)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Issued: {formatDate(certificate.dateIssued)}</span>
                      </div>
                    </div>

                                         {/* Action Buttons */}
                     <div className="grid grid-cols-2 gap-2">
                       <button
                         onClick={() => downloadCertificate(certificate.certificateId, certificate.courseTitle)}
                         disabled={downloading === certificate.certificateId}
                         className="flex items-center justify-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                         title="Download PDF"
                       >
                         {downloading === certificate.certificateId ? (
                           <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                         ) : (
                           <Download className="w-3 h-3" />
                         )}
                         <span className="hidden sm:inline">Download</span>
                       </button>
                       
                       <button
                         onClick={() => shareCertificate(certificate)}
                         className="flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                         title="Share Certificate"
                       >
                         <Share2 className="w-3 h-3" />
                         <span className="hidden sm:inline">Share</span>
                       </button>
                     </div>

                    {/* Verify Link */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <a
                        href={`http://localhost:5000/api/certificates/verify/${certificate.certificateId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Verify Certificate</span>
                      </a>
                    </div>
                  </div>

                  {/* Success Message Overlay */}
                  {showSuccess === certificate.certificateId && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs shadow-lg z-10">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Success!</span>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs shadow-lg z-10 max-w-xs">
                      <div className="flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CertificatesPage; 