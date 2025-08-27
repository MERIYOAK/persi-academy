import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/environment';

import { Link } from 'react-router-dom';
import { Play, Clock, CheckCircle, BookOpen, Trophy, Award, Sparkles, Eye } from 'lucide-react';
import CourseProgressBar from './CourseProgressBar';

interface DashboardCardProps {
  _id: string;
  title: string;
  thumbnail: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastWatched?: string | null;
  duration: string;
  videos?: any[];
  isCompleted?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  _id,
  title,
  thumbnail,
  progress,
  totalLessons,
  completedLessons,
  lastWatched,
  duration,
  videos,
  isCompleted = false
}) => {
  const [generating, setGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [certificateExists, setCertificateExists] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);

  // Debug logging
  console.log('🔧 DashboardCard rendering:', {
    title,
    _id,
    videos: videos?.length,
    firstVideo: videos?.[0]
  });

  // Get the first video ID for the watch link
  const firstVideoId = videos && videos.length > 0 ? videos[0]._id || videos[0].id : null;
  const watchLink = firstVideoId ? `/course/${_id}/watch/${firstVideoId}` : `/course/${_id}`;

  console.log('🔧 Watch link:', watchLink);

  // Determine if course is completed (100% progress and all lessons completed)
  const courseCompleted = isCompleted || progress >= 100;

  // Check if certificate exists for this course
  useEffect(() => {
    if (courseCompleted) {
      checkCertificateExists();
    }
  }, [courseCompleted, _id]);

  const checkCertificateExists = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(buildApiUrl(`/api/certificates/course/${_id}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data.certificate) {
          setCertificateExists(true);
          setCertificateId(result.data.certificate.certificateId);
        } else {
          setCertificateExists(false);
          setCertificateId(null);
        }
      } else if (response.status === 404) {
        setCertificateExists(false);
        setCertificateId(null);
      }
    } catch (error) {
      console.error('Error checking certificate:', error);
      setCertificateExists(false);
      setCertificateId(null);
    }
  };

  // Generate certificate function
  const generateCertificate = async () => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(buildApiUrl('/api/certificates/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: _id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate certificate');
      }

      const result = await response.json();
      
      // Update certificate state
      setCertificateExists(true);
      setCertificateId(result.data.certificate.certificateId);
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setGenerating(false);
    }
  };

  // View certificate function
  const viewCertificate = () => {
    if (certificateId) {
      // Navigate to certificates page with the specific certificate
      window.open(`/certificates?certificate=${certificateId}`, '_blank');
    } else {
      // Navigate to general certificates page
      window.open('/certificates', '_blank');
    }
  };

  // Get course condition text
  const getCourseCondition = () => {
    if (courseCompleted) {
      return {
        text: "🎉 Course completed! You've earned your certificate.",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      };
    } else if (progress >= 50) {
      return {
        text: "🚀 Great progress! You're more than halfway through.",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      };
    } else if (progress > 0) {
      return {
        text: "📚 Keep going! You're making good progress.",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200"
      };
    } else {
      return {
        text: "🎯 Ready to start your learning journey!",
        color: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200"
      };
    }
  };

  const condition = getCourseCondition();

  return (
    <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group relative ${
      courseCompleted 
        ? 'ring-2 ring-green-500 ring-opacity-50 bg-gradient-to-br from-green-50 to-white' 
        : ''
    }`}>
      {/* Completion badge */}
      {courseCompleted && (
        <div className="absolute top-3 xxs:top-4 right-3 xxs:right-4 z-10">
          <div className="bg-green-500 text-white px-2 xxs:px-3 py-1 rounded-full text-xs xxs:text-sm font-semibold flex items-center space-x-1">
            <Trophy className="h-3 w-3 xxs:h-4 xxs:w-4" />
            <span>Completed</span>
          </div>
        </div>
      )}

      {/* Glowing effect for completed courses */}
      {courseCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
      )}

      <div className="relative h-32 xxs:h-36 sm:h-40">
        <img
          src={thumbnail}
          alt={title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            courseCompleted ? 'filter brightness-110' : ''
          }`}
          onError={(e) => {
            // Fallback to a default image if thumbnail fails to load
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x225/1f2937/ffffff?text=Course+Thumbnail';
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Link
              to={watchLink}
              className={`rounded-full p-2 xxs:p-3 shadow-lg hover:scale-110 transform transition-transform duration-200 ${
                courseCompleted 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              {courseCompleted ? (
                <CheckCircle className="h-6 w-6 xxs:h-8 xxs:w-8 text-white" />
              ) : (
                <Play className="h-6 w-6 xxs:h-8 xxs:w-8 text-red-600" />
              )}
            </Link>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-200 h-2">
          <div
            className={`h-2 transition-all duration-500 ${
              courseCompleted 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-red-500 to-pink-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="p-4 xxs:p-6">
        <h3 className={`course-title text-base xxs:text-lg font-bold mb-2 xxs:mb-3 transition-colors duration-200 overflow-hidden ${
          courseCompleted 
            ? 'text-green-800 group-hover:text-green-900' 
            : 'text-gray-800 group-hover:text-red-600'
        }`} style={{ 
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </h3>

        <div className="space-y-2 xxs:space-y-3 mb-3 xxs:mb-4">
          <div className="flex items-center justify-between text-xs xxs:text-sm">
            <div className="flex items-center space-x-1 xxs:space-x-2 text-gray-600">
              <BookOpen className="h-3 w-3 xxs:h-4 xxs:w-4" />
              <span>{completedLessons}/{totalLessons} lessons</span>
            </div>
            <div className="flex items-center space-x-1 xxs:space-x-2 text-gray-600">
              <Clock className="h-3 w-3 xxs:h-4 xxs:w-4" />
              <span>{duration}</span>
            </div>
          </div>

          {/* Course Progress Bar */}
          <CourseProgressBar
            progress={progress}
            completedLessons={completedLessons}
            totalLessons={totalLessons}
            isCompleted={courseCompleted}
          />
        </div>

        <div className="flex flex-col xxs:flex-row space-y-2 xxs:space-y-0 xxs:space-x-3 mb-3 xxs:mb-4">
          <Link
            to={watchLink}
            className={`flex-1 font-semibold py-2 px-3 xxs:px-4 rounded-lg transition-all duration-200 text-center text-xs xxs:text-sm ${
              courseCompleted
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {courseCompleted ? 'Review Course' : progress > 0 ? 'Continue' : 'Start Course'}
          </Link>
          <Link
            to={`/my-course/${_id}`}
            className="flex-1 border border-gray-300 hover:border-red-300 text-gray-700 hover:text-red-600 font-semibold py-2 px-3 xxs:px-4 rounded-lg transition-all duration-200 text-center text-xs xxs:text-sm"
          >
            View Details
          </Link>
        </div>

        {/* Course Condition Explanation */}
        <div className={`p-2 xxs:p-3 rounded-lg border ${condition.bgColor} ${condition.borderColor} mb-2 xxs:mb-3`}>
          <p className={`text-xs xxs:text-sm font-medium ${condition.color}`}>
            {condition.text}
          </p>
        </div>

        {/* Certificate Actions */}
        {courseCompleted && (
          <div className="flex flex-col xxs:flex-row xxs:items-center xxs:justify-between space-y-2 xxs:space-y-0">
            <div className="flex items-center space-x-1 xxs:space-x-2 text-xs xxs:text-sm text-gray-600">
              <Award className="h-3 w-3 xxs:h-4 xxs:w-4 text-green-500" />
              <span>
                {certificateExists ? 'Certificate ready' : 'Certificate available'}
              </span>
            </div>
            <div className="flex space-x-2">
              {certificateExists ? (
                <button
                  onClick={viewCertificate}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-2 xxs:px-3 py-1 rounded-lg transition-all duration-200 text-xs font-medium"
                >
                  <Eye className="w-3 h-3" />
                  <span>View</span>
                </button>
              ) : (
                <button
                  onClick={generateCertificate}
                  disabled={generating}
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-2 xxs:px-3 py-1 rounded-lg transition-all duration-200 text-xs font-medium"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="mt-2 xxs:mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="w-3 h-3 xxs:w-4 xxs:h-4" />
              <span className="text-xs xxs:text-sm">Certificate generated successfully!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;