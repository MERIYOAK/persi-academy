const AWS = require('aws-sdk');

const S3_ROOT_PREFIX = process.env.S3_ROOT_PREFIX || 'persi-academy';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4',
});

const getSignedUrl = (key, expiresIn = 60 * 5) => {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: expiresIn,
  });
};

const uploadToS3 = (file, key, acl = 'private') => {
  return s3.upload({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: acl,
  }).promise();
};

const deleteFromS3 = (key) => {
  return s3.deleteObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  }).promise();
};

/**
 * Prefixes a key with the S3 root folder
 */
const withRootPrefix = (key) => {
  // Avoid double slashes
  return `${S3_ROOT_PREFIX.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
};

/**
 * Generate organized S3 keys based on file type and context
 */
const generateS3Key = (fileType, fileName, context = {}) => {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  let key;
  switch (fileType) {
    case 'profile-pic':
      key = `profile-pics/${timestamp}_${sanitizedFileName}`;
      break;
    case 'thumbnail':
      const courseName = context.courseName ? context.courseName.replace(/[^a-zA-Z0-9.-]/g, '_') : 'unknown';
      key = `thumbnails/${courseName}/${timestamp}_${sanitizedFileName}`;
      break;
    case 'video':
      const videoCourseName = context.courseName ? context.courseName.replace(/[^a-zA-Z0-9.-]/g, '_') : 'unknown';
      key = `videos/${videoCourseName}/${timestamp}_${sanitizedFileName}`;
      break;
    case 'course-material':
      const materialCourseName = context.courseName ? context.courseName.replace(/[^a-zA-Z0-9.-]/g, '_') : 'unknown';
      key = `course-materials/${materialCourseName}/${timestamp}_${sanitizedFileName}`;
      break;
    case 'certificate':
      const certCourseName = context.courseName ? context.courseName.replace(/[^a-zA-Z0-9.-]/g, '_') : 'unknown';
      key = `certificates/${certCourseName}/${timestamp}_${sanitizedFileName}`;
      break;
    default:
      key = `misc/${timestamp}_${sanitizedFileName}`;
  }
  return withRootPrefix(key);
};

/**
 * Upload file with organized folder structure
 */
const uploadFileWithOrganization = async (file, fileType, context = {}) => {
  const s3Key = generateS3Key(fileType, file.originalname, context);
  
  // Determine desired ACL - thumbnails should be public-read
  const desiredAcl = fileType === 'thumbnail' ? 'public-read' : 'private';

  let usedAcl = desiredAcl;
  try {
    const result = await uploadToS3(file, s3Key, usedAcl);
    return {
      s3Key,
      url: result.Location,
      publicUrl: usedAcl === 'public-read' ? result.Location : null,
    };
  } catch (error) {
    // If bucket has Object Ownership (ACLs disabled) or blocks public ACLs,
    // retry without ACL for thumbnails.
    const looksLikeAclIssue = /ACL|AccessControlList|InvalidArgument|AccessDenied/i.test(error?.message || '');
    if (fileType === 'thumbnail' && looksLikeAclIssue) {
      try {
        usedAcl = undefined; // omit ACL
        const result = await uploadToS3(file, s3Key, undefined);
        return {
          s3Key,
          url: result.Location,
          publicUrl: null, // object will not be public
        };
      } catch (retryError) {
        throw retryError;
      }
    }
    throw error;
  }
};

/**
 * Delete file from S3
 */
const deleteFileFromS3 = async (s3Key) => {
  return await deleteFromS3(s3Key);
};

/**
 * Get public URL for a file (if it's public)
 */
const getPublicUrl = (s3Key) => {
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
};

module.exports = {
  s3,
  getSignedUrl,
  uploadToS3,
  deleteFromS3,
  generateS3Key,
  uploadFileWithOrganization,
  deleteFileFromS3,
  getPublicUrl,
  withRootPrefix,
}; 