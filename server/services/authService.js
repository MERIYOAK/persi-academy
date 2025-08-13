const jwt = require('jsonwebtoken');
const User = require('../models/User');
const s3Service = require('./s3Service');
const emailService = require('./emailService');

class AuthService {
  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @returns {string} - JWT token
   */
  generateToken(user) {
    return jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        authProvider: user.authProvider 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Generate verification token (1 hour expiry)
   * @param {string} userId - User ID
   * @returns {string} - JWT verification token
   */
  generateVerificationToken(userId) {
    return jwt.sign(
      { userId, type: 'verification' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} - Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Register new user with local authentication (requires email verification)
   * @param {Object} userData - User registration data
   * @param {Object} profilePhoto - Profile photo file
   * @returns {Object} - User object and verification status
   */
  async registerLocal(userData, profilePhoto = null) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user with isVerified: false
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        authProvider: 'local',
        isVerified: false, // Email verification required
      });

      // Handle profile photo upload if provided
      if (profilePhoto) {
        try {
          s3Service.validateProfilePhoto(profilePhoto);
          if (s3Service.isConfigured()) {
            const profilePhotoKey = await s3Service.uploadProfilePhoto(
              profilePhoto.buffer,
              profilePhoto.originalname,
              user._id.toString()
            );
            user.profilePhotoKey = profilePhotoKey;
          } else {
            console.log('⚠️  S3 not configured - skipping profile photo upload');
          }
        } catch (error) {
          console.warn('⚠️  Profile photo upload failed:', error.message);
          // Continue registration without profile photo
        }
      }

      await user.save();

      // Generate verification token
      const verificationToken = this.generateVerificationToken(user._id);

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken
      );

      console.log(`✅ User registered successfully: ${user.email} (verification required)`);

      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider,
          profilePhotoKey: user.profilePhotoKey,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        verificationRequired: true,
        emailSent,
        message: emailSent 
          ? 'Registration successful! Please check your email to verify your account.'
          : 'Registration successful! Please contact support to verify your account.'
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  /**
   * Verify email with token
   * @param {string} verificationToken - JWT verification token
   * @returns {Object} - User object and auth token
   */
  async verifyEmail(verificationToken) {
    try {
      // Verify the token
      const decoded = this.verifyToken(verificationToken);
      
      if (decoded.type !== 'verification') {
        throw new Error('Invalid verification token');
      }

      // Find the user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if already verified
      if (user.isVerified) {
        throw new Error('Email is already verified');
      }

      // Mark user as verified
      user.isVerified = true;
      await user.save();

      // Generate auth token for automatic login
      const authToken = this.generateToken(user);

      // Send welcome email
      await emailService.sendWelcomeEmail(user.email, user.name);

      console.log(`✅ Email verified successfully: ${user.email}`);

      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider,
          profilePhotoKey: user.profilePhotoKey,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        token: authToken,
        message: 'Email verified successfully! You are now logged in.'
      };
    } catch (error) {
      console.error('❌ Email verification error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email
   * @param {string} email - User's email address
   * @returns {Object} - Success status and message
   */
  async resendVerificationEmail(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isVerified) {
        throw new Error('Email is already verified');
      }

      if (user.authProvider !== 'local') {
        throw new Error('Email verification is not required for this account type');
      }

      // Generate new verification token
      const verificationToken = this.generateVerificationToken(user._id);

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken
      );

      console.log(`✅ Verification email resent to: ${user.email}`);

      return {
        success: true,
        emailSent,
        message: emailSent 
          ? 'Verification email sent! Please check your inbox.'
          : 'Failed to send verification email. Please contact support.'
      };
    } catch (error) {
      console.error('❌ Resend verification email error:', error);
      throw error;
    }
  }

  /**
   * Login user with local authentication
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} - User object and token
   */
  async loginLocal(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user uses local authentication
      if (user.authProvider !== 'local') {
        throw new Error(`This account was created using ${user.authProvider} authentication`);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Check if user is verified (for local accounts)
      if (!user.isVerified) {
        throw new Error('Please verify your email address before logging in. Check your inbox for a verification link.');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new Error('Account is not active');
      }

      // Generate token
      const token = this.generateToken(user);

      console.log(`✅ User logged in successfully: ${user.email}`);

      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider,
          profilePhotoKey: user.profilePhotoKey,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        token,
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  /**
   * Handle Google OAuth authentication (no email verification required)
   * @param {Object} profile - Google profile data
   * @returns {Object} - User object and token
   */
  async handleGoogleAuth(profile) {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Update existing user with Google ID
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.name = profile.displayName;
          user.isVerified = true; // Google users are automatically verified
          
          // Handle Google profile photo
          if (profile.photos && profile.photos[0]) {
            try {
              const profilePhotoKey = await s3Service.uploadGoogleProfilePhoto(
                profile.photos[0].value,
                user._id.toString()
              );
              if (profilePhotoKey) {
                user.profilePhotoKey = profilePhotoKey;
              }
            } catch (error) {
              console.warn('Failed to upload Google profile photo:', error);
            }
          }
        } else {
          // Create new user
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            authProvider: 'google',
            isVerified: true, // Google users are automatically verified
          });

          // Handle Google profile photo
          if (profile.photos && profile.photos[0]) {
            try {
              const profilePhotoKey = await s3Service.uploadGoogleProfilePhoto(
                profile.photos[0].value,
                user._id.toString()
              );
              if (profilePhotoKey) {
                user.profilePhotoKey = profilePhotoKey;
              }
            } catch (error) {
              console.warn('Failed to upload Google profile photo:', error);
            }
          }
        }

        await user.save();
        console.log(`✅ Google user created/updated: ${user.email}`);
      }

      // Generate token
      const token = this.generateToken(user);

      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider,
          profilePhotoKey: user.profilePhotoKey,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        token,
      };
    } catch (error) {
      console.error('❌ Google auth error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object} - User object
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      console.error('❌ Get user error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @param {Object} profilePhoto - New profile photo
   * @returns {Object} - Updated user object
   */
  async updateProfile(userId, updateData, profilePhoto = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update basic fields
      if (updateData.name) user.name = updateData.name;
      if (updateData.email) {
        // Check if email is already taken
        const existingUser = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
        if (existingUser) {
          throw new Error('Email is already taken');
        }
        user.email = updateData.email;
      }

      // Handle profile photo update
      if (profilePhoto) {
        try {
          s3Service.validateProfilePhoto(profilePhoto);
          
          if (s3Service.isConfigured()) {
            // Delete old profile photo if exists
            if (user.profilePhotoKey) {
              await s3Service.deleteProfilePhoto(user.profilePhotoKey);
            }

            // Upload new profile photo
            const profilePhotoKey = await s3Service.uploadProfilePhoto(
              profilePhoto.buffer,
              profilePhoto.originalname,
              user._id.toString()
            );
            user.profilePhotoKey = profilePhotoKey;
          } else {
            console.log('⚠️  S3 not configured - skipping profile photo update');
          }
        } catch (error) {
          console.warn('⚠️  Profile photo update failed:', error.message);
          // Continue update without profile photo
        }
      }

      await user.save();

      console.log(`✅ User profile updated: ${user.email}`);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        profilePhotoKey: user.profilePhotoKey,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      };
    } catch (error) {
      console.error('❌ Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change password (for local users only)
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} - Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.authProvider !== 'local') {
        throw new Error('Password change is only available for local accounts');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      console.log(`✅ Password changed successfully for user: ${user.email}`);

      return true;
    } catch (error) {
      console.error('❌ Change password error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService(); 