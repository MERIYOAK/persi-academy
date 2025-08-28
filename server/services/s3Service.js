const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

// Check if AWS credentials are available
const hasAwsCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

// Initialize S3 client only if credentials are available
let s3Client = null;
let bucketRegion = null;

if (hasAwsCredentials) {
  // Initialize with default region first
  const defaultRegion = process.env.AWS_REGION || 'us-east-1';
  s3Client = new S3Client({
    region: defaultRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  console.log(`✅ S3 client initialized with region: ${defaultRegion}`);
} else {
  console.log('⚠️  S3 client not initialized - missing AWS credentials');
  console.log('💡 Profile photo uploads will be disabled');
}

const BUCKET_NAME = 'persi-edu-platform';
const PROFILE_PHOTOS_FOLDER = 'persi-academy/profile-pictures/';

// Function to detect bucket region
async function detectBucketRegion() {
  if (!hasAwsCredentials || !s3Client) {
    throw new Error('S3 is not configured. Please set AWS credentials to enable profile photo uploads.');
  }

  try {
    const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
    await s3Client.send(command);
    // If successful, bucket is in the current region
    return s3Client.config.region();
  } catch (error) {
    if (error.name === 'PermanentRedirect' || error.$metadata?.httpStatusCode === 301) {
      // Extract region from the error response
      const region = error.$metadata?.extendedRequestId?.split('/')[1] || 
                    error.$metadata?.cfId || 
                    'us-east-1';
      
      console.log(`🔄 Detected bucket region: ${region}`);
      
      // Reinitialize S3 client with correct region
      s3Client = new S3Client({
        region: region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      
      return region;
    }
    throw error;
  }
}

class S3Service {
  /**
   * Upload profile photo to S3
   * @param {Buffer} fileBuffer - The file buffer
   * @param {string} originalName - Original filename
   * @param {string} userId - User ID for unique naming
   * @returns {Promise<string>} - S3 object key
   */
  async uploadProfilePhoto(fileBuffer, originalName, userId) {
    try {
      if (!hasAwsCredentials || !s3Client) {
        throw new Error('S3 is not configured. Please set AWS credentials to enable profile photo uploads.');
      }

      // Detect bucket region if not already detected
      if (!bucketRegion) {
        bucketRegion = await detectBucketRegion();
      }

      // Generate unique filename
      const fileExtension = originalName.split('.').pop();
      const uniqueFileName = `${userId}-${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
      const key = `${PROFILE_PHOTOS_FOLDER}${uniqueFileName}`;

      // Upload to S3
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: this.getContentType(fileExtension),
        ACL: 'private', // Make the object private
        Metadata: {
          'user-id': userId,
          'upload-date': new Date().toISOString(),
        },
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      console.log(`✅ Profile photo uploaded successfully: ${key}`);
      
      return key;
    } catch (error) {
      console.error('❌ Error uploading profile photo to S3:', error);
      
      // Handle region-specific errors
      if (error.name === 'PermanentRedirect' || error.$metadata?.httpStatusCode === 301) {
        console.log('🔄 Retrying with correct region...');
        try {
          // Reset bucket region and retry
          bucketRegion = null;
          bucketRegion = await detectBucketRegion();
          
          // Retry the upload
          const fileExtension = originalName.split('.').pop();
          const uniqueFileName = `${userId}-${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
          const key = `${PROFILE_PHOTOS_FOLDER}${uniqueFileName}`;

          const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: this.getContentType(fileExtension),
            ACL: 'private',
            Metadata: {
              'user-id': userId,
              'upload-date': new Date().toISOString(),
            },
          };

          await s3Client.send(new PutObjectCommand(uploadParams));
          console.log(`✅ Profile photo uploaded successfully after region fix: ${key}`);
          return key;
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
          throw new Error('Failed to upload profile photo after region detection');
        }
      }
      
      throw new Error('Failed to upload profile photo');
    }
  }

  /**
   * Generate signed URL for profile photo
   * @param {string} profilePhotoKey - S3 object key
   * @param {number} expiresIn - Expiration time in seconds (default: 60)
   * @returns {Promise<string>} - Signed URL
   */
  async getProfilePhotoSignedUrl(profilePhotoKey, expiresIn = 60) {
    try {
      if (!hasAwsCredentials || !s3Client) {
        throw new Error('S3 is not configured. Please set AWS credentials to enable profile photo access.');
      }

      if (!profilePhotoKey) {
        throw new Error('Profile photo key is required');
      }

      // Detect bucket region if not already detected
      if (!bucketRegion) {
        bucketRegion = await detectBucketRegion();
      }

      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: profilePhotoKey,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      console.log(`✅ Generated signed URL for profile photo: ${profilePhotoKey}`);
      
      return signedUrl;
    } catch (error) {
      console.error('❌ Error generating signed URL:', error);
      
      // Handle region-specific errors
      if (error.name === 'PermanentRedirect' || error.$metadata?.httpStatusCode === 301) {
        console.log('🔄 Retrying signed URL generation with correct region...');
        try {
          // Reset bucket region and retry
          bucketRegion = null;
          bucketRegion = await detectBucketRegion();
          
          const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: profilePhotoKey,
          });

          const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
          console.log(`✅ Generated signed URL after region fix: ${profilePhotoKey}`);
          return signedUrl;
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
          throw new Error('Failed to generate profile photo URL after region detection');
        }
      }
      
      throw new Error('Failed to generate profile photo URL');
    }
  }

  /**
   * Delete profile photo from S3
   * @param {string} profilePhotoKey - S3 object key
   * @returns {Promise<void>}
   */
  async deleteProfilePhoto(profilePhotoKey) {
    try {
      if (!hasAwsCredentials || !s3Client) {
        console.log('⚠️  S3 not configured - skipping profile photo deletion');
        return;
      }

      if (!profilePhotoKey) {
        console.log('No profile photo key provided for deletion');
        return;
      }

      // Detect bucket region if not already detected
      if (!bucketRegion) {
        bucketRegion = await detectBucketRegion();
      }

      const deleteParams = {
        Bucket: BUCKET_NAME,
        Key: profilePhotoKey,
      };

      await s3Client.send(new DeleteObjectCommand(deleteParams));
      console.log(`✅ Profile photo deleted successfully: ${profilePhotoKey}`);
    } catch (error) {
      console.error('❌ Error deleting profile photo from S3:', error);
      
      // Handle region-specific errors
      if (error.name === 'PermanentRedirect' || error.$metadata?.httpStatusCode === 301) {
        console.log('🔄 Retrying deletion with correct region...');
        try {
          // Reset bucket region and retry
          bucketRegion = null;
          bucketRegion = await detectBucketRegion();
          
          const deleteParams = {
            Bucket: BUCKET_NAME,
            Key: profilePhotoKey,
          };

          await s3Client.send(new DeleteObjectCommand(deleteParams));
          console.log(`✅ Profile photo deleted successfully after region fix: ${profilePhotoKey}`);
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
          throw new Error('Failed to delete profile photo after region detection');
        }
      } else {
        throw new Error('Failed to delete profile photo');
      }
    }
  }

  /**
   * Download Google profile photo and upload to S3
   * @param {string} googlePhotoUrl - Google profile photo URL
   * @param {string} userId - User ID
   * @returns {Promise<string>} - S3 object key
   */
  async uploadGoogleProfilePhoto(googlePhotoUrl, userId) {
    try {
      if (!hasAwsCredentials || !s3Client) {
        console.log('⚠️  S3 not configured - skipping Google profile photo upload');
        return null;
      }

      // Detect bucket region if not already detected
      if (!bucketRegion) {
        bucketRegion = await detectBucketRegion();
      }

      // Download the image from Google
      const response = await fetch(googlePhotoUrl);
      if (!response.ok) {
        throw new Error('Failed to download Google profile photo');
      }

      const imageBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);

      // Determine file extension from content type
      const contentType = response.headers.get('content-type');
      const extension = this.getExtensionFromContentType(contentType);

      // Generate unique filename
      const uniqueFileName = `${userId}-google-${crypto.randomBytes(16).toString('hex')}.${extension}`;
      const key = `${PROFILE_PHOTOS_FOLDER}${uniqueFileName}`;

      // Upload to S3
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'private',
        Metadata: {
          'user-id': userId,
          'source': 'google',
          'upload-date': new Date().toISOString(),
        },
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      console.log(`✅ Google profile photo uploaded successfully: ${key}`);
      
      return key;
    } catch (error) {
      console.error('❌ Error uploading Google profile photo to S3:', error);
      
      // Handle region-specific errors
      if (error.name === 'PermanentRedirect' || error.$metadata?.httpStatusCode === 301) {
        console.log('🔄 Retrying Google profile photo upload with correct region...');
        try {
          // Reset bucket region and retry
          bucketRegion = null;
          bucketRegion = await detectBucketRegion();
          
          // Download the image from Google again
          const response = await fetch(googlePhotoUrl);
          if (!response.ok) {
            throw new Error('Failed to download Google profile photo');
          }

          const imageBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(imageBuffer);

          const contentType = response.headers.get('content-type');
          const extension = this.getExtensionFromContentType(contentType);

          const uniqueFileName = `${userId}-google-${crypto.randomBytes(16).toString('hex')}.${extension}`;
          const key = `${PROFILE_PHOTOS_FOLDER}${uniqueFileName}`;

          const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: 'private',
            Metadata: {
              'user-id': userId,
              'source': 'google',
              'upload-date': new Date().toISOString(),
            },
          };

          await s3Client.send(new PutObjectCommand(uploadParams));
          console.log(`✅ Google profile photo uploaded successfully after region fix: ${key}`);
          return key;
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
          console.log('⚠️  Continuing without Google profile photo');
          return null;
        }
      }
      
      console.log('⚠️  Continuing without Google profile photo');
      return null;
    }
  }

  /**
   * Get content type based on file extension
   * @param {string} extension - File extension
   * @returns {string} - Content type
   */
  getContentType(extension) {
    const contentTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Get file extension from content type
   * @param {string} contentType - Content type
   * @returns {string} - File extension
   */
  getExtensionFromContentType(contentType) {
    const contentTypes = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    return contentTypes[contentType] || 'jpg';
  }

  /**
   * Validate file type and size
   * @param {Object} file - Multer file object
   * @param {number} maxSize - Maximum file size in bytes
   * @returns {boolean} - Whether file is valid
   */
  validateProfilePhoto(file, maxSize = 5 * 1024 * 1024) { // 5MB default
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
    }

    return true;
  }

  /**
   * Check if S3 is configured
   * @returns {boolean} - Whether S3 is available
   */
  isConfigured() {
    return hasAwsCredentials && !!s3Client;
  }
}

module.exports = new S3Service(); 