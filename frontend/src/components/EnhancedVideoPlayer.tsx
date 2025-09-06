import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward,
  Settings
} from 'lucide-react';
import { formatDuration } from '../utils/durationFormatter';

interface EnhancedVideoPlayerProps {
  src: string;
  title?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: MediaError | null) => void;
  onReady?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onProgress?: (watchedDuration: number, totalDuration: number) => void;
  playing?: boolean;
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  className?: string;
  initialTime?: number;
  showControls?: boolean;
  onControlsToggle?: (visible: boolean) => void;
}

const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  src,
  title,
  onPlay,
  onPause,
  onEnded,
  onError,
  onReady,
  onTimeUpdate,
  onProgress,
  playing = false,
  playbackRate = 1,
  onPlaybackRateChange,
  className = '',
  initialTime = 0,
  showControls = true,
  onControlsToggle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(playbackRate);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(showControls);
  const [controlsTimeout, setControlsTimeout] = useState<number | null>(null);

  // Security features
  const [isKeyboardDisabled, setIsKeyboardDisabled] = useState(false);

  // Function to toggle keyboard controls (for security purposes)
  const toggleKeyboardControls = useCallback(() => {
    setIsKeyboardDisabled(prev => !prev);
  }, []);

  // Progress tracking
  const progressUpdateTimeout = useRef<number | null>(null);
  const lastProgressUpdate = useRef(0);
  const PROGRESS_UPDATE_INTERVAL = 30000; // 30 seconds

  // Using the centralized formatDuration utility

  // Security: Disable right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Security: Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isKeyboardDisabled) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        handlePlayPause();
        break;
      case 'KeyM':
        e.preventDefault();
        handleMuteToggle();
        break;
      case 'KeyF':
        e.preventDefault();
        handleFullscreenToggle();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handleSeek(-10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        handleSeek(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        handleVolumeChange(volume + 0.1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleVolumeChange(volume - 0.1);
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKeyboardDisabled, volume]);

  // Security: Prevent drag and drop
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  // Video event handlers
  const handleLoadedData = () => {
    console.log('✅ Enhanced video player ready');
    setIsReady(true);
    setError(null);
    onReady?.();
    
    // Set initial time if provided
    if (initialTime > 0 && videoRef.current) {
      videoRef.current.currentTime = initialTime;
      setCurrentTime(initialTime);
    }
  };

  const handlePlay = () => {
    console.log('🎬 Enhanced video player started playing');
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    console.log('⏸️ Enhanced video player paused');
    setIsPlaying(false);
    onPause?.();
  };

  const handleEnded = () => {
    console.log('🏁 Enhanced video player ended');
    setIsPlaying(false);
    onEnded?.();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      
      setCurrentTime(currentTime);
      setDuration(duration);
      
      onTimeUpdate?.(currentTime, duration);

      // Update buffered progress
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        const bufferedPercentage = (bufferedEnd / duration) * 100;
        setBuffered(bufferedPercentage);
      }

      // Progress tracking (Udemy-style)
      if (progressUpdateTimeout.current) {
        window.clearTimeout(progressUpdateTimeout.current);
      }

      progressUpdateTimeout.current = window.setTimeout(() => {
        const now = Date.now();
        if (now - lastProgressUpdate.current >= PROGRESS_UPDATE_INTERVAL) {
          onProgress?.(currentTime, duration);
          lastProgressUpdate.current = now;
        }
      }, 30000);
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.target as HTMLVideoElement;
    console.error('❌ Enhanced video player error:', video.error);
    console.error('❌ Video src:', src);
    console.error('❌ Video element:', video);
    
    let errorMessage = 'Video playback error';
    
    if (video.error) {
      switch (video.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Video loading was aborted.';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error occurred while loading video.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Video file is corrupted or has unsupported encoding.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video format not supported.';
          break;
        default:
          errorMessage = 'Unknown video playback error.';
      }
    }
    
    setError(errorMessage);
    onError?.(video.error);
  };

  const handleLoadStart = () => {
    console.log('🔧 [EnhancedVideoPlayer] Load start - src:', src);
    setIsLoading(true);
    setError(null);
  };

  const handleCanPlay = () => {
    console.log('✅ [EnhancedVideoPlayer] Can play - video ready');
    setIsLoading(false);
  };

  // Control handlers
  const handlePlayPause = () => {
    if (videoRef.current && isReady) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error('❌ Failed to play video:', error);
          setError(`Play failed: ${error.message}`);
        });
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    setIsMuted(clampedVolume === 0);
    
    if (videoRef.current) {
      videoRef.current.volume = clampedVolume;
      videoRef.current.muted = clampedVolume === 0;
    }
  };

  const handlePlaybackRateChange = (newRate: number) => {
    setCurrentPlaybackRate(newRate);
    onPlaybackRateChange?.(newRate);
    
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  const handleSeek = (seconds: number) => {
    if (videoRef.current && duration > 0) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progressWidth = rect.width;
      const clickPercentage = clickX / progressWidth;
      const newTime = clickPercentage * duration;
      
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Controls visibility
  const showControlsOverlay = () => {
    setControlsVisible(true);
    onControlsToggle?.(true);
    
    if (controlsTimeout) {
      window.clearTimeout(controlsTimeout);
    }
    
    const timeout = window.setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
        onControlsToggle?.(false);
        setShowKeyboardHints(false); // Hide keyboard hints when controls hide
      }
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  const hideControls = () => {
    if (controlsTimeout) {
      window.clearTimeout(controlsTimeout);
    }
    
    if (isPlaying) {
      const timeout = window.setTimeout(() => {
        setControlsVisible(false);
        onControlsToggle?.(false);
      }, 3000);
      setControlsTimeout(timeout);
    }
  };

  // Mouse event handlers
  const handleMouseMove = () => {
    showControlsOverlay();
  };

  const handleMouseLeave = () => {
    hideControls();
  };

  // Handle clicks to hide volume slider
  const handleContainerClick = (e: React.MouseEvent) => {
    // If clicking on the container but not on volume controls, hide volume slider
    if (!e.currentTarget.querySelector('.volume-controls')?.contains(e.target as Node)) {
      setShowVolumeSlider(false);
    }
  };

  // Effects
  useEffect(() => {
    // Set up keyboard event listeners
    document.addEventListener('keydown', handleKeyDown);
    
    // Set up fullscreen change listener
    const handleFullscreenChange = () => {
      // Fullscreen state is handled by the browser
      // No need to track it in component state
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Auto-hide keyboard hints after 5 seconds
    const keyboardHintsTimeout = window.setTimeout(() => {
      setShowKeyboardHints(false);
    }, 5000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      
      if (progressUpdateTimeout.current) {
        window.clearTimeout(progressUpdateTimeout.current);
      }
      
      if (controlsTimeout) {
        window.clearTimeout(controlsTimeout);
      }

      window.clearTimeout(keyboardHintsTimeout);
    };
  }, [handleKeyDown, controlsTimeout]);

  // Update playback rate when prop changes
  useEffect(() => {
    if (videoRef.current && playbackRate !== currentPlaybackRate) {
      setCurrentPlaybackRate(playbackRate);
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, currentPlaybackRate]);

  // Monitor src changes
  useEffect(() => {
    console.log('🔧 [EnhancedVideoPlayer] Src changed:', src);
    if (src && src.trim() !== '') {
      console.log('🔧 [EnhancedVideoPlayer] Setting video src:', src.substring(0, 100) + '...');
    }
  }, [src]);

  // Update playing state when prop changes
  useEffect(() => {
    if (videoRef.current && isReady) {
      if (playing && !isPlaying) {
        videoRef.current.play().catch(error => {
          console.error('❌ Failed to play video:', error);
          setError(`Play failed: ${error.message}`);
        });
      } else if (!playing && isPlaying) {
        videoRef.current.pause();
      }
    }
  }, [playing, isPlaying, isReady]);

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div 
      ref={containerRef}
      className={`enhanced-video-player relative bg-black ${className}`}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      {/* Security Watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
        <div className="text-white/5 text-4xl font-bold transform -rotate-45 select-none">
          {title || 'PROTECTED'}
        </div>
      </div>

      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        preload="metadata"
        crossOrigin="anonymous"
        muted={isMuted}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          pointerEvents: 'auto',
          WebkitFilter: 'none',
          filter: 'none',
          // Ensure video is visible
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          backgroundColor: '#000',
        }}
        onLoadedData={handleLoadedData}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onLoad={() => console.log('🔧 [EnhancedVideoPlayer] Video load event - src:', src)}
        onLoadedMetadata={() => {
          console.log('🔧 [EnhancedVideoPlayer] Video metadata loaded');
          if (videoRef.current) {
            console.log('🔧 [EnhancedVideoPlayer] Video dimensions:', {
              videoWidth: videoRef.current.videoWidth,
              videoHeight: videoRef.current.videoHeight,
              offsetWidth: videoRef.current.offsetWidth,
              offsetHeight: videoRef.current.offsetHeight,
              clientWidth: videoRef.current.clientWidth,
              clientHeight: videoRef.current.clientHeight
            });
          }
        }}
        onCanPlayThrough={() => {
          console.log('🔧 [EnhancedVideoPlayer] Video can play through');
        }}
        onPlaying={() => {
          console.log('🔧 [EnhancedVideoPlayer] Video started playing');
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white p-6 max-w-md">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-lg font-semibold mb-2">Video Error</p>
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        </div>
      )}

      {/* Manual Play Button */}
      {!isPlaying && isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={handlePlayPause}
            className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 pointer-events-auto transform hover:scale-110"
            title="Click to play"
          >
            <Play className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      {controlsVisible && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
            {/* Progress Bar */}
            <div className="mb-4">
              <div 
                className="w-full h-2 bg-gray-600 rounded-full cursor-pointer relative"
                onClick={handleProgressClick}
              >
                {/* Buffered Progress */}
                <div 
                  className="absolute top-0 left-0 h-full bg-gray-500 rounded-full"
                  style={{ width: `${buffered}%` }}
                />
                {/* Played Progress */}
                <div 
                  className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-100"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
                {/* Progress Handle */}
                <div 
                  className="absolute top-0 w-4 h-4 bg-red-500 rounded-full transform -translate-y-1 -translate-x-2 opacity-0 hover:opacity-100 transition-opacity duration-200"
                  style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Skip Backward */}
                <button
                  onClick={() => handleSeek(-10)}
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                  title="Skip backward 10s"
                >
                  <SkipBack className="h-5 w-5" />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                  title="Play/Pause (Space)"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>

                {/* Skip Forward */}
                <button
                  onClick={() => handleSeek(10)}
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                  title="Skip forward 10s"
                >
                  <SkipForward className="h-5 w-5" />
                </button>

                {/* Volume Control */}
                <div 
                  className="relative flex items-center volume-controls"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <button
                    onClick={handleMuteToggle}
                    className="text-white hover:text-gray-300 transition-colors duration-200"
                    title="Mute/Unmute (M)"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  
                  {showVolumeSlider && (
                    <div 
                      className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg p-2"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Time Display */}
                <div className="flex items-center space-x-2 text-white text-sm">
                  <span>{formatDuration(currentTime)}</span>
                  <span>/</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Playback Rate */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white hover:text-gray-300 transition-colors duration-200"
                    title="Playback settings"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  
                  {showSettings && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg p-2 min-w-32">
                      <div className="text-white text-xs mb-2">Playback Speed</div>
                      {playbackRates.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => {
                            handlePlaybackRateChange(rate);
                            setShowSettings(false);
                          }}
                          className={`block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-700 transition-colors duration-200 ${
                            currentPlaybackRate === rate ? 'text-red-400 font-semibold' : 'text-white'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button
                  onClick={handleFullscreenToggle}
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                  title="Fullscreen (F)"
                >
                  <Maximize className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      {controlsVisible && showKeyboardHints && (
        <div 
          className="absolute top-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded opacity-75 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          onClick={() => setShowKeyboardHints(false)}
          title="Click to hide"
        >
          <div>Space: Play/Pause | M: Mute</div>
          <div>←/→: Skip 10s | F: Fullscreen</div>
        </div>
      )}

      {/* Security Notice - Removed */}
    </div>
  );
};

export default EnhancedVideoPlayer;
