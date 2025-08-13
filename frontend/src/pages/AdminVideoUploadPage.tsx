import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Video, Clock, User, Save, X } from 'lucide-react';
import ProgressOverlay from '../components/ProgressOverlay';

interface Course {
  _id: string;
  title: string;
  description: string;
  videos?: any[];
}

const AdminVideoUploadPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Progress overlay state
  const [progressOverlay, setProgressOverlay] = useState({
    isVisible: false,
    progress: 0,
    status: 'loading' as 'loading' | 'success' | 'error',
    title: '',
    message: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1,
    file: null as File | null
  });

  // Fetch course details
  const fetchCourse = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        throw new Error('Admin token not found');
      }

      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      const data = await response.json();
      const courseData = data.data.course;
      setCourse(courseData);
      
      // Set default order to next available number
      const nextOrder = (courseData.videos?.length || 0) + 1;
      setFormData(prev => ({ ...prev, order: nextOrder }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch course');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      
      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        setError('Video file size must be less than 500MB');
        return;
      }

      setFormData(prev => ({ ...prev, file }));
      setError(null);
    }
  };

  // Handle progress overlay OK button
  const handleProgressOverlayOk = () => {
    setProgressOverlay(prev => ({ ...prev, isVisible: false }));
    
    // If it was a successful upload, redirect to videos page
    if (progressOverlay.status === 'success' && progressOverlay.title === 'Video Uploaded Successfully') {
      navigate(`/admin/courses/${courseId}/videos`);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show progress overlay
    setProgressOverlay({
      isVisible: true,
      progress: 0,
      status: 'loading',
      title: 'Uploading Video',
      message: 'Validating video information...'
    });
    
    // Validate required fields with user-friendly messages
    const validationErrors = [];
    
    if (!formData.title.trim()) {
      validationErrors.push('Video title is required');
    }
    if (!formData.description.trim()) {
      validationErrors.push('Video description is required');
    }
    if (!formData.file) {
      validationErrors.push('Video file is required');
    }
    if (formData.order < 1) {
      validationErrors.push('Order must be at least 1');
    }

    // If there are validation errors, show them and stop
    if (validationErrors.length > 0) {
      setProgressOverlay({
        isVisible: true,
        progress: 100,
        status: 'error',
        title: 'Validation Error',
        message: `Please fix the following errors:\n${validationErrors.join('\n')}`
      });
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      // Update progress - preparing upload
      setProgressOverlay(prev => ({
        ...prev,
        progress: 10,
        message: 'Preparing video for upload...'
      }));
      
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }

      // Update progress - creating form data
      setProgressOverlay(prev => ({
        ...prev,
        progress: 20,
        message: 'Preparing upload data...'
      }));

      const videoFormData = new FormData();
      videoFormData.append('title', formData.title);
      videoFormData.append('description', formData.description);
      videoFormData.append('order', formData.order.toString());
      videoFormData.append('courseId', courseId!);
      videoFormData.append('file', formData.file);

      // Update progress - starting upload
      setProgressOverlay(prev => ({
        ...prev,
        progress: 30,
        message: `Uploading video: ${formData.file?.name}...`
      }));

      // Upload via XHR to track progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          const overallProgress = 30 + (progress * 0.6); // Upload takes 30-90% of progress
          setProgressOverlay(prev => ({
            ...prev,
            progress: overallProgress,
            message: `Uploading video: ${progress}%`
          }));
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Update progress - processing response
            setProgressOverlay(prev => ({
              ...prev,
              progress: 95,
              message: 'Processing upload response...'
            }));

            // Update progress - success
            setProgressOverlay({
              isVisible: true,
              progress: 100,
              status: 'success',
              title: 'Video Uploaded Successfully',
              message: 'Video uploaded successfully! Duration automatically detected.'
            });
            
            setSuccess('Video uploaded successfully! Duration automatically detected.');
            
            // Reset form
            setFormData({
              title: '',
              description: '',
              order: (course?.videos?.length || 0) + 2,
              file: null
            });
          } else {
            const errorData = JSON.parse(xhr.responseText);
            setProgressOverlay({
              isVisible: true,
              progress: 100,
              status: 'error',
              title: 'Upload Failed',
              message: errorData.message || 'Failed to upload video'
            });
            setError(errorData.message || 'Failed to upload video');
          }
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        setProgressOverlay({
          isVisible: true,
          progress: 100,
          status: 'error',
          title: 'Upload Failed',
          message: 'Network error during upload'
        });
        setError('Network error during upload');
        setUploading(false);
      };

      xhr.open('POST', 'http://localhost:5000/api/videos/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`);
      xhr.send(videoFormData);

    } catch (err) {
      setProgressOverlay({
        isVisible: true,
        progress: 100,
        status: 'error',
        title: 'Upload Failed',
        message: err instanceof Error ? err.message : 'Failed to upload video'
      });
      setError(err instanceof Error ? err.message : 'Failed to upload video');
      setUploading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  // Clear success/error messages after timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            to="/admin/courses"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={`/admin/courses/${courseId}/videos`}
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Videos
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Upload Video</h1>
                <p className="text-gray-600">{course?.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Save className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                <div className="mt-1 text-sm text-red-700">
                  {error.split('\n').map((line, index) => (
                    <div key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-700 font-medium">Uploading video...</span>
              <span className="text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className={`p-6 ${progressOverlay.isVisible ? 'pointer-events-none' : ''}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Video Information</h2>
            
            {/* Info Alert */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Automatic Duration Detection</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Video duration will be automatically detected from the uploaded file. No manual input required.
                  </p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Video Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter video title"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter video description"
                />
              </div>

              {/* Order */}
              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
                  Order *
                </label>
                <input
                  type="number"
                  id="order"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                  min="1"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                />
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="video-file" className="block text-sm font-medium text-gray-700 mb-2">
                  Video File *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="video-file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="video-file"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors duration-200 cursor-pointer"
                  >
                    <Upload className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {formData.file ? formData.file.name : 'Choose video file'}
                    </span>
                  </label>
                </div>
                {formData.file && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                    <Video className="h-4 w-4" />
                    <span>{formData.file.name}</span>
                    <span>•</span>
                    <span>{(formData.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Supported formats: MP4, AVI, MOV, WMV, WebM, OGG, FLV, MKV. Max size: 500MB. Duration will be automatically detected.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Link
                  to={`/admin/courses/${courseId}/videos`}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Course Info */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Course Details</h4>
                <p className="text-sm text-gray-900 mb-1"><strong>Title:</strong> {course?.title}</p>
                <p className="text-sm text-gray-900 mb-1"><strong>Description:</strong> {course?.description}</p>
                <p className="text-sm text-gray-900"><strong>Current Videos:</strong> {course?.videos?.length || 0}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <Link
                    to={`/admin/courses/${courseId}/videos`}
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    View All Videos
                  </Link>
                  <Link
                    to={`/admin/courses/${courseId}/edit`}
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit Course
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overlay */}
      <ProgressOverlay
        isVisible={progressOverlay.isVisible}
        progress={progressOverlay.progress}
        status={progressOverlay.status}
        title={progressOverlay.title}
        message={progressOverlay.message}
        onOk={handleProgressOverlayOk}
      />
    </div>
  );
};

export default AdminVideoUploadPage; 