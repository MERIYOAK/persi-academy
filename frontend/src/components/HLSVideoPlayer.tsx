import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/forest/index.css';
import 'videojs-contrib-hls';

interface HLSVideoPlayerProps {
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

const HLSVideoPlayer: React.FC<HLSVideoPlayerProps> = ({
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
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize Video.js player with better configuration
    const player = videojs(videoRef.current, {
      controls: true,
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      sources: [{
        src: src,
        type: 'video/mp4'
      }],
      // Better HLS configuration
      html5: {
        hls: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          overrideNative: true,
          withCredentials: false,
          allowSeeksWithinUnsafeLiveWindow: true,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
        nativeTextTracks: false
      },
      // Security and performance settings
      preload: 'metadata',
      autoplay: false,
      muted: false,
      // Custom styling
      controlBar: {
        children: [
          'playToggle',
          'volumePanel',
          'currentTimeDisplay',
          'timeDivider',
          'durationDisplay',
          'progressControl',
          'playbackRateMenuButton',
          'fullscreenToggle'
        ]
      }
    });

    playerRef.current = player;

    // Event listeners
    player.on('ready', () => {
      console.log('HLS Video.js player ready');
      setIsReady(true);
      setCurrentError(null);
      onReady?.();
    });

    player.on('play', () => {
      console.log('HLS Video.js player started playing');
      onPlay?.();
    });

    player.on('pause', () => {
      console.log('HLS Video.js player paused');
      onPause?.();
    });

    player.on('ended', () => {
      console.log('HLS Video.js player ended');
      onEnded?.();
    });

    player.on('error', (error: any) => {
      console.error('HLS Video.js player error:', error);
      const errorMessage = error?.message || 'Video playback error';
      setCurrentError(errorMessage);
      onError?.(error);
    });

    player.on('loadstart', () => {
      console.log('HLS Video.js player loading started');
    });

    player.on('loadedmetadata', () => {
      console.log('HLS Video.js player metadata loaded');
    });

    player.on('canplay', () => {
      console.log('HLS Video.js player can play');
    });

    player.on('waiting', () => {
      console.log('HLS Video.js player waiting for data');
    });

    player.on('playing', () => {
      console.log('HLS Video.js player playing');
    });

    player.on('loadeddata', () => {
      console.log('HLS Video.js player data loaded');
    });

    // Cleanup function
    return () => {
      if (playerRef.current) {
        console.log('Destroying HLS Video.js player');
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, onPlay, onPause, onEnded, onError, onReady]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    if (playing) {
      playerRef.current.play().catch((error: any) => {
        console.error('Failed to play video:', error);
        setCurrentError(`Play failed: ${error.message}`);
      });
    } else {
      playerRef.current.pause();
    }
  }, [playing, isReady]);

  // Handle playback rate changes
  useEffect(() => {
    if (!playerRef.current || !isReady) return;
    playerRef.current.playbackRate(playbackRate);
  }, [playbackRate, isReady]);

  // Manual play function
  const handleManualPlay = () => {
    if (playerRef.current && isReady) {
      playerRef.current.play().catch((error: any) => {
        console.error('Manual play failed:', error);
        setCurrentError(`Manual play failed: ${error.message}`);
      });
    }
  };

  return (
    <div className={`hls-video-player ${className}`}>
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-theme-forest vjs-big-play-centered"
          data-setup="{}"
          title={title}
        />
      </div>
      
      {/* Manual play button overlay */}
      {!playing && isReady && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={handleManualPlay}
            className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-colors duration-200 pointer-events-auto"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
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
            <p>Loading HLS Video Player...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .hls-video-player {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .video-js {
          width: 100%;
          height: 100%;
        }
        
        .vjs-theme-forest {
          --vjs-theme-forest--primary: #00ff00;
          --vjs-theme-forest--secondary: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default HLSVideoPlayer; 