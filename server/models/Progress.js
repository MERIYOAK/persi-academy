const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  videoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Video', 
    required: true 
  },
  
  // Video-level progress tracking
  watchedDuration: { type: Number, default: 0 }, // in seconds
  totalDuration: { type: Number, default: 0 }, // in seconds
  watchedPercentage: { type: Number, default: 0 }, // 0-100, real-time video progress
  isCompleted: { type: Boolean, default: false },
  completionPercentage: { type: Number, default: 0 }, // 0-100, for course-level tracking
  
  // Timestamps
  firstWatchedAt: { type: Date, default: Date.now },
  lastWatchedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  
  // Watch history for resume functionality
  watchHistory: [{
    timestamp: { type: Number }, // video timestamp in seconds
    watchedAt: { type: Date, default: Date.now }
  }],
  
  // Additional metadata
  watchCount: { type: Number, default: 1 },
  averageWatchTime: { type: Number, default: 0 }, // average time per session
  
}, { timestamps: true });

// Compound index for efficient queries
progressSchema.index({ userId: 1, courseId: 1, videoId: 1 }, { unique: true });
progressSchema.index({ userId: 1, courseId: 1 });
progressSchema.index({ userId: 1, isCompleted: 1 });

// Virtual for video progress percentage
progressSchema.virtual('videoProgressPercentage').get(function() {
  if (this.totalDuration === 0) return 0;
  return Math.min(100, Math.round((this.watchedDuration / this.totalDuration) * 100));
});

// Method to update video-level progress (real-time)
progressSchema.methods.updateVideoProgress = function(watchedDuration, totalDuration, timestamp = null) {
  this.watchedDuration = Math.max(this.watchedDuration, watchedDuration);
  this.totalDuration = totalDuration;
  this.lastWatchedAt = new Date();
  this.watchCount += 1;
  
  // Update video-level progress (real-time)
  this.watchedPercentage = this.videoProgressPercentage;
  
  // STICKY COMPLETION LOGIC: Once completed, maintain 100% completion
  if (this.isCompleted) {
    // If already completed, maintain 100% completion regardless of current watch progress
    this.completionPercentage = 100;
    this.watchedPercentage = 100;
    console.log(`🔒 [Progress] Video already completed, maintaining 100% completion status`);
  } else {
    // Only update completion percentage if not already completed
    this.completionPercentage = this.watchedPercentage;
    
    // Mark as completed if watched 90% or more
    if (this.completionPercentage >= 90 && !this.isCompleted) {
      this.isCompleted = true;
      this.completedAt = new Date();
      console.log(`✅ [Progress] Video marked as completed at ${this.completionPercentage}%`);
    }
  }
  
  // Add to watch history if timestamp provided
  if (timestamp !== null) {
    this.watchHistory.push({
      timestamp: Math.round(timestamp),
      watchedAt: new Date()
    });
    
    // Keep only last 10 entries to prevent bloat
    if (this.watchHistory.length > 10) {
      this.watchHistory = this.watchHistory.slice(-10);
    }
  }
  
  // Calculate average watch time
  if (this.watchHistory.length > 1) {
    const totalTime = this.watchHistory.reduce((sum, entry) => sum + entry.timestamp, 0);
    this.averageWatchTime = Math.round(totalTime / this.watchHistory.length);
  }
  
  return this.save();
};

// Method to get last watched position
progressSchema.methods.getLastPosition = function() {
  if (this.watchHistory.length === 0) return 0;
  return this.watchHistory[this.watchHistory.length - 1].timestamp;
};

// Static method to get user's course progress
progressSchema.statics.getCourseProgress = function(userId, courseId) {
  return this.find({ userId, courseId })
    .populate('videoId', 'title duration order')
    .sort({ 'videoId.order': 1 });
};

