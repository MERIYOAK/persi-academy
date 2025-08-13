import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, CheckCircle, BookOpen } from 'lucide-react';

interface DashboardCardProps {
  id: string;
  title: string;
  thumbnail: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastWatched?: string;
  duration: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  id,
  title,
  thumbnail,
  progress,
  totalLessons,
  completedLessons,
  lastWatched,
  duration
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative h-40">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Link
              to={`/course/${id}/watch/${lastWatched || '1'}`}
              className="bg-white rounded-full p-3 shadow-lg hover:scale-110 transform transition-transform duration-200"
            >
              <Play className="h-8 w-8 text-red-600" />
            </Link>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-200 h-1">
          <div
            className="bg-red-600 h-1 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2">
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

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-red-600">{progress}%</span>
          </div>

          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-500 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-0 w-2 h-2 bg-white rounded-full shadow-sm transform translate-x-1"></div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Link
            to={`/course/${id}/watch/${lastWatched || '1'}`}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-center text-sm"
          >
            {progress > 0 ? 'Continue' : 'Start Course'}
          </Link>
          <Link
            to={`/course/${id}`}
            className="flex-1 border border-gray-300 hover:border-red-300 text-gray-700 hover:text-red-600 font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-center text-sm"
          >
            View Details
          </Link>
        </div>

        {progress === 100 && (
          <div className="mt-3 flex items-center justify-center space-x-2 text-green-600 bg-green-50 py-2 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;