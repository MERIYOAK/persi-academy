const User = require('../models/User');
const Course = require('../models/Course');

/**
 * Check if a user has purchased a specific course
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Promise<boolean>} - True if user has purchased the course
 */
async function userHasPurchased(userId, courseId) {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    
    return user.purchasedCourses && user.purchasedCourses.includes(courseId);
  } catch (error) {
    console.error('Error checking user purchase status:', error);
    return false;
  }
}

/**
 * Filter videos based on user purchase status and free preview settings
 * @param {Array} videos - Array of video objects
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<Array>} - Filtered videos with access information
 */
async function filterVideosByAccess(videos, userId, courseId, isAdmin = false) {
  try {
    // Admins have access to all videos
    if (isAdmin) {
      return videos.map(video => ({
        ...video.toObject(),
        hasAccess: true,
        isLocked: false,
        lockReason: null
      }));
    }

    // Check if user has purchased the course
    const hasPurchased = await userHasPurchased(userId, courseId);
    
    return videos.map(video => {
      const videoObj = video.toObject();
      
      if (hasPurchased) {
        // User has purchased - full access to all videos
        return {
          ...videoObj,
          hasAccess: true,
          isLocked: false,
          lockReason: null
        };
      } else {
        // User hasn't purchased - only access to free preview videos
        const isFreePreview = video.isFreePreview === true;
        return {
          ...videoObj,
          hasAccess: isFreePreview,
          isLocked: !isFreePreview,
          lockReason: isFreePreview ? null : 'purchase_required'
        };
      }
    });
  } catch (error) {
    console.error('Error filtering videos by access:', error);
    // Return all videos as locked in case of error
    return videos.map(video => ({
      ...video.toObject(),
      hasAccess: false,
      isLocked: true,
      lockReason: 'error'
    }));
  }
}

/**
 * Get videos for a course with access control
 * @param {string} courseId - Course ID
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Whether the user is an admin
 * @param {number} version - Course version (optional)
 * @returns {Promise<Array>} - Videos with access information
 */
async function getVideosWithAccess(courseId, userId, isAdmin = false, version = null) {
  try {
    const Video = require('../models/Video');
    
    let videos;
    if (version) {
      videos = await Video.getByCourseVersion(courseId, version);
    } else {
      videos = await Video.getActiveVideos(courseId);
    }
    
    return await filterVideosByAccess(videos, userId, courseId, isAdmin);
  } catch (error) {
    console.error('Error getting videos with access:', error);
    throw error;
  }
}

/**
 * Check if a specific video is accessible to a user
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<Object>} - Access information
 */
async function checkVideoAccess(videoId, userId, isAdmin = false) {
  try {
    const Video = require('../models/Video');
    const video = await Video.findById(videoId);
    
    if (!video) {
      return {
        hasAccess: false,
        isLocked: true,
        lockReason: 'video_not_found'
      };
    }
    
    if (isAdmin) {
      return {
        hasAccess: true,
        isLocked: false,
        lockReason: null
      };
    }
    
    const hasPurchased = await userHasPurchased(userId, video.courseId);
    
    if (hasPurchased) {
      return {
        hasAccess: true,
        isLocked: false,
        lockReason: null
      };
    }
    
    const isFreePreview = video.isFreePreview === true;
    return {
      hasAccess: isFreePreview,
      isLocked: !isFreePreview,
      lockReason: isFreePreview ? null : 'purchase_required'
    };
  } catch (error) {
    console.error('Error checking video access:', error);
    return {
      hasAccess: false,
      isLocked: true,
      lockReason: 'error'
    };
  }
}

module.exports = {
  userHasPurchased,
  filterVideosByAccess,
  getVideosWithAccess,
  checkVideoAccess
};
