import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Download, Eye, ArrowLeft, CheckCircle } from 'lucide-react';

interface Certificate {
  id: string;
  courseTitle: string;
  courseId: string;
  issuedDate: string;
  certificateUrl?: string;
  status: 'completed' | 'pending';
}

const CertificatesPage = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // For now, we'll create mock certificates based on completed courses
        // In a real implementation, you'd fetch from your backend
        const mockCertificates: Certificate[] = [
          {
            id: '1',
            courseTitle: 'YouTube Monetization Masterclass',
            courseId: 'course-1',
            issuedDate: '2024-01-15',
            status: 'completed'
          },
          {
            id: '2',
            courseTitle: 'Content Strategy for YouTube Success',
            courseId: 'course-2',
            issuedDate: '2024-01-20',
            status: 'completed'
          },
          {
            id: '3',
            courseTitle: 'YouTube SEO & Algorithm Secrets',
            courseId: 'course-3',
            issuedDate: '2024-02-01',
            status: 'pending'
          }
        ];

        setCertificates(mockCertificates);
      } catch (error) {
        console.error('Error fetching certificates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [navigate]);

  const handleDownload = (certificate: Certificate) => {
    // In a real implementation, this would download the actual certificate
    alert(`Downloading certificate for ${certificate.courseTitle}`);
  };

  const handleView = (certificate: Certificate) => {
    // In a real implementation, this would open the certificate in a new tab
    alert(`Viewing certificate for ${certificate.courseTitle}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mt-4">My Certificates</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No certificates yet</h3>
            <p className="text-gray-500 mb-6">
              Complete courses to earn certificates and showcase your achievements
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                        {certificate.courseTitle}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Issued: {new Date(certificate.issuedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="ml-4">
                      {certificate.status === 'completed' ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <div className="h-5 w-5 rounded-full border-2 border-yellow-600 border-t-transparent animate-spin"></div>
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {certificate.status === 'completed' ? (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleView(certificate)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownload(certificate)}
                          className="flex-1 flex items-center justify-center space-x-2 border border-gray-300 hover:border-red-300 text-gray-700 hover:text-red-600 py-2 px-4 rounded-lg font-semibold transition-colors duration-200"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-3">
                          Complete the course to earn your certificate
                        </p>
                        <button
                          onClick={() => navigate(`/course/${certificate.courseId}`)}
                          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200"
                        >
                          Continue Course
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Section */}
        {certificates.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Certificate Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <div className="text-3xl font-bold">{certificates.length}</div>
                  <div className="text-red-100">Total Certificates</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {certificates.filter(c => c.status === 'completed').length}
                  </div>
                  <div className="text-red-100">Completed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {certificates.filter(c => c.status === 'pending').length}
                  </div>
                  <div className="text-red-100">In Progress</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesPage; 