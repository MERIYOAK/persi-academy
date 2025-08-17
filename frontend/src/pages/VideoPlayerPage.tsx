import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, CheckCircle } from 'lucide-react';
import VideoPlaylist from '../components/VideoPlaylist';
import VideoProgressBar from '../components/VideoProgressBar';
import EnhancedVideoPlayer from '../components/EnhancedVideoPlayer';

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
    lastPosition?: number;
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

  const [videoLoading, setVideoLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentVideoProgress, setCurrentVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [lastPauseTime, setLastPauseTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentVideoPosition, setCurrentVideoPosition] = useState(0); // Track actual video position
  const [currentVideoPercentage, setCurrentVideoPercentage] = useState(0); // Track actual video percentage
  
  // Udemy-style progress tracking: Request deduplication and batching
  const pendingProgressRequest = useRef<AbortController | null>(null);
  const progressUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastProgressUpdate = useRef(0);
  const PROGRESS_UPDATE_INTERVAL = 30000; // 30 seconds minimum between updates
  
  // Note: videoRef is no longer needed as EnhancedVideoPlayer handles video element internally

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

  // Check if presigned URL is expired or will expire soon (within 5 minutes)
  const isPresignedUrlExpired = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const expiresParam = urlObj.searchParams.get('X-Amz-Date') || urlObj.searchParams.get('Expires');
      if (expiresParam) {
        const expiryTime = parseInt(expiresParam);
        const currentTime = Math.floor(Date.now() / 1000);
        const fiveMinutesFromNow = currentTime + (5 * 60); // 5 minutes buffer
        return fiveMinutesFromNow > expiryTime;
      }
      return false;
    } catch (error) {
      console.log('🔍 [VideoPlayer] Could not parse presigned URL for expiry check:', error);
      return false;
    }
  };

  // Refresh presigned URL for a specific video
  const refreshVideoUrl = async (videoId: string): Promise<string | null> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ [VideoPlayer] No authentication token for URL refresh');
        return null;
      }

      console.log(`🔄 [VideoPlayer] Refreshing presigned URL for video: ${videoId}`);
      
      const response = await fetch(`http://localhost:5000/api/progress/course/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const videoData = result.data.videos.find((v: any) => v._id === videoId);
        
        if (videoData && videoData.videoUrl) {
          console.log('✅ [VideoPlayer] Successfully refreshed presigned URL');
          // Cache the new URL
          cacheVideoUrl(videoId, videoData.videoUrl);
          return videoData.videoUrl;
        } else {
          console.error('❌ [VideoPlayer] No video data found for URL refresh');
          return null;
        }
      } else {
        console.error('❌ [VideoPlayer] Failed to refresh presigned URL:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ [VideoPlayer] Error refreshing presigned URL:', error);
      return null;
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
      // Wait a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to refresh the presigned URL
      const freshVideoUrl = await refreshVideoUrl(currentVideoId);
      
      if (freshVideoUrl) {
        console.log('✅ [VideoPlayer] Got fresh presigned URL, retrying...');
        
        // Validate the video URL before setting it
        const videoUrl = freshVideoUrl.trim();
        if (videoUrl && videoUrl !== '' && videoUrl !== window.location.href) {
          // Update the course data with the fresh URL
          setCourseData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              videos: prev.videos.map(video => 
                video.id === currentVideoId 
                  ? { ...video, videoUrl: freshVideoUrl }
                  : video
              )
            };
          });
        } else {
          console.error('❌ [VideoPlayer] Invalid presigned URL received:', {
            videoUrl,
            isEmpty: videoUrl === '',
            isPageUrl: videoUrl === window.location.href
          });
          throw new Error('Invalid presigned URL received from server');
        }
      } else {
        throw new Error('Could not refresh presigned URL');
      }
    } catch (error) {
      console.error('❌ [VideoPlayer] Retry failed:', error);
      setVideoError('Failed to load video. Please try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleVideoError = (error: any) => {
    console.error('❌ [VideoPlayer] Video error occurred:', error);

    // Check if we should retry
    if (retryCount < 3) {
      console.log(`🔄 [VideoPlayer] Will retry video load (attempt ${retryCount + 1}/3)`);
      setVideoError(`Loading failed. Retrying... (${retryCount + 1}/3)`);
      retryVideoLoad();
      return;
    }

    // Max retries reached, show final error
    console.log('❌ [VideoPlayer] Max retries reached, showing final error');
    setVideoError('Video playback error. Please try refreshing the page.');
    setError('Video Error: Playback failed');
  };

  // Udemy-style progress tracking function with request deduplication
  const updateProgress = useCallback(async (watchedDuration: number, totalDuration: number, timestamp: number) => {
    if (!id || !currentVideoId) return;

    const now = Date.now();
    
    // Udemy-style: Check if update is too frequent
    if (now - lastProgressUpdate.current < PROGRESS_UPDATE_INTERVAL) {
      console.log(`⏱️ [Udemy-Style] Progress update too frequent, skipping (${Math.round((now - lastProgressUpdate.current) / 1000)}s ago)`);
      return;
    }

    // Udemy-style: Cancel previous request if it exists
    if (pendingProgressRequest.current) {
      console.log('🔄 [Udemy-Style] Cancelling previous progress request');
      pendingProgressRequest.current.abort();
    }

    // Clear any pending timeout
    if (progressUpdateTimeout.current) {
      clearTimeout(progressUpdateTimeout.current);
      progressUpdateTimeout.current = null;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Create new abort controller for this request
      const abortController = new AbortController();
      pendingProgressRequest.current = abortController;

      console.log(`🔧 [Udemy-Style] Sending progress update: ${watchedDuration}s / ${totalDuration}s`);

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
        }),
        signal: abortController.signal
      });

      if (response.ok) {
        const result = await response.json();
        
        // Only update if not skipped
        if (!result.data?.skipped) {
          lastProgressUpdate.current = now;
          
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
              console.log('✅ [Udemy-Style] Progress updated successfully:', result.data.videoProgress.watchedPercentage + '%');
            }
          }
        } else {
          console.log('⏭️ [Udemy-Style] Progress update skipped by server');
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🔄 [Udemy-Style] Progress request was cancelled');
      } else {
        console.error('❌ [Udemy-Style] Error updating progress:', error);
      }
    } finally {
      // Clean up
      pendingProgressRequest.current = null;
    }
  }, [id, currentVideoId, courseData]);

  // Immediate progress saving function (for pause and navigation) - Udemy-style
  const saveProgressImmediately = useCallback(async (watchedDuration: number, totalDuration: number, timestamp: number) => {
    if (!id || !currentVideoId) return;

    // Udemy-style: Force immediate update regardless of time interval
    console.log('💾 [Udemy-Style] Saving progress immediately:', {
      watchedDuration,
      totalDuration,
      timestamp,
      percentage: totalDuration > 0 ? Math.round((watchedDuration / totalDuration) * 100) : 0
    });

    // Cancel any pending progress request
    if (pendingProgressRequest.current) {
      pendingProgressRequest.current.abort();
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Create new abort controller for immediate request
      const abortController = new AbortController();
      pendingProgressRequest.current = abortController;

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
        }),
        signal: abortController.signal
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Udemy-Style] Progress saved immediately');
        
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
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🔄 [Udemy-Style] Immediate progress request was cancelled');
      } else {
        console.error('❌ [Udemy-Style] Error saving progress immediately:', error);
      }
    } finally {
      // Clean up
      pendingProgressRequest.current = null;
    }
  }, [id, currentVideoId, courseData]);

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

          // Note: Resume position is now handled by EnhancedVideoPlayer's initialTime prop
          console.log(`✅ [VideoPlayer] Resume position set to ${resumePosition}s`);
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

  // Debug logging for video URL issues
  useEffect(() => {
    if (currentVideo) {
      console.log('🔧 [VideoPlayer] Current video details:', {
        id: currentVideo.id,
        title: currentVideo.title,
        videoUrl: currentVideo.videoUrl,
        hasVideoUrl: !!currentVideo.videoUrl,
        videoUrlLength: currentVideo.videoUrl?.length || 0,
        videoUrlTrimmed: currentVideo.videoUrl?.trim() || ''
      });
    } else {
      console.log('🔧 [VideoPlayer] No current video found:', {
        courseDataExists: !!courseData,
        videosCount: courseData?.videos?.length || 0,
        currentVideoId,
        availableVideoIds: courseData?.videos?.map(v => v.id) || []
      });
    }
  }, [currentVideo, courseData, currentVideoId]);

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

  // Note: Time updates are now handled by EnhancedVideoPlayer's onTimeUpdate callback

  // Handle video pause
  const handleVideoPause = () => {
    setIsPlaying(false);
    setIsPaused(true);
    setPauseStartTime(Date.now());
      
      console.log('⏸️ [VideoPlayer] Video paused at:', currentTime, 'seconds');
      
      // Save progress immediately when paused
      saveProgressImmediately(currentTime, duration, currentTime);
  };

  // Handle video play
  const handleVideoPlay = () => {
    setIsPlaying(true);
    setIsPaused(false);
    
    // Check if video was paused for more than 5 seconds
    if (pauseStartTime && Date.now() - pauseStartTime > 5000) {
      console.log('▶️ [VideoPlayer] Video resumed after pause > 5 seconds');
      setLastPauseTime(pauseStartTime);
    }
    
    setPauseStartTime(null);
  };

  // Check for long pauses and save progress
  useEffect(() => {
    if (isPaused && pauseStartTime) {
      const checkPauseDuration = setTimeout(() => {
        const pauseDuration = Date.now() - pauseStartTime;
        if (pauseDuration >= 5000) { // 5 seconds
          console.log('⏰ [VideoPlayer] Video paused for 5+ seconds, ensuring progress is saved');
            saveProgressImmediately(currentTime, duration, currentTime);
        }
      }, 5000);

      return () => clearTimeout(checkPauseDuration);
    }
  }, [isPaused, pauseStartTime, saveProgressImmediately, currentTime, duration]);

  // Handle page navigation and save progress
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isPlaying) {
        console.log('🚪 [VideoPlayer] Page unload detected, saving progress');
        
        // Use synchronous storage to ensure data is saved
        localStorage.setItem('pendingProgress', JSON.stringify({
          courseId: id,
          videoId: currentVideoId,
          watchedDuration: currentTime,
          totalDuration: duration,
          timestamp: currentTime,
          savedAt: Date.now()
        }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        console.log('👁️ [VideoPlayer] Page hidden, saving progress');
        saveProgressImmediately(currentTime, duration, currentTime);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, currentVideoId, isPlaying, saveProgressImmediately, currentTime, duration]);

  // Handle pending progress on page load
  useEffect(() => {
    const pendingProgress = localStorage.getItem('pendingProgress');
    if (pendingProgress) {
      try {
        const progress = JSON.parse(pendingProgress);
        const savedAt = progress.savedAt;
        const now = Date.now();
        
        // Only process if saved within the last 5 minutes
        if (now - savedAt < 5 * 60 * 1000) {
          console.log('🔄 [VideoPlayer] Processing pending progress from page unload');
          saveProgressImmediately(
            progress.watchedDuration,
            progress.totalDuration,
            progress.timestamp
          );
        }
        
        // Clear pending progress
        localStorage.removeItem('pendingProgress');
      } catch (error) {
        console.error('Error processing pending progress:', error);
        localStorage.removeItem('pendingProgress');
      }
    }
  }, [saveProgressImmediately]);

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



  // Handle video selection
  const handleVideoSelect = async (newVideoId: string) => {
    console.log('🔧 [VideoPlayer] Switching to video:', newVideoId);
    
    // Check if the new video has a valid presigned URL
    const newVideo = courseData?.videos.find(v => v.id === newVideoId);
    if (newVideo && (!newVideo.videoUrl || newVideo.videoUrl === 'undefined' || isPresignedUrlExpired(newVideo.videoUrl))) {
      console.log('🔧 [VideoPlayer] New video has invalid/expired presigned URL, refreshing...');
      const freshUrl = await refreshVideoUrl(newVideoId);
      if (freshUrl) {
        // Update the course data with the fresh URL
        setCourseData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            videos: prev.videos.map(video => 
              video.id === newVideoId 
                ? { ...video, videoUrl: freshUrl }
                : video
            )
          };
        });
      }
    }
    
    setCurrentVideoId(newVideoId);
    setIsPlaying(false);
    setPlayerReady(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentVideoPosition(0);
    setCurrentVideoPercentage(0);
    // Reset error states when changing videos
    setVideoError(null);
    setRetryCount(0);
    setIsRetrying(false);
    setError(null);
    window.history.pushState(null, '', `/course/${id}/watch/${newVideoId}`);
  };



  // Note: Progress seeking, play/pause, and manual play are now handled by EnhancedVideoPlayer

  // Note: Controls visibility is now handled by EnhancedVideoPlayer

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending progress requests
      if (pendingProgressRequest.current) {
        pendingProgressRequest.current.abort();
      }
      
      // Clear timeouts
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      if (progressUpdateTimeout.current) {
        clearTimeout(progressUpdateTimeout.current);
      }
      
      // Save progress when component unmounts
      if (isPlaying) {
        console.log('🔚 [Udemy-Style] Component unmounting, saving final progress');
        
        // Use synchronous storage to ensure data is saved
        localStorage.setItem('pendingProgress', JSON.stringify({
          courseId: id,
          videoId: currentVideoId,
          watchedDuration: currentTime,
          totalDuration: duration,
          timestamp: currentTime,
          savedAt: Date.now()
        }));
      }
    };
  }, [controlsTimeout, id, currentVideoId, isPlaying]);

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

  // Proactive presigned URL refresh
  useEffect(() => {
    if (!currentVideo?.videoUrl) return;

    const checkAndRefreshUrl = async () => {
      // Check if the current presigned URL will expire soon (within 10 minutes)
      if (isPresignedUrlExpired(currentVideo.videoUrl)) {
        console.log('🔍 [VideoPlayer] Presigned URL will expire soon, refreshing proactively');
        const freshUrl = await refreshVideoUrl(currentVideoId);
        if (freshUrl) {
          // Update the course data with the fresh URL
          setCourseData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              videos: prev.videos.map(video => 
                video.id === currentVideoId 
                  ? { ...video, videoUrl: freshUrl }
                  : video
              )
            };
          });
          console.log('✅ [VideoPlayer] Proactively refreshed presigned URL');
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAndRefreshUrl, 5 * 60 * 1000);
    
    // Also check immediately
    checkAndRefreshUrl();

    return () => clearInterval(interval);
  }, [currentVideo?.videoUrl, currentVideoId]);

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
          {/* Enhanced Video Player */}
          <div className="flex-1">
            {currentVideo?.videoUrl && 
             currentVideo.videoUrl.trim() !== '' && 
             currentVideo.videoUrl !== window.location.href &&
             currentVideo.videoUrl !== 'undefined' ? (
              <EnhancedVideoPlayer
                  src={currentVideo.videoUrl}
                title={courseData?.title}
                playing={isPlaying}
                playbackRate={playbackRate}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                onEnded={handleVideoEnd}
                  onError={handleVideoError}
                onReady={() => setPlayerReady(true)}
                onTimeUpdate={(currentTime, duration) => {
                  setCurrentTime(currentTime);
                  setDuration(duration);
                  setCurrentVideoPosition(currentTime);
                      if (duration > 0) {
                    const actualPercentage = Math.round((currentTime / duration) * 100);
                    setCurrentVideoPercentage(actualPercentage);
                  }
                }}
                onProgress={(watchedDuration, totalDuration) => {
                  updateProgress(watchedDuration, totalDuration, watchedDuration);
                }}
                onPlaybackRateChange={setPlaybackRate}
                onControlsToggle={setControlsVisible}
                className="w-full h-full"
                initialTime={currentVideo?.progress?.lastPosition || 0}
                />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {videoError ? (
                  // Error state
                  <div className="space-y-4 text-center">
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
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p>Loading video...</p>
                    <p className="text-sm mt-2">
                      {!currentVideo?.videoUrl || currentVideo.videoUrl === 'undefined' 
                        ? 'Refreshing video link...' 
                        : 'This may take a few moments'
                      }
                    </p>
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
          </div>

          {/* Video Info */}
          <div className="bg-gray-800 px-4 py-4">
            <h2 className="text-white font-semibold text-lg mb-2">{currentVideo.title}</h2>
            <div className="flex items-center justify-between text-gray-400 text-sm">
              <div className="flex items-center space-x-4">
                <span>Duration: {currentVideo.duration}</span>
                <span>•</span>
                <span>Current Position: {currentVideoPercentage}%</span>
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
                  watchedPercentage={currentVideoPercentage}
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