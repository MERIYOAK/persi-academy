const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');

/**
 * Update video progress (real-time video-level tracking)
 * POST /api/progress/update
 */
exports.updateProgress = async (req, res) => {
  try {
    const { courseId, videoId, watchedDuration, totalDuration, timestamp } = req.body;
    
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const userId = req.user.userId || req.user._id;

    console.log(`🔧 Updating video progress for user ${userId}`);
    console.log(`   - Course ID: ${courseId}`);
    console.log(`   - Video ID: ${videoId}`);
    console.log(`   - Watched: ${watchedDuration}s / ${totalDuration}s`);
    console.log(`   - Timestamp: ${timestamp}s`);

    // Validate required fields
    if (!courseId || !videoId || watchedDuration === undefined || totalDuration === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: courseId, videoId, watchedDuration, totalDuration'
      });
    }

    // Check if user has purchased the course
    const user = await User.findById(userId);
    if (!user || !user.purchasedCourses || !user.purchasedCourses.includes(courseId)) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase this course to track progress'
      });
    }

    // Find or create progress entry
    let progress = await Progress.findOne({ userId, courseId, videoId });
    
    if (!progress) {
      progress = new Progress({
        userId,
        courseId,
        videoId,
        totalDuration
      });
    }

    // Update video-level progress (real-time)
    await progress.updateVideoProgress(watchedDuration, totalDuration, timestamp);

    // Get course to get total videos count
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get updated course progress with correct total videos count
    const courseProgress = await Progress.getOverallCourseProgress(userId, courseId, course.videos.length);

    console.log(`✅ Video progress updated successfully`);
    console.log(`   - Video watched percentage: ${progress.watchedPercentage}%`);
    console.log(`   - Video completion percentage: ${progress.completionPercentage}%`);
    console.log(`   - Course progress: ${courseProgress.courseProgressPercentage}%`);

    res.json({
      success: true,
      data: {
        videoProgress: {
          watchedDuration: progress.watchedDuration,
          totalDuration: progress.totalDuration,
          watchedPercentage: progress.watchedPercentage,
          completionPercentage: progress.completionPercentage,
          isCompleted: progress.isCompleted,
          lastPosition: progress.getLastPosition()
        },
        courseProgress: courseProgress
      }
    });

  } catch (error) {
    console.error('❌ Error updating video progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video progress',
      error: error.message
    });
  }
};

/**
 * Get course progress
 * GET /api/progress/course/:courseId
 */
exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const userId = req.user.userId || req.user._id;

    console.log(`🔧 Getting course progress for user ${userId}`);
    console.log(`   - Course ID: ${courseId}`);

    // Check if user has purchased the course
    const user = await User.findById(userId);
    if (!user || !user.purchasedCourses || !user.purchasedCourses.includes(courseId)) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase this course to view progress'
      });
    }

    // Get course with videos
    const course = await Course.findById(courseId).populate('videos');
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get progress for all videos
    const progressEntries = await Progress.getCourseProgress(userId, courseId);
    
    // Create a map of video progress
    const progressMap = {};
    progressEntries.forEach(entry => {
      progressMap[entry.videoId._id.toString()] = {
        watchedDuration: entry.watchedDuration,
        totalDuration: entry.totalDuration,
        completionPercentage: entry.completionPercentage,
        isCompleted: entry.isCompleted,
        lastPosition: entry.getLastPosition(),
        lastWatchedAt: entry.lastWatchedAt
      };
    });

    // Get overall course progress with correct total videos count
    const overallProgress = await Progress.getOverallCourseProgress(userId, courseId, course.videos.length);

    // Prepare video list with progress and URLs
    const videosWithProgress = await Promise.all(course.videos.map(async (video) => {
      // Get signed URL for the video
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
      
      let videoUrl = '';
      try {
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
          }
        });

        // Determine content type based on file extension
        const getContentType = (key) => {
          const extension = key.split('.').pop()?.toLowerCase();
          switch (extension) {
            case 'mp4':
              return 'video/mp4';
            case 'webm':
              return 'video/webm';
            case 'ogg':
              return 'video/ogg';
            case 'mov':
              return 'video/quicktime';
            case 'avi':
              return 'video/x-msvideo';
            default:
              return 'video/mp4'; // Default fallback
          }
        };

        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: video.s3Key,
          ResponseContentType: getContentType(video.s3Key),
          ResponseContentDisposition: 'inline',
          ResponseCacheControl: 'public, max-age=3600'
        });

        videoUrl = await getSignedUrl(s3Client, command, { expiresIn: 1800 }); // 30 minutes expiry for better performance
        
        console.log(`🔧 [S3] Generated signed URL for video: ${video.title}`);
        console.log(`   - Content Type: ${getContentType(video.s3Key)}`);
        console.log(`   - S3 Key: ${video.s3Key}`);
      } catch (error) {
        console.error('❌ Error generating signed URL for video:', video._id, error);
        // Fallback to public URL if available
        videoUrl = video.publicUrl || '';
      }

      return {
        _id: video._id,
        title: video.title,
        duration: video.duration,
        order: video.order,
        videoUrl: videoUrl,
        progress: progressMap[video._id.toString()] || {
          watchedDuration: 0,
          totalDuration: video.duration || 0,
          completionPercentage: 0,
          isCompleted: false,
          lastPosition: 0,
          lastWatchedAt: null
        }
      };
    }));

    // Sort videos by order
    videosWithProgress.sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log(`✅ Course progress retrieved successfully`);
    console.log(`   - Total videos: ${videosWithProgress.length}`);
    console.log(`   - Completed videos: ${overallProgress.completedVideos}`);
    console.log(`   - Overall progress: ${overallProgress.totalProgress}%`);

    // Add caching headers
    res.set('Cache-Control', 'private, max-age=300'); // Cache for 5 minutes
    res.set('ETag', `course-${courseId}-${Date.now()}`);

    res.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          totalVideos: videosWithProgress.length
        },
        videos: videosWithProgress,
        overallProgress: overallProgress
      }
    });

  } catch (error) {
    console.error('❌ Error getting course progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course progress',
      error: error.message
    });
  }
};

/**
 * Get user's dashboard progress (all courses)
 * GET /api/progress/dashboard
 */
exports.getDashboardProgress = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const userId = req.user.userId || req.user._id;

    console.log(`🔧 Getting dashboard progress for user ${userId}`);

    // Get user with purchased courses
    const user = await User.findById(userId).populate({
      path: 'purchasedCourses',
      populate: {
        path: 'videos',
        select: 'title duration order'
      }
    });
    if (!user || !user.purchasedCourses || user.purchasedCourses.length === 0) {
      return res.json({
        success: true,
        data: {
          courses: [],
          totalCourses: 0,
          completedCourses: 0,
          totalProgress: 0
        }
      });
    }

    // Get progress for all purchased courses
    const coursesWithProgress = await Promise.all(
      user.purchasedCourses.map(async (course) => {
        const courseProgressSummary = await Progress.getCourseProgressSummary(userId, course._id, course.videos ? course.videos.length : 0);
        
        return {
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnailURL,
          duration: course.videos ? `${course.videos.length} lessons` : '0 lessons',
          totalLessons: course.videos ? course.videos.length : 0,
          completedLessons: courseProgressSummary.completedVideos,
          progress: courseProgressSummary.courseProgressPercentage,
          lastWatched: courseProgressSummary.lastWatchedAt,
          videos: course.videos || [],
          isCompleted: courseProgressSummary.courseProgressPercentage >= 90
        };
      })
    );

    // Calculate overall statistics
    const totalCourses = coursesWithProgress.length;
    const completedCourses = coursesWithProgress.filter(c => c.isCompleted).length;
    const totalProgress = totalCourses > 0 
      ? Math.round(coursesWithProgress.reduce((sum, c) => sum + c.progress, 0) / totalCourses)
      : 0;

    console.log(`✅ Dashboard progress retrieved successfully`);
    console.log(`   - Total courses: ${totalCourses}`);
    console.log(`   - Completed courses: ${completedCourses}`);
    console.log(`   - Average progress: ${totalProgress}%`);

    res.json({
      success: true,
      data: {
        courses: coursesWithProgress,
        totalCourses,
        completedCourses,
        totalProgress
      }
    });

  } catch (error) {
    console.error('❌ Error getting dashboard progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard progress',
      error: error.message
    });
  }
};

