import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

interface SimpleVideoPlayerProps {
  src: string;
  title?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onReady?: () => void;
  playing?: boolean;
  playbackRate?: number;
  className?: string;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  src,
  title,
  onPlay,
  onPause,
  onEnded,
  onError,
  onReady,
  playing = false,
  playbackRate = 1,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      console.log('Simple video player metadata loaded');
      setDuration(video.duration);
      setIsReady(true);
      setCurrentError(null);
      onReady?.();
    };

    const handleCanPlay = () => {
      console.log('Simple video player can play');
    };

    const handlePlay = () => {
      console.log('Simple video player started playing');
      onPlay?.();
    };

    const handlePause = () => {
      console.log('Simple video player paused');
      onPause?.();
    };

    const handleEnded = () => {
      console.log('Simple video player ended');
      onEnded?.();
    };

    const handleError = (e: Event) => {
      console.error('Simple video player error:', e);
      const errorMessage = 'Video playback error';
      setCurrentError(errorMessage);
      onError?.(e);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedData = () => {
      console.log('Simple video player data loaded');
    };

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadeddata', handleLoadedData);

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [onPlay, onPause, onEnded, onError, onReady]);

  // Handle play/pause state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    if (playing) {
      video.play().catch((error: any) => {
        console.error('Failed to play video:', error);
        setCurrentError(`Play failed: ${error.message}`);
      });
    } else {
      video.pause();
    }
  }, [playing, isReady]);

  // Handle playback rate changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;
    video.playbackRate = playbackRate;
  }, [playbackRate, isReady]);

  // Manual play function
  const handleManualPlay = () => {
    const video = videoRef.current;
    if (video && isReady) {
      video.play().catch((error: any) => {
        console.error('Manual play failed:', error);
        setCurrentError(`Manual play failed: ${error.message}`);
      });
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if ((video as any).webkitRequestFullscreen) {
        (video as any).webkitRequestFullscreen();
      } else if ((video as any).msRequestFullscreen) {
        (video as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`simple-video-player ${className}`}>
      <div className="relative w-full h-full bg-black">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full"
          preload="metadata"
          crossOrigin="anonymous"
          title={title}
        />
        
        {/* Manual play button overlay */}
        {!playing && isReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={handleManualPlay}
              className="custom-play-button pointer-events-auto"
            >
              <Play className="w-8 h-8 text-white" />
            </button>
          </div>
        )}

        {/* Custom controls */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 video-controls p-4">
            <div className="flex items-center space-x-4 text-white">
              {/* Play/Pause button */}
              <button
                onClick={playing ? () => videoRef.current?.pause() : handleManualPlay}
                className="text-white hover:text-gray-300"
              >
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              {/* Time display */}
              <div className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Progress bar */}
              <div className="flex-1 bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>

              {/* Volume button */}
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* Fullscreen button */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {currentError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white p-4">
              <p className="text-lg mb-2">Video Error</p>
              <p className="text-sm text-red-400">{currentError}</p>
              <button
                onClick={() => setCurrentError(null)}
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p>Loading Video Player...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleVideoPlayer; 