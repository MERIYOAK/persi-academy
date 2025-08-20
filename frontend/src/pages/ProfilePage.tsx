import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Calendar, Shield, Camera, Save, ArrowLeft, Edit3, X, 
  CheckCircle, AlertCircle, Eye, EyeOff, Phone, MapPin, Globe, 
  UserCheck, Upload, Trash2, RotateCcw, Plus, Minus
} from 'lucide-react';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  authProvider: string;
  profilePhotoKey?: string;
  isVerified: boolean;
  createdAt: string;
  purchasedCourses?: string[];
  // Extended profile fields
  firstName?: string;
  lastName?: string;
  age?: number;
  sex?: string;
  address?: string;
  telephone?: string;
  country?: string;
  city?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  age: string;
  sex: string;
  address: string;
  telephone: string;
  country: string;
  city: string;
  email: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  age?: string;
  telephone?: string;
  address?: string;
  country?: string;
  city?: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    age: '',
    sex: '',
    address: '',
    telephone: '',
    country: '',
    city: '',
    email: ''
  });
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Animation states
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const result = await response.json();
        setUserData(result.data);
        
        // Parse name into first and last name
        const nameParts = result.data.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        setFormData({
          firstName,
          lastName,
          age: result.data.age?.toString() || '',
          sex: result.data.sex || '',
          address: result.data.address || '',
          telephone: result.data.telephone || '',
          country: result.data.country || '',
          city: result.data.city || '',
          email: result.data.email
        });

        // Fetch profile image if available
        if (result.data.profilePhotoKey) {
          try {
            const photoResponse = await fetch('http://localhost:5000/api/auth/users/me/photo', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (photoResponse.ok) {
              const photoResult = await photoResponse.json();
              setProfileImageUrl(photoResult.data.photoUrl);
            } else {
              console.log('Profile photo not available or expired');
              setProfileImageUrl(null);
            }
          } catch (photoError) {
            console.log('Profile photo not available');
            setProfileImageUrl(null);
          }
        } else {
          // User doesn't have a profile photo
          setProfileImageUrl(null);
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
        showToastMessage('Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (formData.age) {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        errors.age = 'Age must be between 1 and 120';
      }
    }

    if (formData.telephone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.telephone.replace(/\s/g, ''))) {
        errors.telephone = 'Please enter a valid phone number';
      }
    }

    if (formData.address && formData.address.length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }

    if (formData.country && formData.country.length < 2) {
      errors.country = 'Country must be at least 2 characters';
    }

    if (formData.city && formData.city.length < 2) {
      errors.city = 'City must be at least 2 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('🔧 [ProfilePage] Image upload triggered:', { file });
    
    if (file) {
      console.log('🔧 [ProfilePage] File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('❌ [ProfilePage] Invalid file type:', file.type);
        showToastMessage('Please select a valid image file', 'error');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.log('❌ [ProfilePage] File too large:', file.size);
        showToastMessage('Image size must be less than 5MB', 'error');
        return;
      }

      console.log('✅ [ProfilePage] File validation passed, setting file and preview');
      setProfileImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('✅ [ProfilePage] Preview created');
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('❌ [ProfilePage] No file selected');
    }
  };

  const handleSave = async () => {
    console.log('🔧 [ProfilePage] Save triggered');
    console.log('🔧 [ProfilePage] Form data:', formData);
    console.log('🔧 [ProfilePage] Profile image file:', profileImageFile);
    
    if (!validateForm()) {
      console.log('❌ [ProfilePage] Form validation failed');
      showToastMessage('Please fix the validation errors', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ [ProfilePage] No token found');
        return;
      }

      console.log('🔧 [ProfilePage] Preparing form data for upload');
      // Prepare form data for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('age', formData.age);
      formDataToSend.append('sex', formData.sex);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('telephone', formData.telephone);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('city', formData.city);
      
      if (profileImageFile) {
        console.log('🔧 [ProfilePage] Adding profile photo to form data:', profileImageFile.name);
        formDataToSend.append('profilePhoto', profileImageFile);
      } else {
        console.log('🔧 [ProfilePage] No profile photo to upload');
      }

      console.log('🔧 [ProfilePage] Sending API request to update profile');
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      console.log('🔧 [ProfilePage] API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [ProfilePage] Profile update successful:', result);
        setUserData(result.data);
        setIsEditing(false);
        setProfileImageFile(null);
        setImagePreview(null);
        showToastMessage('Profile updated successfully!', 'success');
        
        // If a new image was uploaded, fetch the new signed URL
        if (profileImageFile && result.data.profilePhotoKey) {
          console.log('🔧 [ProfilePage] Fetching new profile photo URL');
          try {
            const photoResponse = await fetch('http://localhost:5000/api/auth/users/me/photo', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (photoResponse.ok) {
              const photoResult = await photoResponse.json();
              console.log('✅ [ProfilePage] New profile photo URL fetched:', photoResult.data.photoUrl);
              setProfileImageUrl(photoResult.data.photoUrl);
            } else {
              console.log('❌ [ProfilePage] Failed to fetch new profile photo URL:', photoResponse.status);
            }
          } catch (photoError) {
            console.error('❌ [ProfilePage] Error fetching new profile photo URL:', photoError);
            // Fallback to preview if signed URL fetch fails
            setProfileImageUrl(imagePreview);
          }
        } else {
          console.log('🔧 [ProfilePage] No new profile photo to fetch URL for');
        }
      } else {
        const error = await response.json();
        console.log('❌ [ProfilePage] Profile update failed:', error);
        showToastMessage(error.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToastMessage('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToastMessage('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToastMessage('New password must be at least 6 characters long', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        showToastMessage('Password changed successfully!', 'success');
        setShowPasswordChange(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await response.json();
        showToastMessage(error.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToastMessage('Failed to change password', 'error');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileImageFile(null);
    setImagePreview(null);
    setValidationErrors({});
    
    // Reset form data to original values
    if (userData) {
      const nameParts = userData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setFormData({
        firstName,
        lastName,
        age: userData.age?.toString() || '',
        sex: userData.sex || '',
        address: userData.address || '',
        telephone: userData.telephone || '',
        country: userData.country || '',
        city: userData.city || '',
        email: userData.email
      });
    }
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-3 xxs:px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 xxs:h-16 xxs:w-16 border-4 border-red-600 border-t-transparent mx-auto mb-4 xxs:mb-6"></div>
          <p className="text-gray-600 text-base xxs:text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-3 xxs:px-4">
        <div className="text-center max-w-md mx-auto p-4 xxs:p-8">
          <div className="text-red-600 mb-4 xxs:mb-6">
            <User className="h-16 w-16 xxs:h-20 xxs:w-20 mx-auto" />
          </div>
          <h2 className="text-xl xxs:text-2xl font-bold text-gray-800 mb-3 xxs:mb-4">User Not Found</h2>
          <p className="text-gray-600 mb-6 xxs:mb-8 text-sm xxs:text-base">Please log in to access your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 xxs:px-8 py-2 xxs:py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm xxs:text-base"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const currentImageUrl = imagePreview || profileImageUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-16 xxs:top-20 right-2 xxs:right-3 sm:right-4 z-50 p-2 xxs:p-3 sm:p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {toastType === 'success' ? (
              <CheckCircle className="h-4 w-4 xxs:h-5 xxs:w-5" />
            ) : (
              <AlertCircle className="h-4 w-4 xxs:h-5 xxs:w-5" />
            )}
            <span className="text-xs xxs:text-sm sm:text-base">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 xxs:px-4 sm:px-6 lg:px-8 py-3 xxs:py-4 sm:py-6">
          <div className="flex items-center space-x-2 xxs:space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-1 xxs:space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:bg-gray-100 px-2 xxs:px-3 py-2 rounded-lg text-sm xxs:text-base"
            >
              <ArrowLeft className="h-4 w-4 xxs:h-5 xxs:w-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
          </div>
          <h1 className="text-xl xxs:text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mt-3 xxs:mt-4 sm:mt-6 mb-2">Profile & Settings</h1>
          <p className="text-gray-600 text-sm xxs:text-base sm:text-lg">Manage your account information and preferences</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 xxs:px-4 sm:px-6 lg:px-8 py-6 xxs:py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xxs:gap-6 lg:gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div 
              className={`bg-white rounded-2xl shadow-lg transition-all duration-500 overflow-hidden transform ${
                isCardHovered ? 'scale-105 rotate-1 shadow-2xl' : 'hover:shadow-xl'
              }`}
              onMouseEnter={() => setIsCardHovered(true)}
              onMouseLeave={() => setIsCardHovered(false)}
            >
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-3 xxs:p-4 sm:p-6 lg:p-8 text-white text-center">
                <div className="relative inline-block">
                  <div className="h-24 w-24 xxs:h-28 xxs:w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-white/20 mx-auto mb-4 xxs:mb-6 ring-4 ring-white/30 transition-all duration-300 hover:ring-white/50">
                    {currentImageUrl ? (
                      <img
                        src={currentImageUrl}
                        alt={userData.name}
                        className="h-full w-full object-cover"
                        onError={() => setProfileImageUrl(null)}
                      />
                    ) : (
                      <User className="h-full w-full text-white/80 p-4 xxs:p-6 sm:p-8" />
                    )}
                  </div>
                  
                  {/* Image upload button */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-4 xxs:bottom-6 right-0 bg-white text-red-600 p-2 xxs:p-3 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
                    title="Upload new photo"
                  >
                    <Camera className="h-4 w-4 xxs:h-5 xxs:w-5" />
                  </button>
                  
                  {/* Remove image button */}
                  {currentImageUrl && (
                    <button 
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          if (!token) return;

                          const response = await fetch('http://localhost:5000/api/auth/users/me/photo', {
                            method: 'DELETE',
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });

                          if (response.ok) {
                            setProfileImageFile(null);
                            setImagePreview(null);
                            setProfileImageUrl(null);
                            showToastMessage('Profile photo removed successfully!', 'success');
                          } else {
                            const error = await response.json();
                            showToastMessage(error.message || 'Failed to remove profile photo', 'error');
                          }
                        } catch (error) {
                          console.error('Error removing profile photo:', error);
                          showToastMessage('Failed to remove profile photo', 'error');
                        }
                      }}
                      className="absolute bottom-4 xxs:bottom-6 left-0 bg-red-500 text-white p-2 xxs:p-3 rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
                      title="Remove photo"
                    >
                      <Trash2 className="h-4 w-4 xxs:h-5 xxs:w-5" />
                    </button>
                  )}
                </div>
                
                <h2 className="text-lg xxs:text-xl sm:text-2xl font-bold mb-2">{userData.name}</h2>
                <p className="text-red-100 mb-3 xxs:mb-4 sm:mb-6 text-xs xxs:text-sm sm:text-base">{userData.email}</p>
                
                                  <div className="space-y-2 xxs:space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-center space-x-2 xxs:space-x-3 text-xs xxs:text-sm">
                      <Calendar className="h-3 w-3 xxs:h-4 xxs:w-4" />
                      <span>Member since {new Date(userData.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}</span>
                    </div>
                  <div className="flex items-center justify-center space-x-2 xxs:space-x-3 text-xs xxs:text-sm">
                    <Shield className="h-3 w-3 xxs:h-4 xxs:w-4" />
                    <span className="flex items-center space-x-1 xxs:space-x-2">
                      {userData.isVerified ? (
                        <>
                          <CheckCircle className="h-3 w-3 xxs:h-4 xxs:w-4 text-green-300" />
                          <span>Verified Account</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 xxs:h-4 xxs:w-4 text-yellow-300" />
                          <span>Unverified Account</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 xxs:space-x-3 text-xs xxs:text-sm">
                    <User className="h-3 w-3 xxs:h-4 xxs:w-4" />
                    <span>{userData.authProvider === 'google' ? 'Google Account' : 'Email Account'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Forms */}
          <div className="lg:col-span-2 space-y-4 xxs:space-y-6 sm:space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 xxs:px-4 sm:px-6 lg:px-8 py-3 xxs:py-4 sm:py-6 border-b border-gray-200">
                <h3 className="text-base xxs:text-lg sm:text-xl font-bold text-gray-800 flex items-center space-x-2 xxs:space-x-3">
                  <User className="h-4 w-4 xxs:h-5 xxs:w-5 sm:h-6 sm:w-6 text-red-600" />
                  <span>Personal Information</span>
                </h3>
                <p className="text-gray-600 mt-1 xxs:mt-2 text-xs xxs:text-sm sm:text-base">Update your personal details</p>
              </div>
              
              <div className="p-3 xxs:p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xxs:gap-4 sm:gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-xs xxs:text-sm font-semibold text-gray-700 mb-2 xxs:mb-3">
                      First Name *
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleFieldChange('firstName', e.target.value)}
                          onFocus={() => setActiveField('firstName')}
                          onBlur={() => setActiveField(null)}
                          className={`w-full px-3 xxs:px-4 py-2 xxs:py-3 text-sm xxs:text-base border rounded-xl transition-all duration-200 ${
                            activeField === 'firstName' 
                              ? 'border-red-500 ring-2 ring-red-500/20' 
                              : validationErrors.firstName 
                                ? 'border-red-500' 
                                : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          }`}
                          placeholder="Enter your first name"
                        />
                        {validationErrors.firstName && (
                          <p className="text-red-500 text-xs xxs:text-sm mt-1">{validationErrors.firstName}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 xxs:space-x-3 px-3 xxs:px-4 py-2 xxs:py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <User className="h-4 w-4 xxs:h-5 xxs:w-5 text-gray-400" />
                        <span className="text-gray-700 font-medium text-sm xxs:text-base">{formData.firstName || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Name */}
                <div>
                  <label className="block text-xs xxs:text-sm font-semibold text-gray-700 mb-2 xxs:mb-3">
                      Last Name *
                  </label>
                  {isEditing ? (
                      <div className="relative">
                    <input
                      type="text"
                          value={formData.lastName}
                          onChange={(e) => handleFieldChange('lastName', e.target.value)}
                          onFocus={() => setActiveField('lastName')}
                          onBlur={() => setActiveField(null)}
                          className={`w-full px-3 xxs:px-4 py-2 xxs:py-3 text-sm xxs:text-base border rounded-xl transition-all duration-200 ${
                            activeField === 'lastName' 
                              ? 'border-red-500 ring-2 ring-red-500/20' 
                              : validationErrors.lastName 
                                ? 'border-red-500' 
                                : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          }`}
                          placeholder="Enter your last name"
                        />
                        {validationErrors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                        )}
                      </div>
                  ) : (
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                      <User className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700 font-medium">{formData.lastName || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Age
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) => handleFieldChange('age', e.target.value)}
                          onFocus={() => setActiveField('age')}
                          onBlur={() => setActiveField(null)}
                          min="1"
                          max="120"
                          className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                            activeField === 'age' 
                              ? 'border-red-500 ring-2 ring-red-500/20' 
                              : validationErrors.age 
                                ? 'border-red-500' 
                                : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          }`}
                          placeholder="Enter your age"
                        />
                        {validationErrors.age && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.age}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700 font-medium">{formData.age || 'Not set'}</span>
                    </div>
                  )}
                </div>

                  {/* Sex */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Sex
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.sex}
                        onChange={(e) => handleFieldChange('sex', e.target.value)}
                        onFocus={() => setActiveField('sex')}
                        onBlur={() => setActiveField(null)}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          activeField === 'sex' 
                            ? 'border-red-500 ring-2 ring-red-500/20' 
                            : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        }`}
                      >
                        <option value="">Select sex</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <UserCheck className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700 font-medium capitalize">{formData.sex || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  {/* Email (Read-only) */}
                  <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                    <Mail className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-700 font-medium">{formData.email}</span>
                    <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      Not Editable
                    </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 xxs:px-4 sm:px-6 lg:px-8 py-3 xxs:py-4 sm:py-6 border-b border-gray-200">
                <h3 className="text-base xxs:text-lg sm:text-xl font-bold text-gray-800 flex items-center space-x-2 xxs:space-x-3">
                  <Phone className="h-4 w-4 xxs:h-5 xxs:w-5 sm:h-6 sm:w-6 text-red-600" />
                  <span>Contact Information</span>
                </h3>
                <p className="text-gray-600 mt-1 xxs:mt-2 text-xs xxs:text-sm sm:text-base">Update your contact details</p>
              </div>
              
              <div className="p-3 xxs:p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xxs:gap-4 sm:gap-6">
                  {/* Telephone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Telephone
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="tel"
                          value={formData.telephone}
                          onChange={(e) => handleFieldChange('telephone', e.target.value)}
                          onFocus={() => setActiveField('telephone')}
                          onBlur={() => setActiveField(null)}
                          className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                            activeField === 'telephone' 
                              ? 'border-red-500 ring-2 ring-red-500/20' 
                              : validationErrors.telephone 
                                ? 'border-red-500' 
                                : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          }`}
                          placeholder="Enter your phone number"
                        />
                        {validationErrors.telephone && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.telephone}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700 font-medium">{formData.telephone || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Address
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <textarea
                          value={formData.address}
                          onChange={(e) => handleFieldChange('address', e.target.value)}
                          onFocus={() => setActiveField('address')}
                          onBlur={() => setActiveField(null)}
                          rows={3}
                          className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 resize-none ${
                            activeField === 'address' 
                              ? 'border-red-500 ring-2 ring-red-500/20' 
                              : validationErrors.address 
                                ? 'border-red-500' 
                                : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          }`}
                          placeholder="Enter your address"
                        />
                        {validationErrors.address && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                        <span className="text-gray-700 font-medium">{formData.address || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Country
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => handleFieldChange('country', e.target.value)}
                          onFocus={() => setActiveField('country')}
                          onBlur={() => setActiveField(null)}
                          className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                            activeField === 'country' 
                              ? 'border-red-500 ring-2 ring-red-500/20' 
                              : validationErrors.country 
                                ? 'border-red-500' 
                                : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          }`}
                          placeholder="Enter your country"
                        />
                        {validationErrors.country && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.country}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <Globe className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700 font-medium">{formData.country || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      City
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          onFocus={() => setActiveField('city')}
                          onBlur={() => setActiveField(null)}
                          className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                            activeField === 'city' 
                              ? 'border-red-500 ring-2 ring-red-500/20' 
                              : validationErrors.city 
                                ? 'border-red-500' 
                                : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          }`}
                          placeholder="Enter your city"
                        />
                        {validationErrors.city && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700 font-medium">{formData.city || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col xxs:flex-row space-y-3 xxs:space-y-0 xxs:space-x-3 sm:space-x-4 pt-4 xxs:pt-6">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 xxs:px-4 sm:px-6 py-2 xxs:py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:transform-none text-sm xxs:text-base"
                      >
                        {isSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 xxs:h-5 xxs:w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Save className="h-4 w-4 xxs:h-5 xxs:w-5" />
                        )}
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 px-3 xxs:px-4 sm:px-6 py-2 xxs:py-3 rounded-xl font-semibold transition-all duration-200 text-sm xxs:text-base"
                      >
                        <X className="h-4 w-4 xxs:h-5 xxs:w-5" />
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-900 text-white px-3 xxs:px-4 sm:px-6 py-2 xxs:py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm xxs:text-base"
                    >
                      <Edit3 className="h-4 w-4 xxs:h-5 xxs:w-5" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 xxs:px-4 sm:px-6 lg:px-8 py-3 xxs:py-4 sm:py-6 border-b border-gray-200">
                <h3 className="text-base xxs:text-lg sm:text-xl font-bold text-gray-800 flex items-center space-x-2 xxs:space-x-3">
                  <Shield className="h-4 w-4 xxs:h-5 xxs:w-5 sm:h-6 sm:w-6 text-red-600" />
                  <span>Security Settings</span>
                </h3>
                <p className="text-gray-600 mt-1 xxs:mt-2 text-xs xxs:text-sm sm:text-base">Change your password to keep your account secure</p>
              </div>
              
              <div className="p-3 xxs:p-4 sm:p-6 lg:p-8">
                {!showPasswordChange ? (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 xxs:px-4 sm:px-6 py-2 xxs:py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm xxs:text-base"
                  >
                    Change Password
                  </button>
                ) : (
                  <div className="space-y-3 xxs:space-y-4 sm:space-y-6">
                                          <div>
                        <label className="block text-xs xxs:text-sm font-semibold text-gray-700 mb-2 xxs:mb-3">
                          Current Password
                        </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-3 xxs:px-4 py-2 xxs:py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm xxs:text-base"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4 xxs:h-5 xxs:w-5" /> : <Eye className="h-4 w-4 xxs:h-5 xxs:w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 xxs:mb-3">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-3 xxs:px-4 py-2 xxs:py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm xxs:text-base"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4 xxs:h-5 xxs:w-5" /> : <Eye className="h-4 w-4 xxs:h-5 xxs:w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 xxs:mb-3">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-3 xxs:px-4 py-2 xxs:py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm xxs:text-base"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4 xxs:h-5 xxs:w-5" /> : <Eye className="h-4 w-4 xxs:h-5 xxs:w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col xxs:flex-row space-y-3 xxs:space-y-0 xxs:space-x-3 sm:space-x-4 pt-4 xxs:pt-6">
                      <button
                        onClick={handlePasswordChange}
                        className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 xxs:px-4 sm:px-6 py-2 xxs:py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm xxs:text-base"
                      >
                        <Save className="h-4 w-4 xxs:h-5 xxs:w-5" />
                        <span>Update Password</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 xxs:px-4 sm:px-6 py-2 xxs:py-3 rounded-xl font-semibold transition-all duration-200 text-sm xxs:text-base"
                      >
                        <X className="h-4 w-4 xxs:h-5 xxs:w-5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePage; 