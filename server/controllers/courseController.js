const Course = require('../models/Course');
const Video = require('../models/Video');
const { uploadToS3, deleteFromS3, uploadFileWithOrganization, deleteFileFromS3, getPublicUrl } = require('../utils/s3');
const { getThumbnailPublicUrl } = require('../utils/s3Enhanced');

// Helper function to ensure thumbnail is publicly accessible
const ensureThumbnailPublic = async (course) => {
  console.log(`\n🔧 [LEGACY] ensureThumbnailPublic called for course: "${course.title}"`);
  console.log(`   - Input thumbnailURL: ${course.thumbnailURL || 'NULL'}`);
  
  if (!course.thumbnailURL) {
    console.log(`   ❌ No thumbnail URL found, returning course as-is`);
    return course;
  }
  
  // If the thumbnail URL doesn't look like a public S3 URL, try to fix it
  if (!course.thumbnailURL.includes('s3.amazonaws.com')) {
    console.log(`   🔄 Attempting to generate public URL for: ${course.thumbnailURL}`);
    const publicUrl = getThumbnailPublicUrl(course.thumbnailURL);
    console.log(`   📝 Generated public URL: ${publicUrl}`);
    
    if (publicUrl) {
      console.log(`   💾 Updating course thumbnail URL in database...`);
      course.thumbnailURL = publicUrl;
      await course.save();
      console.log(`   ✅ Successfully updated thumbnail URL to: ${publicUrl}`);
    } else {
      console.log(`   ⚠️  Could not generate public URL`);
    }
  } else {
    console.log(`   ✅ Already a public S3 URL: ${course.thumbnailURL}`);
  }
  
  console.log(`   🏁 Final thumbnailURL: ${course.thumbnailURL || 'NULL'}`);
  return course;
};

exports.getCourses = async (req, res) => {
  try {
    console.log('🔍 [LEGACY] getCourses called');
    
    const courses = await Course.find().populate('videos');
    console.log(`📚 [LEGACY] Found ${courses.length} courses from database`);
    
    // Debug: Log each course's thumbnail before processing
    courses.forEach((course, index) => {
      console.log(`📸 [LEGACY] Course ${index + 1}: "${course.title}"`);
      console.log(`   - Original thumbnailURL: ${course.thumbnailURL || 'NULL'}`);
      console.log(`   - Course ID: ${course._id}`);
    });
    
    // Ensure all thumbnails are publicly accessible
    console.log('🔧 [LEGACY] Processing thumbnails for public access...');
    const coursesWithPublicThumbnails = await Promise.all(
      courses.map(async (course, index) => {
        console.log(`\n🔄 [LEGACY] Processing course ${index + 1}: "${course.title}"`);
        const processedCourse = await ensureThumbnailPublic(course);
        console.log(`   ✅ [LEGACY] Processed thumbnailURL: ${processedCourse.thumbnailURL || 'NULL'}`);
        return processedCourse;
      })
    );

    console.log('\n📋 [LEGACY] Final course thumbnails:');
    coursesWithPublicThumbnails.forEach((course, index) => {
      console.log(`   ${index + 1}. "${course.title}": ${course.thumbnailURL || 'NULL'}`);
    });
    
    res.json(coursesWithPublicThumbnails);
  } catch (error) {
    console.error('❌ [LEGACY] Get courses error:', error);
    res.status(500).json({ message: 'Failed to fetch courses', error: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('videos');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // Ensure thumbnail is publicly accessible
    await ensureThumbnailPublic(course);
    
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Failed to fetch course', error: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { title, description, thumbnailURL, price, videos } = req.body;
    const course = await Course.create({ title, description, thumbnailURL, price, videos });
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: 'Create failed', error: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    // Optionally delete related videos
    await Video.deleteMany({ courseId: course._id });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Delete failed', error: err.message });
  }
};

exports.uploadThumbnail = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    // Get course details for folder organization
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // Upload with organized structure
    const uploadResult = await uploadFileWithOrganization(req.file, 'thumbnail', {
      courseName: course.title
    });
    
    const publicUrl = getPublicUrl(uploadResult.s3Key);
    const updatedCourse = await Course.findByIdAndUpdate(courseId, { thumbnailURL: publicUrl }, { new: true });
    
    res.status(201).json({ thumbnailURL: publicUrl, course: updatedCourse });
  } catch (err) {
    console.error('Thumbnail upload failed:', err?.message || err);
    res.status(500).json({ message: 'Thumbnail upload failed', error: err.message });
  }
};

exports.deleteThumbnail = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course || !course.thumbnailURL) return res.status(404).json({ message: 'Thumbnail not found' });
    
    // Extract S3 key from public URL
    const s3Key = course.thumbnailURL.split('.amazonaws.com/')[1];
    await deleteFileFromS3(s3Key);
    
    course.thumbnailURL = '';
    await course.save();
    res.json({ message: 'Thumbnail deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Thumbnail delete failed', error: err.message });
  }
};

exports.updateThumbnail = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    // Store the old thumbnail URL for potential future use
    const oldThumbnailURL = course.thumbnailURL;
    const oldS3Key = oldThumbnailURL ? oldThumbnailURL.split('.amazonaws.com/')[1] : null;
    
    console.log(`🔄 Updating thumbnail for course: ${course.title}`);
    if (oldS3Key) {
      console.log(`📁 Preserving old thumbnail in S3: ${oldS3Key}`);
      // Note: We're keeping the old thumbnail in S3 for potential future use
      // No deletion needed - the admin might want to revert or reuse it
    }
    
    // Upload new thumbnail with organized structure
    const uploadResult = await uploadFileWithOrganization(req.file, 'thumbnail', {
      courseName: course.title
    });
    
    const publicUrl = getPublicUrl(uploadResult.s3Key);
    course.thumbnailURL = publicUrl;
    await course.save();
    
    console.log(`✅ Thumbnail updated successfully`);
    console.log(`   - New thumbnail: ${publicUrl}`);
    console.log(`   - Old thumbnail preserved: ${oldS3Key || 'None'}`);
    
    res.json({ 
      thumbnailURL: publicUrl, 
      course,
      oldThumbnailURL: oldThumbnailURL // Return old URL for potential future use
    });
  } catch (err) {
    console.error('Thumbnail update failed:', err?.message || err);
    res.status(500).json({ message: 'Thumbnail update failed', error: err.message });
  }
}; 