const authService = require('../services/authService');
const s3Service = require('../services/s3Service');

/**
 * Register new user with local authentication (requires email verification)
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const profilePhoto = req.file;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const result = await authService.registerLocal(
      { name, email, password },
      profilePhoto
    );

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        verificationRequired: result.verificationRequired,
        emailSent: result.emailSent
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

/**
 * Verify email with token
 * POST /api/auth/verify-email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const result = await authService.verifyEmail(token);

    res.json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        token: result.token
      }
    });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    
    // Handle specific error cases
    if (error.message.includes('expired')) {
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired. Please request a new verification email.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.message.includes('already verified')) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. You can now log in.',
        code: 'ALREADY_VERIFIED'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Email verification failed'
    });
  }
};

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const result = await authService.resendVerificationEmail(email);

    res.json({
      success: true,
      message: result.message,
      data: {
        emailSent: result.emailSent
      }
    });

  } catch (error) {
    console.error('❌ Resend verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to resend verification email'
    });
  }
};

/**
 * Login user with local authentication
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await authService.loginLocal(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    
    // Handle specific error cases
    if (error.message.includes('verify your email')) {
      return res.status(401).json({
        success: false,
        message: error.message,
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

/**
 * Verify JWT token
 * POST /api/auth/verify-token
 */
const verifyToken = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = authService.verifyToken(token);
    
    // Get user data to return
    const user = await authService.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider,
          profilePhotoKey: user.profilePhotoKey,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        profilePhotoKey: user.profilePhotoKey,
        isVerified: user.isVerified,
        status: user.status,
        createdAt: user.createdAt,
        purchasedCourses: user.purchasedCourses || [],
        // Extended profile fields
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        sex: user.sex,
        address: user.address,
        telephone: user.telephone,
        country: user.country,
        city: user.city
      }
    });

  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'User not found'
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { 
      firstName, lastName, age, sex, address, telephone, country, city 
    } = req.body;
    const profilePhoto = req.file;

    console.log('🔧 [Profile Update] Request received:', {
      hasProfilePhoto: !!profilePhoto,
      profilePhotoName: profilePhoto?.originalname,
      profilePhotoSize: profilePhoto?.size,
      fields: { firstName, lastName, age, sex, address, telephone, country, city }
    });

    // Validate at least one field to update
    if (!firstName && !lastName && !age && !sex && !address && !telephone && !country && !city && !profilePhoto) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (age !== undefined) updateData.age = age ? parseInt(age) : null;
    if (sex !== undefined) updateData.sex = sex;
    if (address !== undefined) updateData.address = address;
    if (telephone !== undefined) updateData.telephone = telephone;
    if (country !== undefined) updateData.country = country;
    if (city !== undefined) updateData.city = city;

    console.log('🔧 [Profile Update] Calling authService.updateProfile with:', {
      userId: req.user.userId,
      updateData,
      hasProfilePhoto: !!profilePhoto
    });

    const updatedUser = await authService.updateProfile(
      req.user.userId,
      updateData,
      profilePhoto
    );

    console.log('✅ [Profile Update] Successfully updated user profile:', {
      userId: updatedUser._id,
      hasProfilePhotoKey: !!updatedUser.profilePhotoKey
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Profile update failed'
    });
  }
};

/**
 * Change password (for local users only)
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    await authService.changePassword(req.user.userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Password change failed'
    });
  }
};

/**
 * Get user profile photo signed URL
 * GET /api/users/me/photo
 */
const getProfilePhoto = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);

    if (!user.profilePhotoKey) {
      return res.status(404).json({
        success: false,
        message: 'No profile photo found'
      });
    }

    const signedUrl = await s3Service.getProfilePhotoSignedUrl(user.profilePhotoKey);

    res.json({
      success: true,
      data: {
        photoUrl: signedUrl,
        expiresIn: 60 // seconds
      }
    });

  } catch (error) {
    console.error('❌ Get profile photo error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile photo'
    });
  }
};

/**
 * Delete user profile photo
 * DELETE /api/users/me/photo
 */
const deleteProfilePhoto = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);

    if (!user.profilePhotoKey) {
      return res.status(404).json({
        success: false,
        message: 'No profile photo found'
      });
    }

    // Delete from S3
    await s3Service.deleteProfilePhoto(user.profilePhotoKey);

    // Update user document
    user.profilePhotoKey = null;
    await user.save();

    res.json({
      success: true,
      message: 'Profile photo deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete profile photo error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete profile photo'
    });
  }
};

/**
 * Google OAuth callback
 * GET /api/auth/google/callback
 */
const googleCallback = async (req, res) => {
  try {
    const result = await authService.handleGoogleAuth(req.user);

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/google-callback?token=${result.token}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Google callback error:', error);
    const errorUrl = `${process.env.FRONTEND_URL}/auth/google-callback?error=${encodeURIComponent(error.message)}`;
    res.redirect(errorUrl);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from storage
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * Check email availability for registration
 * POST /api/auth/check-email
 */
const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const result = await authService.checkEmailAvailability(email);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Email availability check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email availability'
    });
  }
};

/**
 * Send password reset email
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const result = await authService.sendPasswordResetEmail(email);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email'
    });
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const result = await authService.resetPassword(token, newPassword);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    
    // Handle specific error cases
    if (error.message.includes('expired')) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link has expired. Please request a new one.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.message.includes('Invalid token')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password reset link.',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  verifyToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  getProfilePhoto,
  deleteProfilePhoto,
  googleCallback,
  logout,
  checkEmailAvailability,
  forgotPassword,
  resetPassword
}; 