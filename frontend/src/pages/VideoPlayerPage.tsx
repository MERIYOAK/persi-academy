import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, Clock, CheckCircle, Play, Pause, Volume2, VolumeX, Maximize, SkipForward } from 'lucide-react';
import VideoPlaylist from '../components/VideoPlaylist';
import VideoProgressBar from '../components/VideoProgressBar';

interface Video {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  completed?: boolean;
  locked?: boolean;
  progress?: {
    watchedDuration: number;
    totalDuration: number;
    watchedPercentage: number;
    completionPercentage: number;
    isCompleted: boolean;
    lastPosition: number;
  };
}

interface CourseData {
  title: string;
  videos: Video[];
  overallProgress?: {
    totalVideos: number;
    completedVideos: number;
    totalProgress: number;
    lastWatchedVideo: string | null;
    lastWatchedPosition: number;
  };
}

const VideoPlayerPage = () => {
  const { id, videoId } = useParams<{ id: string; videoId: string }>();
  const navigate = useNavigate();
  const [currentVideoId, setCurrentVideoId] = useState(videoId || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [progressUpdateTimeout, setProgressUpdateTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);
  const [videoLoading, setVideoLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentVideoProgress, setCurrentVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Enhanced error handling functions
  const getVideoErrorDetails = (error: any): { type: string; message: string; userMessage: string } => {
    const video = error.target as HTMLVideoElement;
    const errorCode = video.error?.code;
    
    console.log('🔍 [VideoPlayer] Error details:', {
      errorCode,
      networkState: video.networkState,
      readyState: video.readyState,
      src: video.src,
      error: video.error
    });

    switch (errorCode) {
      case 1: // MEDIA_ERR_ABORTED
        return {
          type: 'ABORTED',
          message: 'Video loading was aborted',
          userMessage: 'Video loading was interrupted. Please try again.'
        };
      case 2: // MEDIA_ERR_NETWORK
        return {
          type: 'NETWORK',
          message: 'Network error occurred while loading video',
          userMessage: 'Network error. Please check your internet connection and try again.'
        };
      case 3: // MEDIA_ERR_DECODE
        return {
          type: 'DECODE',
          message: 'Video decoding error',
          userMessage: 'Video format not supported. Please try a different browser.'
        };
      case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
        return {
          type: 'SRC_NOT_SUPPORTED',
          message: 'Video source not supported',
          userMessage: 'This video format is not supported. Please contact support.'
        };
      default:
        return {
          type: 'UNKNOWN',
          message: 'Unknown video error occurred',
          userMessage: 'An unexpected error occurred. Please try refreshing the page.'
        };
    }
  };

  const isUrlExpired = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const expiresParam = urlObj.searchParams.get('X-Amz-Date') || urlObj.searchParams.get('Expires');
      if (expiresParam) {
        const expiryTime = parseInt(expiresParam);
        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime > expiryTime;
      }
      return false;
    } catch (error) {
      console.log('🔍 [VideoPlayer] Could not parse URL for expiry check:', error);
      return false;
    }
  };

  const retryVideoLoad = async () => {
    if (!currentVideo || retryCount >= 3) {
      console.log('❌ [VideoPlayer] Max retries reached or no current video');
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    setVideoError(null);

    console.log(`🔄 [VideoPlayer] Retrying video load (attempt ${retryCount + 1}/3)`);

    try {
      // Clear current video source
      if (videoRef.current) {
        videoRef.current.src = '';
        videoRef.current.load();
      }

      // Wait a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to get a fresh video URL
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`http://localhost:5000/api/progress/course/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const videoData = result.data.videos.find((v: any) => v._id === currentVideoId);
          
          if (videoData && videoData.videoUrl) {
            console.log('✅ [VideoPlayer] Got fresh video URL, retrying...');
            
            // Update the video source
            if (videoRef.current) {
              videoRef.current.src = videoData.videoUrl;
              videoRef.current.load();
            }
          } else {
            throw new Error('Could not get fresh video URL');
          }
        } else {
          throw new Error('Failed to fetch fresh video URL');
        }
      } else {
        throw new Error('No authentication token');
      }
    } catch (error) {
      console.error('❌ [VideoPlayer] Retry failed:', error);
      const errorDetails = getVideoErrorDetails({ target: videoRef.current });
      setVideoError(errorDetails.userMessage);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const error = e.nativeEvent as Event;
    const video = error.target as HTMLVideoElement;
    
    console.error('❌ [VideoPlayer] Video error occurred:', {
      error,
      video,
      currentSrc: video.src,
      networkState: video.networkState,
      readyState: video.readyState
    });

    const errorDetails = getVideoErrorDetails(e);
    console.log('🔍 [VideoPlayer] Error analysis:', errorDetails);

    // Check if it's a URL expiry issue
    if (video.src && isUrlExpired(video.src)) {
      console.log('🔍 [VideoPlayer] Detected expired URL, will retry with fresh URL');
      setVideoError('Video link expired. Retrying with fresh link...');
      retryVideoLoad();
      return;
    }

    // Check if we should retry
    if (retryCount < 3) {
      console.log(`🔄 [VideoPlayer] Will retry video load (attempt ${retryCount + 1}/3)`);
      setVideoError(`Loading failed. Retrying... (${retryCount + 1}/3)`);
      retryVideoLoad();
      return;
    }

    // Max retries reached, show final error
    console.log('❌ [VideoPlayer] Max retries reached, showing final error');
    setVideoError(errorDetails.userMessage);
    setError(`Video Error: ${errorDetails.message}`);
  };

  // Progress tracking function
  const updateProgress = useCallback(async (watchedDuration: number, totalDuration: number, timestamp: number) => {
    if (!id || !currentVideoId) return;

    // Only update progress every 5 seconds to avoid too many API calls
    const now = Date.now();
    if (now - lastProgressUpdate < 5000) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: id,
          videoId: currentVideoId,
          watchedDuration,
          totalDuration,
          timestamp
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLastProgressUpdate(now);
        
        // Update course data with new progress
        if (courseData && result.data.courseProgress) {
          setCourseData(prev => {
            if (!prev) return null;
            
            // Update overall progress
            const updatedCourseData = {
              ...prev,
              overallProgress: result.data.courseProgress
            };
            
            // Update current video's progress if we have video progress data
            if (result.data.videoProgress && currentVideoId) {
              updatedCourseData.videos = prev.videos.map(video => 
                video.id === currentVideoId 
                  ? { 
                      ...video, 
                      progress: {
                        ...video.progress,
                        watchedPercentage: result.data.videoProgress.watchedPercentage,
                        completionPercentage: result.data.videoProgress.completionPercentage,
                        watchedDuration: result.data.videoProgress.watchedDuration,
                        totalDuration: result.data.videoProgress.totalDuration,
                        isCompleted: result.data.videoProgress.isCompleted
                      }
                    }
                  : video
              );
            }
            
            return updatedCourseData;
          });
          
          // Update current video progress display
          if (result.data.videoProgress) {
            setCurrentVideoProgress(result.data.videoProgress.watchedPercentage || 0);
            console.log('🔧 [VideoPlayer] Updated video progress display:', result.data.videoProgress.watchedPercentage);
            console.log('🔧 [VideoPlayer] Video completion percentage:', result.data.videoProgress.completionPercentage);
          }
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [id, currentVideoId, courseData, lastProgressUpdate]);

  // Fetch course and video data with progress
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        console.log('🔧 [VideoPlayer] Starting to fetch course data...');
        console.log('   - Course ID:', id);
        console.log('   - Video ID:', videoId);
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('❌ [VideoPlayer] No authentication token found');
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        console.log('✅ [VideoPlayer] Authentication token found');
        
        // First, check if user has purchased this course
        console.log('🔧 [VideoPlayer] Checking course purchase...');
        const purchaseResponse = await fetch(`http://localhost:5000/api/payment/check-purchase/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!purchaseResponse.ok) {
          console.log('❌ [VideoPlayer] Purchase verification failed:', purchaseResponse.status);
          throw new Error('Failed to verify course purchase');
        }
        
        const purchaseResult = await purchaseResponse.json();
        console.log('🔧 [VideoPlayer] Purchase result:', purchaseResult);
        
        if (!purchaseResult.data.hasPurchased) {
          console.log('❌ [VideoPlayer] User has not purchased this course');
          setError('You need to purchase this course to watch the videos');
          setLoading(false);
          return;
        }
        
        console.log('✅ [VideoPlayer] Course purchase verified');
        
        // Fetch course progress data
        console.log('🔧 [VideoPlayer] Fetching course progress...');
        const progressResponse = await fetch(`http://localhost:5000/api/progress/course/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!progressResponse.ok) {
          console.log('❌ [VideoPlayer] Progress fetch failed:', progressResponse.status);
          throw new Error('Failed to fetch course progress');
        }
        
        const progressResult = await progressResponse.json();
        console.log('🔧 [VideoPlayer] Progress data received:', progressResult);
        
        const course = progressResult.data.course;
        const videosWithProgress = progressResult.data.videos;
        const overallProgress = progressResult.data.overallProgress;
        
        // Transform videos to match expected format
        const transformedVideos = videosWithProgress.map((video: any) => {
          // Try to get cached URL first
          const cachedUrl = getCachedVideoUrl(video._id);
          const videoUrl = cachedUrl || video.videoUrl || '';
          
          // Cache the URL if it's new
          if (video.videoUrl && !cachedUrl) {
            cacheVideoUrl(video._id, video.videoUrl);
          }

              return {
            id: video._id,
            title: video.title,
            duration: video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '00:00',
            videoUrl: videoUrl,
            completed: video.progress.isCompleted,
            locked: false,
            progress: video.progress
          };
        });
        
        setCourseData({
          title: course.title,
          videos: transformedVideos,
          overallProgress
        });
        
        // Set current video if not already set
        if (!currentVideoId && transformedVideos.length > 0) {
          console.log('🔧 [VideoPlayer] Setting current video to first video:', transformedVideos[0].id);
          setCurrentVideoId(transformedVideos[0].id);
        }
        
        console.log('✅ [VideoPlayer] Course data setup completed');
        
      } catch (error) {
        console.error('❌ [VideoPlayer] Error fetching course data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseData();
    }
  }, [id, videoId, currentVideoId]);

  // Fetch resume position when current video changes
  useEffect(() => {
    const fetchResumePosition = async () => {
      if (!currentVideoId || !id) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch resume position
        const resumeResponse = await fetch(`http://localhost:5000/api/progress/resume/${id}/${currentVideoId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (resumeResponse.ok) {
          const resumeResult = await resumeResponse.json();
          const resumePosition = resumeResult.data.resumePosition;

          // Set video to resume position after a short delay
          setTimeout(() => {
            if (videoRef.current && resumePosition > 0) {
              videoRef.current.currentTime = resumePosition;
              console.log(`✅ [VideoPlayer] Resumed video at ${resumePosition}s`);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error fetching resume position:', error);
      }
    };

    fetchResumePosition();
  }, [currentVideoId, id]);

  useEffect(() => {
    if (videoId) {
      setCurrentVideoId(videoId);
    }
  }, [videoId]);

  const currentVideo = courseData?.videos.find(v => v.id === currentVideoId);

  // Format time
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      
      setCurrentTime(currentTime);
      setDuration(duration);

      // Update progress every 5 seconds
      if (progressUpdateTimeout) {
        clearTimeout(progressUpdateTimeout);
      }

      const timeout = setTimeout(() => {
        updateProgress(currentTime, duration, currentTime);
      }, 5000);

      setProgressUpdateTimeout(timeout);
    }
  };

  // Handle video end
  const handleVideoEnd = async () => {
    if (!id || !currentVideoId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Mark video as completed
      await fetch('http://localhost:5000/api/progress/complete-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: id,
          videoId: currentVideoId
        })
      });

      // Get next video
      const nextVideoResponse = await fetch(`http://localhost:5000/api/progress/next-video/${id}/${currentVideoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (nextVideoResponse.ok) {
        const nextVideoResult = await nextVideoResponse.json();
        const nextVideo = nextVideoResult.data.nextVideo;

        if (nextVideo) {
          // Navigate to next video
          navigate(`/course/${id}/watch/${nextVideo._id}`);
        } else {
          // Course completed
          console.log('🎉 Course completed!');
        }
      }
    } catch (error) {
      console.error('Error handling video end:', error);
    }
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (newRate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
      console.log('🎚️ Playback rate changed to:', newRate);
    }
  };

  // Apply playback rate when it changes
  useEffect(() => {
    if (videoRef.current && playerReady) {
      videoRef.current.playbackRate = playbackRate;
      console.log('🎚️ Applied playback rate:', playbackRate);
    }
  }, [playbackRate, playerReady]);

  // Handle video selection
  const handleVideoSelect = (newVideoId: string) => {
    setCurrentVideoId(newVideoId);
    setIsPlaying(false);
    setPlayerReady(false);
    setCurrentTime(0);
    setDuration(0);
    // Reset error states when changing videos
    setVideoError(null);
    setRetryCount(0);
    setIsRetrying(false);
    setError(null);
    window.history.pushState(null, '', `/course/${id}/watch/${newVideoId}`);
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
      if (!document.fullscreenElement) {
        videoContainer.requestFullscreen?.() || 
        (videoContainer as any).webkitRequestFullscreen?.() || 
        (videoContainer as any).msRequestFullscreen?.();
      } else {
        document.exitFullscreen?.() || 
        (document as any).webkitExitFullscreen?.() || 
        (document as any).msExitFullscreen?.();
      }
    }
  };

  // Handle progress bar click for video seeking
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progressWidth = rect.width;
      const clickPercentage = clickX / progressWidth;
      const newTime = clickPercentage * duration;
      
      // Update video current time
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      
      console.log('🎯 Seeking to:', newTime.toFixed(2), 'seconds (', (clickPercentage * 100).toFixed(1), '%)');
    }
  };

  // Handle play/pause toggle
  const handlePlayPause = () => {
    console.log('🎮 Play/Pause button clicked');
    console.log('🎮 Current player ready state:', playerReady);
    console.log('🎮 Current playing state:', isPlaying);
    
    if (videoRef.current && playerReady) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error('❌ Failed to play video:', error);
          setError(`Play failed: ${error.message}`);
        });
      }
    } else {
      console.log('❌ Player not ready yet, cannot play');
    }
  };

  // Handle manual play button click
  const handleManualPlayClick = () => {
    console.log('🎮 Manual play button clicked');
    console.log('🎮 Current player ready state:', playerReady);
    
    if (videoRef.current && playerReady) {
      videoRef.current.play().catch(error => {
        console.error('❌ Failed to play video:', error);
        setError(`Play failed: ${error.message}`);
      });
    } else {
      console.log('❌ Player not ready, cannot play');
    }
  };

  // Handle mouse events for controls visibility
  const showControlsOverlay = () => {
    setControlsVisible(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  };

  const hideControls = () => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    if (isPlaying) {
      const timeout = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
      setControlsTimeout(timeout);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      if (progressUpdateTimeout) {
        clearTimeout(progressUpdateTimeout);
      }
    };
  }, [controlsTimeout, progressUpdateTimeout]);

  // Reset error states when course or video changes
  useEffect(() => {
    setVideoError(null);
    setRetryCount(0);
    setIsRetrying(false);
    setError(null);
  }, [id, videoId]);

  // Debug current video state
  useEffect(() => {
    console.log('🔧 [VideoPlayer] Current video state updated:');
    console.log('   - currentVideoId:', currentVideoId);
    console.log('   - currentVideo:', currentVideo);
    console.log('   - courseData:', courseData);
    console.log('   - isPlaying:', isPlaying);
    console.log('   - playbackRate:', playbackRate);
    
    // Additional debugging for video selection
    if (courseData && courseData.videos) {
      console.log('🔧 [VideoPlayer] Video selection debugging:');
      console.log('   - Total videos in courseData:', courseData.videos.length);
      console.log('   - All video IDs:', courseData.videos.map(v => v.id));
      console.log('   - Looking for video with ID:', currentVideoId);
      console.log('   - Found video:', courseData.videos.find(v => v.id === currentVideoId));
      
      // Check if currentVideoId matches any video
      const matchingVideo = courseData.videos.find(v => v.id === currentVideoId);
      if (!matchingVideo) {
        console.log('❌ [VideoPlayer] No video found with currentVideoId:', currentVideoId);
        console.log('   - Available video IDs:', courseData.videos.map(v => v.id));
        console.log('   - ID comparison:', courseData.videos.map(v => ({ id: v.id, matches: v.id === currentVideoId })));
      } else {
        console.log('✅ [VideoPlayer] Found matching video:', matchingVideo);
      }
    }
  }, [currentVideoId, currentVideo, courseData, isPlaying, playbackRate]);

  // Update current video progress display
  useEffect(() => {
    if (currentVideo?.progress) {
      // Use the completionPercentage from the backend, or calculate it from watchedDuration/totalDuration
      let actualProgress = currentVideo.progress.completionPercentage || 0;
      
      // If completionPercentage is 0 but we have watchedDuration, calculate it manually
      if (actualProgress === 0 && currentVideo.progress.watchedDuration > 0 && currentVideo.progress.totalDuration > 0) {
        actualProgress = Math.round((currentVideo.progress.watchedDuration / currentVideo.progress.totalDuration) * 100);
      }
      
      setCurrentVideoProgress(actualProgress);
      console.log('🔧 [VideoPlayer] Updated video progress display:', actualProgress);
      console.log('🔧 [VideoPlayer] Raw progress data:', currentVideo.progress);
    } else {
      setCurrentVideoProgress(0);
    }
  }, [currentVideo]);

  // Video preloading and caching
  useEffect(() => {
    if (!courseData?.videos) return;

    // Preload next video for better performance
    const currentIndex = courseData.videos.findIndex(v => v.id === currentVideoId);
    if (currentIndex >= 0 && currentIndex < courseData.videos.length - 1) {
      const nextVideo = courseData.videos[currentIndex + 1];
      if (nextVideo.videoUrl) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'video';
        preloadLink.href = nextVideo.videoUrl;
        document.head.appendChild(preloadLink);
        
        console.log('🔧 [VideoPlayer] Preloading next video:', nextVideo.title);
        
        // Cleanup preload link after a delay
        setTimeout(() => {
          if (document.head.contains(preloadLink)) {
            document.head.removeChild(preloadLink);
          }
        }, 30000); // Remove after 30 seconds
      }
    }
  }, [courseData, currentVideoId]);

  // Video caching with localStorage
  const cacheVideoUrl = useCallback((videoId: string, videoUrl: string) => {
    try {
      const cache = JSON.parse(localStorage.getItem('videoUrlCache') || '{}');
      cache[videoId] = {
        url: videoUrl,
        timestamp: Date.now()
      };
      localStorage.setItem('videoUrlCache', JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching video URL:', error);
    }
  }, []);

  const getCachedVideoUrl = useCallback((videoId: string) => {
    try {
      const cache = JSON.parse(localStorage.getItem('videoUrlCache') || '{}');
      const cached = cache[videoId];
      if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.url;
      }
    } catch (error) {
      console.error('Error getting cached video URL:', error);
    }
    return null;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !courseData || !currentVideo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center max-w-md mx-auto p-8">
          <h2 className="text-2xl font-bold mb-4">
            {error?.includes('purchase') ? 'Course Not Purchased' : 'Video not found'}
          </h2>
          <p className="text-gray-400 mb-6">
            {error || 'The video you are looking for does not exist.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {error?.includes('purchase') ? (
              <Link
                to={`/course/${id}`}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Purchase Course
              </Link>
            ) : (
          <Link
            to="/courses"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Back to Courses
          </Link>
            )}
            <Link
              to="/dashboard"
              className="border border-gray-600 text-gray-300 hover:text-white px-6 py-3 rounded-lg transition-colors duration-200"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/course/${id}`}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to Course</span>
            </Link>
            <div className="hidden md:block h-6 w-px bg-gray-600" />
            <h1 className="hidden md:block text-white font-semibold truncate">
              {courseData.title}
            </h1>
          </div>
          
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="md:hidden flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
          >
            <BookOpen className="h-5 w-5" />
            <span>Playlist</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Video Player Section */}
        <div className="flex-1 flex flex-col">
          {/* Player */}
          <div 
            className="relative bg-black flex-1 flex items-center justify-center"
            onMouseMove={showControlsOverlay}
            onMouseLeave={hideControls}
          >
            {currentVideo?.videoUrl ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  src={currentVideo.videoUrl}
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedData={() => setPlayerReady(true)}
                  onEnded={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                    }
                    handleVideoEnd(); // Call the new handleVideoEnd
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    setDuration(video.duration);
                  }}
                  onError={handleVideoError}
                  onLoadStart={() => {
                    console.log('🔧 [VideoPlayer] Video loading started');
                    setVideoLoading(true);
                    setLoadingProgress(0);
                  }}
                  onCanPlay={() => {
                    console.log('🔧 [VideoPlayer] Video can start playing');
                    setVideoLoading(false);
                    setLoadingProgress(100);
                  }}
                  onProgress={(e) => {
                    const video = e.target as HTMLVideoElement;
                    if (video.buffered.length > 0) {
                      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                      const duration = video.duration;
                      if (duration > 0) {
                        const progress = (bufferedEnd / duration) * 100;
                        setLoadingProgress(Math.min(progress, 100));
                      }
                    }
                  }}
                  muted={isMuted}
                />
            ) : (
              <div className="text-center text-gray-400">
                {videoError ? (
                  // Error state
                  <div className="space-y-4">
                    <div className="text-red-400">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-lg font-semibold mb-2">Video Error</p>
                      <p className="text-sm">{videoError}</p>
                    </div>
                    
                    {retryCount < 3 && !isRetrying && (
                      <button
                        onClick={retryVideoLoad}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-semibold"
                      >
                        Try Again
                      </button>
                    )}
                    
                    {isRetrying && (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                        <span>Retrying...</span>
                      </div>
                    )}
                    
                    {retryCount >= 3 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">All retry attempts failed</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                        >
                          Refresh Page
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Loading state
                  <div>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p>Loading video...</p>
                    <p className="text-sm mt-2">This may take a few moments</p>
                    {videoLoading && (
                      <div className="mt-4 w-64 mx-auto">
                        <div className="bg-gray-700 rounded-full h-2 mb-2">
                          <div 
                            className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                          />
                      </div>
                        <p className="text-xs text-gray-500">{Math.round(loadingProgress)}% loaded</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Manual Play Button */}
            {!isPlaying && playerReady && (
                      <button
                onClick={handleManualPlayClick}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 hover:bg-opacity-40 transition-all duration-200"
                      >
                <div className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all duration-200">
                  <Play className="h-12 w-12 text-gray-900 ml-1" />
                </div>
                      </button>
            )}

            {/* Controls Overlay */}
            {controlsVisible && (
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div 
                      className="w-full h-1 bg-gray-600 rounded-full cursor-pointer"
                      onClick={handleProgressClick}
                    >
                      <div 
                        className="h-1 bg-red-500 rounded-full transition-all duration-100"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handlePlayPause}
                        className="text-white hover:text-gray-300 transition-colors duration-200"
                      >
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                      </button>

                      <div className="flex items-center space-x-2 text-white">
                    <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="hover:text-gray-300 transition-colors duration-200"
                    >
                          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                  </div>

                      <div className="flex items-center space-x-2 text-white text-sm">
                        <span>{formatTime(currentTime)}</span>
                        <span>/</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                    <div className="flex items-center space-x-4">
                      <select
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(Number(e.target.value))}
                        className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>

                  <button
                        onClick={() => videoRef.current?.requestFullscreen()}
                        className="text-white hover:text-gray-300 transition-colors duration-200"
                  >
                        <Maximize className="h-5 w-5" />
                  </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="bg-gray-800 px-4 py-4">
            <h2 className="text-white font-semibold text-lg mb-2">{currentVideo.title}</h2>
            <div className="flex items-center justify-between text-gray-400 text-sm">
              <div className="flex items-center space-x-4">
                <span>Duration: {currentVideo.duration}</span>
                <span>•</span>
                <span>Progress: {currentVideoProgress}%</span>
                    </div>
              <div className="flex items-center space-x-2">
                    {currentVideo.completed && (
                      <div className="flex items-center space-x-1 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed</span>
                      </div>
                    )}
              </div>
                  </div>
                </div>

          {/* Video Progress Bar Section - Below Video Player */}
          <div className="bg-gray-900 px-4 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Video Progress Bar */}
                <VideoProgressBar
                  watchedPercentage={currentVideo?.progress?.watchedPercentage || 0}
                  completionPercentage={currentVideo?.progress?.completionPercentage || 0}
                  isCompleted={currentVideo?.progress?.isCompleted || false}
                />
                
                {/* Course Progress Summary */}
                {courseData.overallProgress && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-white font-semibold text-sm mb-3">Course Overview</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>Total Videos:</span>
                        <span>{courseData.overallProgress.totalVideos}</span>
                  </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Completed:</span>
                        <span className="text-green-400">{courseData.overallProgress.completedVideos}</span>
                </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Course Progress:</span>
                        <span className="text-blue-400">{courseData.overallProgress.totalProgress}%</span>
              </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
          {showPlaylist && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
            <VideoPlaylist
              videos={courseData.videos}
              currentVideoId={currentVideoId}
              onVideoSelect={handleVideoSelect}
              courseProgress={courseData.overallProgress}
            />
          </div>
          )}
      </div>

      {/* Mobile Playlist Overlay */}
      {showPlaylist && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div className="bg-white w-80 ml-auto h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => setShowPlaylist(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Close Playlist
              </button>
            </div>
            <VideoPlaylist
              videos={courseData.videos}
              currentVideoId={currentVideoId}
              onVideoSelect={(videoId) => {
                handleVideoSelect(videoId);
                setShowPlaylist(false);
              }}
              courseTitle={courseData.title}
            />
          </div>
          <div
            className="flex-1"
            onClick={() => setShowPlaylist(false)}
          />
        </div>
      )}
    </div>
  );
};

export default VideoPlayerPage;