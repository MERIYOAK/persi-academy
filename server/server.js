const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import Passport configuration
const passport = require('./config/passport');

// Import services
const emailService = require('./services/emailService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const courseRoutesEnhanced = require('./routes/courseRoutesEnhanced');
const myCoursesRoutes = require('./routes/myCoursesRoutes');
const archiveRoutes = require('./routes/archiveRoutes');
const videoRoutes = require('./routes/videoRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const progressRoutes = require('./routes/progressRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

// Import controllers for fallback routes
const authController = require('./controllers/authController');

// Import middleware
const authMiddleware = require('./middleware/authMiddleware');
const adminAuthMiddleware = require('./middleware/adminAuthMiddleware');

const app = express();

// CORS configuration for development and production
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.CLIENT_URL || 'http://localhost:5173',
  'https://youtubeacademy.vercel.app', // Vercel production domain
  'https://persi-academy.vercel.app', // Alternative Vercel domain
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:8080'
].filter(Boolean); // Remove any undefined values

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: allowedOrigins
    }
  });
});

// Test API route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Handle favicon.ico requests (browsers often request this)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content - let static middleware handle favicon.svg
});

// Note: Certificate PDFs are now served directly from S3 with public-read ACL
// No local file serving needed for certificates

// Public certificate preview route
app.get('/certificate-preview/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    // Import Certificate model
    const Certificate = require('./models/Certificate');
    
    // Find certificate by ID
    const certificate = await Certificate.getByCertificateId(certificateId);
    
    if (!certificate) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Certificate Not Found</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
          <div class="text-center max-w-md mx-auto p-8">
            <div class="text-red-500 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold mb-4 text-gray-900">Certificate Not Found</h2>
            <p class="text-gray-600 mb-6">The certificate you're looking for doesn't exist or has been removed.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200">
              Go to Homepage
            </a>
          </div>
        </body>
        </html>
      `);
    }
    
         // Use the S3 URL directly - no need to check local file
     const s3Url = certificate.pdfUrl;
     
     if (!s3Url) {
       return res.status(404).send(`
         <!DOCTYPE html>
         <html lang="en">
         <head>
           <meta charset="UTF-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
           <title>Certificate PDF Not Found</title>
           <script src="https://cdn.tailwindcss.com"></script>
         </head>
         <body class="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
           <div class="text-center max-w-md mx-auto p-8">
             <div class="text-red-500 mb-4">
               <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
               </svg>
             </div>
             <h2 class="text-2xl font-bold mb-4 text-gray-900">Certificate PDF Not Found</h2>
             <p class="text-gray-600 mb-6">The certificate file could not be located.</p>
             <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200">
               Go to Homepage
             </a>
           </div>
         </body>
         </html>
       `);
     }
     
     // Format dates for display
     const formatDate = (dateString) => {
       return new Date(dateString).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
       });
     };
     
     // Create HTML page with PDF viewer and verify button
     const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate of Completion - ${certificate.courseTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          .pdf-container {
            height: calc(100vh - 200px);
            min-height: 500px;
          }
          @media (max-width: 768px) {
            .pdf-container {
              height: calc(100vh - 300px);
              min-height: 400px;
            }
          }
        </style>
      </head>
      <body class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <!-- Animated Background -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
          <div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
          <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400 to-blue-600 rounded-full opacity-10 animate-pulse" style="animation-delay: 2s;"></div>
        </div>
        
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Header -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Certificate of Completion</h1>
            <p class="text-lg text-gray-600">${certificate.courseTitle}</p>
            <p class="text-sm text-gray-500 mt-2">Issued to ${certificate.studentName} on ${formatDate(certificate.dateIssued)}</p>
          </div>
          
          <!-- Certificate Info Card -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6 max-w-2xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-green-600">${certificate.completionPercentage}%</div>
                <div class="text-sm text-gray-600">Completion</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-blue-600">${certificate.completedLessons}/${certificate.totalLessons}</div>
                <div class="text-sm text-gray-600">Lessons Completed</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-purple-600">${certificate.certificateId.slice(-8)}</div>
                <div class="text-sm text-gray-600">Certificate ID</div>
              </div>
            </div>
          </div>
          
          <!-- PDF Viewer -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <h3 class="text-lg font-semibold text-gray-900">Certificate Preview</h3>
              <p class="text-sm text-gray-600">View your certificate of completion below</p>
            </div>
            <div class="pdf-container">
              <iframe 
                src="${s3Url}" 
                class="w-full h-full border-0"
                title="Certificate PDF"
              ></iframe>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <a
              href="/api/certificates/verify/${certificate.certificateId}"
              target="_blank"
              class="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Verify Certificate</span>
            </a>
            
            <a
              href="${s3Url}"
              download
              class="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Certificate</span>
            </a>
          </div>
          
          <!-- Footer -->
          <div class="text-center mt-8 text-sm text-gray-500">
            <p>This certificate is issued by ${certificate.platformName || 'Learning Platform'}</p>
            <p class="mt-1">Certificate ID: ${certificate.certificateId}</p>
          </div>
        </div>
      </body>
      </html>
     `;
     
     res.send(html);
    
  } catch (error) {
    console.error('Error serving certificate preview:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - Certificate Preview</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div class="text-center max-w-md mx-auto p-8">
          <div class="text-red-500 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Error Loading Certificate</h2>
          <p class="text-gray-600 mb-6">There was an error loading the certificate. Please try again later.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200">
            Go to Homepage
          </a>
        </div>
      </body>
      </html>
    `);
  }
});

// Favicon is handled by static middleware - no custom route needed

// Database connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  // Removed deprecated options: useNewUrlParser and useUnifiedTopology
  // These are no longer needed in MongoDB Driver 4.0+
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    console.log('💡 Make sure MongoDB is running or create a .env file with MONGODB_URI');
    console.log('💡 Example: MONGODB_URI=mongodb://localhost:27017/persi-academy');
    
    // In development, don't exit on MongoDB connection failure
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('⚠️  Continuing without MongoDB connection in development mode');
    }
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/my-courses', myCoursesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/certificates', certificateRoutes);

// Fallback route for profile photo (backward compatibility)
app.get('/api/users/me/photo', authMiddleware, (req, res) => {
  authController.getProfilePhoto(req, res);
});

app.delete('/api/users/me/photo', authMiddleware, (req, res) => {
  authController.deleteProfilePhoto(req, res);
});

// Enhanced course routes (new versioning system) - PRIMARY
app.use('/api/courses', courseRoutesEnhanced);

// Legacy course routes (for backward compatibility)
app.use('/api/courses-legacy', courseRoutes);

// Archive management routes (admin only)
app.use('/api/archive', archiveRoutes);

// Video routes
app.use('/api/videos', videoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Payment routes
app.use('/api/payment', paymentRoutes);

// User routes
app.use('/api/user', userRoutes);

// Admin dashboard stats
app.get('/api/admin/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const Course = require('./models/Course');
    const CourseVersion = require('./models/CourseVersion');
    const Video = require('./models/Video');
    const User = require('./models/User');
    const Transaction = require('./models/Transaction');

    // Get total users (excluding admins)
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Get total courses
    const totalCourses = await Course.countDocuments();

    // Calculate total revenue from completed transactions
    const completedTransactions = await Transaction.find({ status: 'completed' });
    const totalRevenue = completedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    // Calculate active sessions (users who have been active in the last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeSessions = await User.countDocuments({
      updatedAt: { $gte: twentyFourHoursAgo }
    });

    // Get course statistics
    const activeCourses = await Course.countDocuments({ status: 'active' });
    const inactiveCourses = await Course.countDocuments({ status: 'inactive' });
    const archivedCourses = await Course.countDocuments({ status: 'archived' });
    const totalVersions = await CourseVersion.countDocuments();
    const totalVideos = await Video.countDocuments();

    // Get recent courses
    const recentCourses = await Course.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt price');

    // Get recent transactions
    const recentTransactions = await Transaction.find({ status: 'completed' })
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount createdAt');

    const stats = {
      totalUsers,
      totalCourses,
      totalRevenue,
      activeSessions,
      activeCourses,
      inactiveCourses,
      archivedCourses,
      totalVersions,
      totalVideos,
      recentCourses,
      recentTransactions
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: Object.values(error.errors).map(err => err.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: error.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Environment validation
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET'
];

// Optional environment variables
const optionalEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_PORT',
  'SMTP_SECURE',
  'FROM_EMAIL',
  'FRONTEND_URL',
  'BACKEND_URL',
  'SESSION_SECRET'
];

// Set fallback values for development
if (process.env.NODE_ENV !== 'production') {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/persi-academy';
  process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  process.env.BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret';
  process.env.SMTP_PORT = process.env.SMTP_PORT || '587';
  process.env.SMTP_SECURE = process.env.SMTP_SECURE || 'false';
}

const missingRequiredVars = requiredEnvVars.filter(varName => !process.env[varName]);
const missingOptionalVars = optionalEnvVars.filter(varName => !process.env[varName]);

if (missingRequiredVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingRequiredVars);
  console.log('💡 Create a .env file with the required variables');
  console.log('💡 For development, these will be set to default values');
  
  // In development, set default values instead of exiting
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔄 Setting default values for development...');
    if (!process.env.MONGODB_URI) {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/persi-academy';
      console.log('   MONGODB_URI set to default');
    }
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'dev-jwt-secret-change-in-production';
      console.log('   JWT_SECRET set to default');
    }
  } else {
    process.exit(1);
  }
}

if (missingOptionalVars.length > 0 && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  Missing optional environment variables:', missingOptionalVars);
  console.log('💡 These features will be disabled:');
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('   - Google OAuth authentication');
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('   - Profile photo uploads to S3');
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('   - Email verification system');
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Don't expose internal errors to client
  if (err.code === 'ENOENT') {
    return res.status(404).json({ 
      error: 'Resource not found',
      message: 'The requested resource could not be found'
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Something went wrong on the server'
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Check S3 configuration on startup
  console.log('\n🔍 Checking S3 configuration...');
  const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
  
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;
  
  if (!accessKeyId || !secretAccessKey || !bucket) {
    console.log('⚠️  S3 not configured - uploads will use local storage');
    console.log('💡 To enable S3, add these to your .env file:');
    console.log('   AWS_ACCESS_KEY_ID=your_access_key');
    console.log('   AWS_SECRET_ACCESS_KEY=your_secret_key');
    console.log('   AWS_S3_BUCKET=your_bucket_name');
  } else {
    console.log('✅ S3 environment variables found');
    console.log(`   - Bucket: ${bucket}`);
    console.log(`   - Region: ${region}`);
    
    // Test S3 connection
    const testS3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey }
    });
    
    testS3Client.send(new ListBucketsCommand({}))
      .then(() => {
        console.log('✅ S3 connection successful - uploads will use S3');
      })
      .catch((error) => {
        console.log('❌ S3 connection failed - uploads will use local storage');
        console.log(`   Error: ${error.message}`);
        console.log('💡 Check your AWS credentials and bucket permissions');
      });
  }

  // Check email configuration on startup
  console.log('\n📧 Checking email configuration...');
  if (emailService.isEmailConfigured()) {
    console.log('✅ Email service configured - verification emails will be sent');
  } else {
    console.log('⚠️  Email service not configured - verification emails will be skipped');
    console.log('💡 To enable email verification, add these to your .env file:');
    console.log('   SMTP_HOST=smtp.gmail.com');
    console.log('   SMTP_USER=your-email@gmail.com');
    console.log('   SMTP_PASSWORD=your-app-password');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app; 