const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const auth = require('../middleware/authMiddleware');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const multer = require('multer');

// Configure multer for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 500MB.'
      });
    }
  }
  if (error.message.includes('Only video files')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next(error);
};

// Apply error handling middleware
router.use(handleMulterError);

// ========================================
// ADMIN ROUTES (Require admin authentication)
// ========================================

/**
 * Upload video for a course version
 * POST /api/videos/upload
 * Body: { courseId, version, title, order, file }
 */
router.post('/upload', auth, adminAuthMiddleware, upload.single('file'), videoController.uploadVideo);

/**
 * Update video (preserve old video in S3)
 * PUT /api/videos/:videoId
 * Body: { title, duration, order, file? }
 */
router.put('/:videoId', auth, adminAuthMiddleware, upload.single('file'), videoController.updateVideo);

/**
 * Archive video (soft delete)
 * DELETE /api/videos/:videoId
 */
router.delete('/:videoId', auth, adminAuthMiddleware, videoController.deleteVideo);

/**
 * Restore archived video
 * POST /api/videos/:videoId/restore
 */
router.post('/:videoId/restore', auth, adminAuthMiddleware, videoController.restoreVideo);

/**
 * Get video by ID with signed URL
 * GET /api/videos/:videoId
 */
router.get('/:videoId', auth, videoController.getVideoById);

/**
 * Get videos for a specific course version
 * GET /api/videos/course/:courseId/version/:version
 */
router.get('/course/:courseId/version/:version', auth, videoController.getVideosByCourseVersion);

/**
 * Get video statistics for a course
 * GET /api/videos/statistics/:courseId
 */
router.get('/statistics/:courseId', auth, adminAuthMiddleware, videoController.getVideoStatistics);

// ========================================
// USER ROUTES (Require user authentication)
// ========================================

/**
 * Stream video (for enrolled students)
 * GET /api/videos/:videoId/stream
 */
router.get('/:videoId/stream', auth, videoController.streamVideo);

// ========================================
// ADMIN-ONLY VIDEO MANAGEMENT ROUTES
// ========================================

/**
 * Get all videos by status (admin only)
 * GET /api/videos/admin/status/:status
 */
router.get('/admin/status/:status', auth, adminAuthMiddleware, async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const Video = require('../models/Video');
    const videos = await Video.find({ status })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Video.countDocuments({ status });

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('❌ Get videos by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos',
      error: error.message
    });
  }
});

/**
 * Get processing videos (admin only)
 * GET /api/videos/admin/processing
 */
router.get('/admin/processing', auth, adminAuthMiddleware, async (req, res) => {
  try {
    const Video = require('../models/Video');
    const videos = await Video.find({ 
      processingStatus: { $in: ['pending', 'processing'] } 
    }).populate('courseId', 'title');

    res.json({
      success: true,
      data: {
        videos,
        count: videos.length
      }
    });
  } catch (error) {
    console.error('❌ Get processing videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch processing videos',
      error: error.message
    });
  }
});

/**
 * Bulk archive videos (admin only)
 * POST /api/videos/admin/bulk-archive
 * Body: { videoIds: [] }
 */
router.post('/admin/bulk-archive', auth, adminAuthMiddleware, async (req, res) => {
  try {
    const { videoIds } = req.body;
    const adminEmail = req.admin?.email || 'admin';

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Video IDs array is required'
      });
    }

    const Video = require('../models/Video');
    const results = [];

    for (const videoId of videoIds) {
      try {
        const video = await Video.findById(videoId);
        if (video) {
          await video.archive();
          results.push({
            videoId,
            success: true,
            title: video.title
          });
        } else {
          results.push({
            videoId,
            success: false,
            error: 'Video not found'
          });
        }
      } catch (error) {
        results.push({
          videoId,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Bulk archive videos completed: ${successful} successful, ${failed} failed by ${adminEmail}`);

    res.json({
      success: true,
      message: `Bulk archive completed: ${successful} successful, ${failed} failed`,
      data: {
        results,
        summary: {
          total: videoIds.length,
          successful,
          failed
        }
      }
    });

  } catch (error) {
    console.error('❌ Bulk archive videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk archive videos',
      error: error.message
    });
  }
});

/**
 * Get video statistics (admin only)
 * GET /api/videos/admin/statistics
 */
router.get('/admin/statistics', auth, adminAuthMiddleware, async (req, res) => {
  try {
    const Video = require('../models/Video');

    const [
      totalVideos,
      activeVideos,
      processingVideos,
      archivedVideos,
      totalFileSize,
      totalDuration
    ] = await Promise.all([
      Video.countDocuments(),
      Video.countDocuments({ status: 'active' }),
      Video.countDocuments({ processingStatus: { $in: ['pending', 'processing'] } }),
      Video.countDocuments({ status: 'archived' }),
      Video.aggregate([
        { $group: { _id: null, total: { $sum: '$fileSize' } } }
      ]),
      Video.aggregate([
        { $match: { duration: { $exists: true, $ne: null } } },
        { $group: { _id: null, total: { $sum: { $toInt: '$duration' } } } }
      ])
    ]);

    const fileSizeTotal = totalFileSize[0]?.total || 0;
    const durationTotalSeconds = totalDuration[0]?.total || 0;

    res.json({
      success: true,
      data: {
        videos: {
          total: totalVideos,
          active: activeVideos,
          processing: processingVideos,
          archived: archivedVideos
        },
        storage: {
          totalFileSize: fileSizeTotal,
          totalFileSizeGB: (fileSizeTotal / (1024 * 1024 * 1024)).toFixed(2)
        },
        duration: {
          totalSeconds: durationTotalSeconds,
          totalHours: (durationTotalSeconds / 3600).toFixed(2)
        },
        averageFileSize: totalVideos > 0 ? (fileSizeTotal / totalVideos).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('❌ Get video statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video statistics',
      error: error.message
    });
  }
});

// Test endpoint to set video durations
router.post('/test-durations', async (req, res) => {
  try {
    const Video = require('../models/Video');
    const videos = await Video.find({});
    
    if (videos.length === 0) {
      return res.json({
        success: true,
        message: 'No videos found in database'
      });
    }
    
    // Test durations in seconds
    const testDurations = [
      330,   // 5:30 (5 * 60 + 30)
      765,   // 12:45 (12 * 60 + 45)
      495,   // 8:15 (8 * 60 + 15)
      920,   // 15:20 (15 * 60 + 20)
      225,   // 3:45 (3 * 60 + 45)
      1330,  // 22:10 (22 * 60 + 10)
      450,   // 7:30 (7 * 60 + 30)
      1135,  // 18:55 (18 * 60 + 55)
      260,   // 4:20 (4 * 60 + 20)
      1515   // 25:15 (25 * 60 + 15)
    ];
    
    let updatedCount = 0;
    
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const testDuration = testDurations[i % testDurations.length];
      
      video.duration = testDuration; // Store as seconds
      await video.save();
      updatedCount++;
    }
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} videos with test durations (in seconds)`,
      updatedCount
    });
    
  } catch (error) {
    console.error('Test durations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set test durations',
      error: error.message
    });
  }
});

module.exports = router; 