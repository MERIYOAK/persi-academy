import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { ChevronLeft, BookOpen, Clock, CheckCircle } from 'lucide-react';
import VideoPlaylist from '../components/VideoPlaylist';

interface Video {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  completed?: boolean;
  locked?: boolean;
}

interface CourseData {
  title: string;
  videos: Video[];
}

const VideoPlayerPage = () => {
  const { id, videoId } = useParams<{ id: string; videoId: string }>();
  const [currentVideoId, setCurrentVideoId] = useState(videoId || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course and video data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        console.log('Fetching course data for course ID:', id);
        
        // Fetch course details
        const courseResponse = await fetch(`http://localhost:5000/api/courses/${id}`);
        if (!courseResponse.ok) {
          throw new Error('Failed to fetch course data');
        }
        
        const courseResult = await courseResponse.json();
        console.log('Course data received:', courseResult);
        
        const course = courseResult.data.course;
        const videos = course.videos || course.currentVersion?.videos || [];
        
        // Fetch video details for each video ID
        const videoPromises = videos.map(async (videoId: string) => {
          try {
            const videoResponse = await fetch(`http://localhost:5000/api/videos/${videoId}`);
            if (videoResponse.ok) {
              const videoResult = await videoResponse.json();
              return {
                id: videoResult.data.video.id,
                title: videoResult.data.video.title,
                duration: videoResult.data.video.duration || '00:00',
                videoUrl: videoResult.data.video.videoUrl,
                completed: false,
                locked: false
              };
            } else {
              console.error(`Failed to fetch video ${videoId}:`, videoResponse.status);
              return {
                id: videoId,
                title: `Video ${videoId}`,
                duration: '00:00',
                videoUrl: '',
                completed: false,
                locked: true
              };
            }
          } catch (error) {
            console.error(`Error fetching video ${videoId}:`, error);
            return {
              id: videoId,
              title: `Video ${videoId}`,
              duration: '00:00',
              videoUrl: '',
              completed: false,
              locked: true
            };
          }
        });
        
        const videoDetails = await Promise.all(videoPromises);
        
        setCourseData({
          title: course.title,
          videos: videoDetails
        });
        
        // Set current video if not already set
        if (!currentVideoId && videoDetails.length > 0) {
          setCurrentVideoId(videoDetails[0].id);
        }
        
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseData();
    }
  }, [id]);

  useEffect(() => {
    if (videoId) {
      setCurrentVideoId(videoId);
    }
  }, [videoId]);

  const currentVideo = courseData?.videos.find(v => v.id === currentVideoId);

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
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Video not found</h2>
          <p className="text-gray-400 mb-6">{error || 'The video you are looking for does not exist.'}</p>
          <Link
            to="/courses"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const handleVideoSelect = (newVideoId: string) => {
    setCurrentVideoId(newVideoId);
    window.history.pushState(null, '', `/course/${id}/watch/${newVideoId}`);
  };

  const handleVideoEnd = () => {
    // Mark current video as completed and move to next video
    const currentIndex = courseData.videos.findIndex(v => v.id === currentVideoId);
    const nextVideo = courseData.videos[currentIndex + 1];
    if (nextVideo && !nextVideo.locked) {
      handleVideoSelect(nextVideo.id);
    }
  };

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
          <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
            <ReactPlayer
              url={currentVideo.videoUrl}
              width="100%"
              height="100%"
              playing={isPlaying}
              playbackRate={playbackRate}
              controls={true}
              onEnded={handleVideoEnd}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              config={{
                youtube: {
                  playerVars: {
                    showinfo: 1,
                    origin: window.location.origin
                  }
                }
              }}
            />
          </div>

          {/* Video Info */}
          <div className="bg-gray-800 text-white p-6 flex-1">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold mb-2">{currentVideo.title}</h2>
                  <div className="flex items-center space-x-4 text-gray-300">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{currentVideo.duration}</span>
                    </div>
                    {currentVideo.completed && (
                      <div className="flex items-center space-x-1 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center space-x-4">
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                    className="bg-gray-700 text-white rounded px-3 py-1 border border-gray-600 focus:outline-none focus:border-red-500"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>Normal</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    const currentIndex = courseData.videos.findIndex(v => v.id === currentVideoId);
                    const prevVideo = courseData.videos[currentIndex - 1];
                    if (prevVideo) handleVideoSelect(prevVideo.id);
                  }}
                  disabled={courseData.videos.findIndex(v => v.id === currentVideoId) === 0}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Previous Lesson
                </button>
                <button
                  onClick={() => {
                    const currentIndex = courseData.videos.findIndex(v => v.id === currentVideoId);
                    const nextVideo = courseData.videos[currentIndex + 1];
                    if (nextVideo && !nextVideo.locked) handleVideoSelect(nextVideo.id);
                  }}
                  disabled={
                    (() => {
                      const currentIndex = courseData.videos.findIndex(v => v.id === currentVideoId);
                      const nextVideo = courseData.videos[currentIndex + 1];
                      return !nextVideo || nextVideo.locked;
                    })()
                  }
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Next Lesson
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
        <div className={`bg-white border-l border-gray-200 transition-all duration-300 ${
          showPlaylist ? 'w-80' : 'w-0'
        } ${showPlaylist ? 'block' : 'hidden md:block'} md:w-80`}>
          {showPlaylist && (
            <VideoPlaylist
              videos={courseData.videos}
              currentVideoId={currentVideoId}
              onVideoSelect={handleVideoSelect}
              courseTitle={courseData.title}
            />
          )}
        </div>
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