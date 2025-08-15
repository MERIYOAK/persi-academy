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

// Import controllers for fallback routes
const authController = require('./controllers/authController');

// Import middleware
const authMiddleware = require('./middleware/authMiddleware');
const adminAuthMiddleware = require('./middleware/adminAuthMiddleware');

const app = express();

// CORS configuration for development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:8080'
];

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

// Serve static files for local uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    console.log('💡 Make sure MongoDB is running or create a .env file with MONGODB_URI');
    console.log('💡 Example: MONGODB_URI=mongodb://localhost:27017/persi-academy');
    process.exit(1);
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

// Payment routes
app.use('/api/payment', paymentRoutes);

// Stripe webhook endpoint (at root level for Stripe compatibility)
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  console.log('🔧 Webhook endpoint hit at /webhook');
  console.log(`   - Headers:`, Object.keys(req.headers));
  console.log(`   - Body length:`, req.body ? req.body.length : 'No body');
  console.log(`   - Raw body length:`, req.rawBody ? req.rawBody.length : 'No raw body');
  console.log(`   - NODE_ENV:`, process.env.NODE_ENV);
  console.log(`   - STRIPE_SECRET_KEY:`, process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
  console.log(`   - Body type:`, typeof req.body);
  console.log(`   - Raw body type:`, typeof req.rawBody);
  
  // Forward to payment controller webhook
  const paymentController = require('./controllers/paymentController');
  paymentController.webhook(req, res);
});

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
  process.exit(1);
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