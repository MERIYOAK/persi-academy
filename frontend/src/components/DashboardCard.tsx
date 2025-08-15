import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, CheckCircle, BookOpen, Trophy } from 'lucide-react';
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

  // Determine if course is completed (90% or more progress)
  const courseCompleted = isCompleted || progress >= 90;

  return (
    <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group relative ${
      courseCompleted 
        ? 'ring-2 ring-green-500 ring-opacity-50 bg-gradient-to-br from-green-50 to-white' 
        : ''
    }`}>
      {/* Completion badge */}
      {courseCompleted && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Trophy className="h-4 w-4" />
            <span>Completed</span>
          </div>
        </div>
      )}

      {/* Glowing effect for completed courses */}
      {courseCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
      )}

      <div className="relative h-40">
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
              className={`rounded-full p-3 shadow-lg hover:scale-110 transform transition-transform duration-200 ${
                courseCompleted 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              {courseCompleted ? (
                <CheckCircle className="h-8 w-8 text-white" />
              ) : (
                <Play className="h-8 w-8 text-red-600" />
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

      <div className="p-6">
        <h3 className={`course-title text-lg font-bold mb-3 transition-colors duration-200 overflow-hidden ${
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

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <BookOpen className="h-4 w-4" />
              <span>{completedLessons}/{totalLessons} lessons</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4" />
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

        <div className="flex space-x-3">
          <Link
            to={watchLink}
            className={`flex-1 font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-center text-sm ${
              courseCompleted
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {courseCompleted ? 'Review Course' : progress > 0 ? 'Continue' : 'Start Course'}
          </Link>
          <Link
            to={`/course/${_id}`}
            className="flex-1 border border-gray-300 hover:border-red-300 text-gray-700 hover:text-red-600 font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-center text-sm"
          >
            View Details
          </Link>
        </div>

        {/* Completion status */}
        {courseCompleted && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-green-600 bg-green-50 py-2 px-3 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Course Completed!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;