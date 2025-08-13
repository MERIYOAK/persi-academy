import React from 'react';
import { Play, CheckCircle, Clock, Lock } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

interface VideoPlaylistProps {
  videos: Video[];
  currentVideoId: string;
  onVideoSelect: (videoId: string) => void;
  courseTitle: string;
}

const VideoPlaylist: React.FC<VideoPlaylistProps> = ({
  videos,
  currentVideoId,
  onVideoSelect,
  courseTitle
}) => {
  const completedCount = videos.filter(v => v.completed).length;
  const progressPercentage = (completedCount / videos.length) * 100;

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-bold text-lg text-gray-800 mb-2">{courseTitle}</h3>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span>{completedCount}/{videos.length} completed</span>
          <span>{Math.round(progressPercentage)}% done</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Video List */}
      <div className="flex-1 overflow-y-auto">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={`border-b border-gray-100 transition-all duration-200 ${
              video.locked 
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:bg-gray-50'
            } ${
              currentVideoId === video.id ? 'bg-red-50 border-red-200' : ''
            }`}
            onClick={() => !video.locked && onVideoSelect(video.id)}
          >
            <div className="p-4 flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {video.locked ? (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <Lock className="h-4 w-4 text-gray-500" />
                  </div>
                ) : video.completed ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                ) : currentVideoId === video.id ? (
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <Play className="h-4 w-4 text-white fill-current" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold text-sm">
                    {index + 1}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-sm mb-1 line-clamp-2 ${
                  currentVideoId === video.id ? 'text-red-600' : 'text-gray-800'
                }`}>
                  {video.title}
                </h4>
                <div className="flex items-center space-x-1 text-gray-500 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>{video.duration}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoPlaylist;