import React from 'react';
import { Play, CheckCircle, Clock, Lock } from 'lucide-react';

interface VideoProgress {
  watchedDuration: number;
  totalDuration: number;
  watchedPercentage: number;
  completionPercentage: number;
  isCompleted: boolean;
  lastPosition?: number;
}

interface Video {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  completed?: boolean;
  locked?: boolean;
  progress?: VideoProgress;
}

interface CourseProgress {
  totalVideos: number;
  completedVideos: number;
  totalProgress: number;
  lastWatchedVideo: string | null;
  lastWatchedPosition: number;
}

interface VideoPlaylistProps {
  videos: Video[];
  currentVideoId: string;
  onVideoSelect: (videoId: string) => void;
  courseProgress?: CourseProgress;
}

const VideoPlaylist: React.FC<VideoPlaylistProps> = ({
  videos,
  currentVideoId,
  onVideoSelect,
  courseProgress
}) => {
  // Calculate progress from courseProgress if available, otherwise from videos
  const completedCount = courseProgress 
    ? courseProgress.completedVideos 
    : videos.filter(v => v.completed || v.progress?.isCompleted).length;
  
  const progressPercentage = courseProgress 
    ? courseProgress.totalProgress 
    : (completedCount / videos.length) * 100;

  return (
    <div className="bg-gray-800 h-full flex flex-col text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h3 className="font-bold text-lg text-white mb-2">Course Content</h3>
        <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
          <span>{completedCount}/{videos.length} completed</span>
          <span>{Math.round(progressPercentage)}% done</span>
        </div>
        <div className="bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Video List */}
      <div className="flex-1 overflow-y-auto">
        {videos.map((video, index) => {
          const isCompleted = video.completed || video.progress?.isCompleted;
          const isCurrent = currentVideoId === video.id;
          const progress = video.progress;
          
          return (
          <div
            key={video.id}
              className={`border-b border-gray-700 transition-all duration-200 ${
              video.locked 
                ? 'cursor-not-allowed opacity-50' 
                  : 'cursor-pointer hover:bg-gray-700'
            } ${
                isCurrent ? 'bg-red-900 border-red-600' : ''
            }`}
            onClick={() => !video.locked && onVideoSelect(video.id)}
          >
            <div className="p-4 flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {video.locked ? (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  ) : isCompleted ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  ) : isCurrent ? (
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <Play className="h-4 w-4 text-white fill-current" />
                  </div>
                ) : (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-gray-300 font-semibold text-sm">
                    {index + 1}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-sm mb-1 line-clamp-2 ${
                    isCurrent ? 'text-red-400' : 'text-white'
                }`}>
                  {video.title}
                </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-gray-400 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>{video.duration}</span>
                    </div>
                    {progress && progress.completionPercentage > 0 && (
                      <div className="text-xs text-gray-400">
                        {progress.completionPercentage}%
                      </div>
                    )}
                  </div>
                  
                  {/* Individual video progress bar */}
                  {progress && progress.completionPercentage > 0 && (
                    <div className="mt-2 bg-gray-700 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-green-500' 
                            : 'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${progress.completionPercentage}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoPlaylist;