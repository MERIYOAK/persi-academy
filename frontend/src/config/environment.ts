// Environment Configuration
export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  
  // Frontend Configuration
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'YT Academy',
  APP_DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'Master YouTube Success',
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || 'philiweb123@gmail.com',
  SUPPORT_WHATSAPP: import.meta.env.VITE_SUPPORT_WHATSAPP || '+15551234567',
  
  // S3 Configuration
  S3_BUCKET_URL: import.meta.env.VITE_S3_BUCKET_URL || 'https://persi-edu-platform.s3.us-east-1.amazonaws.com',
  S3_IMAGE_PATH: import.meta.env.VITE_S3_IMAGE_PATH || '/persi-academy/Ig-images/ig-image.jpeg',
  S3_BUCKET_URL_DOMAIN: import.meta.env.VITE_S3_BUCKET_URL_DOMAIN || 'persi-edu-platform.s3.us-east-1.amazonaws.com',
  
  // Third Party Services
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  
  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: import.meta.env.NODE_ENV === 'development',
  IS_PRODUCTION: import.meta.env.NODE_ENV === 'production',
  
  // API Endpoints
  API_ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      ME: '/api/auth/me',
      VERIFY_EMAIL: '/api/auth/verify-email',
      RESEND_VERIFICATION: '/api/auth/resend-verification',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      CHANGE_PASSWORD: '/api/auth/change-password',
      PROFILE: '/api/auth/profile',
      USER_PHOTO: '/api/auth/users/me/photo',
      VERIFY_TOKEN: '/api/auth/verify-token',
      HEALTH: '/api/auth/health'
    },
    ADMIN: {
      LOGIN: '/api/admin/login',
      VALIDATE: '/api/admin/validate',
      STATS: '/api/admin/stats',
      USERS: '/api/user/admin/all',
      USER_DETAILS: '/api/user/admin'
    },
    COURSES: {
      LIST: '/api/courses',
      DETAIL: '/api/courses',
      THUMBNAIL: '/api/courses/thumbnail',
      CREATE: '/api/courses',
      UPDATE: '/api/courses',
      DELETE: '/api/courses'
    },
    VIDEOS: {
      LIST: '/api/videos/course',
      DETAIL: '/api/videos',
      UPLOAD: '/api/videos/upload',
      UPDATE: '/api/videos',
      DELETE: '/api/videos',
      FREE_PREVIEW: '/api/videos/free-preview'
    },
    PROGRESS: {
      COURSE: '/api/progress/course',
      UPDATE: '/api/progress/update',
      DASHBOARD: '/api/progress/dashboard',
      COMPLETE_VIDEO: '/api/progress/complete-video',
      NEXT_VIDEO: '/api/progress/next-video',
      RESUME: '/api/progress/resume'
    },
    CERTIFICATES: {
      USER: '/api/certificates/user',
      DOWNLOAD: '/api/certificates/download',
      VERIFY: '/api/certificates/verify'
    },
    PAYMENT: {
      CHECK_PURCHASE: '/api/payment/check-purchase'
    }
  }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  let url = `${config.API_BASE_URL}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value.toString());
    });
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// Helper function to build S3 URLs
export const buildS3Url = (path: string): string => {
  return `${config.S3_BUCKET_URL}${path}`;
};

// Helper function to build frontend URLs
export const buildFrontendUrl = (path: string): string => {
  return `${config.FRONTEND_URL}${path}`;
};

export default config;