/**
 * Mark video as completed
 * POST /api/progress/complete-video
 */
exports.completeVideo = async (req, res) => {
  try {
    const { courseId, videoId } = req.body;
    
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const userId = req.user.userId || req.user._id;

    console.log(`🔧 Marking video as completed`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Course ID: ${courseId}`);
    console.log(`   - Video ID: ${videoId}`);

    // Validate required fields
    if (!courseId || !videoId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: courseId, videoId'
      });
    }

    // Check if user has purchased the course
    const user = await User.findById(userId);
    if (!user || !user.purchasedCourses || !user.purchasedCourses.includes(courseId)) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase this course to mark videos as completed'
      });
    }

    // Get course to get total videos count
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Mark video as completed
    const progress = await Progress.markVideoCompleted(userId, courseId, videoId);

    // Get updated course progress with correct total videos count
    const courseProgress = await Progress.getOverallCourseProgress(userId, courseId, course.videos.length);

    console.log(`✅ Video marked as completed successfully`);

    res.json({
      success: true,
      data: {
        videoProgress: {
          isCompleted: progress.isCompleted,
          completionPercentage: progress.completionPercentage,
          completedAt: progress.completedAt
        },
        courseProgress: courseProgress
      }
    });

  } catch (error) {
    console.error('❌ Error completing video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete video',
      error: error.message
    });
  }
};

/**
 * Get next video to watch
 * GET /api/progress/next-video/:courseId/:currentVideoId
 */
exports.getNextVideo = async (req, res) => {
  try {
    const { courseId, currentVideoId } = req.params;
    
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const userId = req.user.userId || req.user._id;

    console.log(`🔧 Getting next video for user ${userId}`);
    console.log(`   - Course ID: ${courseId}`);
    console.log(`   - Current Video ID: ${currentVideoId}`);

    // Check if user has purchased the course
    const user = await User.findById(userId);
    if (!user || !user.purchasedCourses || !user.purchasedCourses.includes(courseId)) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase this course to access videos'
      });
    }

    // Get next video
    const nextVideo = await Progress.getNextVideo(userId, courseId, currentVideoId);

    if (!nextVideo) {
      return res.json({
        success: true,
        data: {
          nextVideo: null,
          message: 'This is the last video in the course'
        }
      });
    }

    console.log(`✅ Next video found: ${nextVideo.title}`);

    res.json({
      success: true,
      data: {
        nextVideo: {
          _id: nextVideo._id,
          title: nextVideo.title,
          duration: nextVideo.duration,
          order: nextVideo.order
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting next video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next video',
      error: error.message
    });
  }
};

/**
 * Get resume position for a video
 * GET /api/progress/resume/:courseId/:videoId
 */
exports.getResumePosition = async (req, res) => {
  try {
    const { courseId, videoId } = req.params;
    
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const userId = req.user.userId || req.user._id;

    console.log(`🔧 Getting resume position for user ${userId}`);
    console.log(`   - Course ID: ${courseId}`);
    console.log(`   - Video ID: ${videoId}`);

    // Check if user has purchased the course
    const user = await User.findById(userId);
    if (!user || !user.purchasedCourses || !user.purchasedCourses.includes(courseId)) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase this course to resume videos'
      });
    }

    // Get progress for this video
    const progress = await Progress.findOne({ userId, courseId, videoId });
    
    if (!progress) {
      return res.json({
        success: true,
        data: {
          resumePosition: 0,
          isCompleted: false,
          completionPercentage: 0
        }
      });
    }

    const resumePosition = progress.getLastPosition();

    console.log(`✅ Resume position found: ${resumePosition}s`);

    res.json({
      success: true,
      data: {
        resumePosition,
        isCompleted: progress.isCompleted,
        completionPercentage: progress.completionPercentage,
        lastWatchedAt: progress.lastWatchedAt
      }
    });

  } catch (error) {
    console.error('❌ Error getting resume position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resume position',
      error: error.message
    });
  }
}; 

/**
 * Get video-level progress for a specific video
 * GET /api/progress/video/:courseId/:videoId
 */
exports.getVideoProgress = async (req, res) => {
  try {
    const { courseId, videoId } = req.params;
    
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const userId = req.user.userId || req.user._id;

    console.log(`🔧 Getting video progress for user ${userId}`);
    console.log(`   - Course ID: ${courseId}`);
    console.log(`   - Video ID: ${videoId}`);

    // Check if user has purchased the course
    const user = await User.findById(userId);
    if (!user || !user.purchasedCourses || !user.purchasedCourses.includes(courseId)) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase this course to view progress'
      });
    }

    // Get video progress
    const progress = await Progress.findOne({ userId, courseId, videoId });
    
    if (!progress) {
      return res.json({
        success: true,
        data: {
          videoProgress: {
            watchedDuration: 0,
            totalDuration: 0,
            watchedPercentage: 0,
            completionPercentage: 0,
            isCompleted: false,
            lastPosition: 0
          }
        }
      });
    }

    console.log(`✅ Video progress retrieved successfully`);
    console.log(`   - Video watched percentage: ${progress.watchedPercentage}%`);
    console.log(`   - Video completion percentage: ${progress.completionPercentage}%`);

    res.json({
      success: true,
      data: {
        videoProgress: {
          watchedDuration: progress.watchedDuration,
          totalDuration: progress.totalDuration,
          watchedPercentage: progress.watchedPercentage,
          completionPercentage: progress.completionPercentage,
          isCompleted: progress.isCompleted,
          lastPosition: progress.getLastPosition()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting video progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video progress',
      error: error.message
    });
  }
};

/**
 * Reset video completion status (admin use only)
 * POST /api/progress/reset-completion
 */
exports.resetVideoCompletion = async (req, res) => {
  try {
    const { courseId, videoId, userId: targetUserId } = req.body;
    
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const adminUserId = req.user.userId || req.user._id;

    console.log(`🔧 Admin resetting video completion`);
    console.log(`   - Admin User ID: ${adminUserId}`);
    console.log(`   - Target User ID: ${targetUserId}`);
    console.log(`   - Course ID: ${courseId}`);
    console.log(`   - Video ID: ${videoId}`);

    // Validate required fields
    if (!courseId || !videoId || !targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: courseId, videoId, userId'
      });
    }

    // Check if admin user has admin privileges (you can add your admin check logic here)
    // For now, we'll allow any authenticated user to reset completion
    // In production, you should add proper admin role checking

    // Reset video completion
    const progress = await Progress.resetVideoCompletion(targetUserId, courseId, videoId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Video progress not found'
      });
    }

    console.log(`✅ Video completion reset successfully`);

    res.json({
      success: true,
      data: {
        message: 'Video completion status reset successfully',
        videoProgress: {
          watchedDuration: progress.watchedDuration,
          totalDuration: progress.totalDuration,
          watchedPercentage: progress.watchedPercentage,
          completionPercentage: progress.completionPercentage,
          isCompleted: progress.isCompleted
        }
      }
    });

  } catch (error) {
    console.error('❌ Error resetting video completion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset video completion',
      error: error.message
    });
  }
}; 