// Static method to get user's overall course progress (course-level)
progressSchema.statics.getOverallCourseProgress = async function(userId, courseId, totalVideos = null) {
  const progressEntries = await this.find({ userId, courseId });
  
  if (progressEntries.length === 0) {
    return {
      totalVideos: totalVideos || 0,
      completedVideos: 0,
      totalProgress: 0,
      lastWatchedVideo: null,
      lastWatchedPosition: 0,
      courseProgressPercentage: 0
    };
  }
  
  // Use provided totalVideos or fall back to progress entries length
  const actualTotalVideos = totalVideos || progressEntries.length;
  const completedVideos = progressEntries.filter(p => p.isCompleted).length;
  
  // Calculate course-level progress from video completion percentages
  const totalCompletionPercentage = progressEntries.reduce((sum, p) => sum + p.completionPercentage, 0);
  const courseProgressPercentage = Math.round(totalCompletionPercentage / actualTotalVideos);
  
  // Find last watched video
  const lastWatched = progressEntries
    .filter(p => p.lastWatchedAt)
    .sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt))[0];
  
  return {
    totalVideos: actualTotalVideos,
    completedVideos,
    totalProgress: courseProgressPercentage,
    lastWatchedVideo: lastWatched ? lastWatched.videoId : null,
    lastWatchedPosition: lastWatched ? lastWatched.getLastPosition() : 0,
    courseProgressPercentage
  };
};

// Static method to mark video as completed
progressSchema.statics.markVideoCompleted = function(userId, courseId, videoId) {
  console.log(`🔒 [Progress] Marking video as completed: ${videoId}`);
  return this.findOneAndUpdate(
    { userId, courseId, videoId },
    { 
      isCompleted: true,
      completionPercentage: 100,
      watchedPercentage: 100,
      completedAt: new Date(),
      lastWatchedAt: new Date()
    },
    { upsert: true, new: true }
  );
};

// Static method to reset video completion status (admin use only)
progressSchema.statics.resetVideoCompletion = function(userId, courseId, videoId) {
  console.log(`🔄 [Progress] Resetting video completion status: ${videoId}`);
  return this.findOneAndUpdate(
    { userId, courseId, videoId },
    { 
      isCompleted: false,
      completionPercentage: 0,
      watchedPercentage: 0,
      completedAt: null,
      lastWatchedAt: new Date()
    },
    { new: true }
  );
};

// Static method to get next video to watch
progressSchema.statics.getNextVideo = async function(userId, courseId, currentVideoId) {
  const Course = mongoose.model('Course');
  const course = await Course.findById(courseId).populate('videos');
  
  if (!course || !course.videos || course.videos.length === 0) {
    return null;
  }
  
  const sortedVideos = course.videos.sort((a, b) => (a.order || 0) - (b.order || 0));
  const currentIndex = sortedVideos.findIndex(v => v._id.toString() === currentVideoId);
  
  if (currentIndex === -1 || currentIndex === sortedVideos.length - 1) {
    return null; // No next video
  }
  
  return sortedVideos[currentIndex + 1];
};

// Static method to get course progress summary for dashboard
progressSchema.statics.getCourseProgressSummary = async function(userId, courseId, totalVideos = null) {
  const progressEntries = await this.find({ userId, courseId });
  
  if (progressEntries.length === 0) {
    return {
      totalVideos: totalVideos || 0,
      completedVideos: 0,
      courseProgressPercentage: 0,
      lastWatchedAt: null
    };
  }
  
  // Use provided totalVideos or fall back to progress entries length
  const actualTotalVideos = totalVideos || progressEntries.length;
  const completedVideos = progressEntries.filter(p => p.isCompleted).length;
  const totalCompletionPercentage = progressEntries.reduce((sum, p) => sum + p.completionPercentage, 0);
  const courseProgressPercentage = Math.round(totalCompletionPercentage / actualTotalVideos);
  
  const lastWatched = progressEntries
    .filter(p => p.lastWatchedAt)
    .sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt))[0];
  
  return {
    totalVideos: actualTotalVideos,
    completedVideos,
    courseProgressPercentage,
    lastWatchedAt: lastWatched ? lastWatched.lastWatchedAt : null
  };
};

module.exports = mongoose.model('Progress', progressSchema); 