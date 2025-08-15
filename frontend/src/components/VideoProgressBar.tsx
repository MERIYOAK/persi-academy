import React from 'react';

interface VideoProgressBarProps {
  watchedPercentage: number;
  completionPercentage: number;
  isCompleted: boolean;
  className?: string;
}

const VideoProgressBar: React.FC<VideoProgressBarProps> = ({
  watchedPercentage,
  completionPercentage,
  isCompleted,
  className = ''
}) => {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="text-white font-semibold text-sm mb-2">Video Progress</h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Watched: {watchedPercentage}%</span>
          <span>Completion: {completionPercentage}%</span>
        </div>
      </div>
      
      {/* Watched Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Watched Progress</span>
          <span>{watchedPercentage}%</span>
        </div>
        <div className="bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${watchedPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Completion Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Completion Status</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isCompleted 
                ? 'bg-green-500' 
                : 'bg-gradient-to-r from-red-500 to-pink-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isCompleted ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-400">Completed</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-blue-400">In Progress</span>
            </>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          {isCompleted ? '100% Complete' : `${completionPercentage}% Complete`}
        </div>
      </div>
    </div>
  );
};

export default VideoProgressBar; 