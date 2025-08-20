import React, { useState, useMemo, useEffect } from 'react';
import { buildApiUrl } from '../config/environment';

import { Link, useNavigate } from 'react-router-dom';
import { Clock, Users, Star, Play, ShoppingCart, CheckCircle, Loader } from 'lucide-react';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  duration: string;
  students: number;
  rating: number;
  instructor: string;
  className?: string;
  onPurchaseSuccess?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  description,
  thumbnail,
  price,
  duration,
  students,
  rating,
  instructor,
  className = '',
  onPurchaseSuccess
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  console.log(`🖼️ CourseCard rendering for course: "${title}"`);
  console.log(`   - Course ID: ${id}`);
  console.log(`   - Price: $${price}`);
  console.log(`   - Thumbnail URL: ${thumbnail || 'NULL/EMPTY'}`);

  const placeholderThumb = useMemo(
    () =>
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect fill='#f3f4f6' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='#9ca3af'>Course Thumbnail</text></svg>"
      ),
    []
  );

  const [imgSrc, setImgSrc] = useState<string>(thumbnail || placeholderThumb);
  const [imgLoading, setImgLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);

  // Debug effect to track image source changes
  useEffect(() => {
    console.log(`🔄 CourseCard image source changed for "${title}":`);
    console.log(`   - New imgSrc: ${imgSrc}`);
    console.log(`   - Is placeholder: ${imgSrc === placeholderThumb}`);
    console.log(`   - Loading state: ${imgLoading}`);
    console.log(`   - Error state: ${imgError}`);
  }, [imgSrc, imgLoading, imgError, title, placeholderThumb]);

  const handleImageLoad = () => {
    console.log(`✅ Image loaded successfully for "${title}"`);
    console.log(`   - Final image source: ${imgSrc}`);
    setImgLoading(false);
    setImgError(false);
  };

  const handleImageError = () => {
    console.error(`❌ Image failed to load for "${title}"`);
    console.error(`   - Failed URL: ${imgSrc}`);
    console.error(`   - Falling back to placeholder`);
    setImgSrc(placeholderThumb);
    setImgLoading(false);
    setImgError(true);
  };

  const handleBuyClick = async () => {
    try {
      setIsLoading(true);
      setPurchaseStatus('loading');
      setErrorMessage('');

      console.log(`🔧 Initiating purchase for course: ${title} (${id})`);

      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No authentication token found');
        navigate('/login');
        return;
      }

      // Create checkout session
      const response = await fetch(buildApiUrl('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      console.log(`✅ Checkout session created: ${data.sessionId}`);
      console.log(`   - Redirect URL: ${data.url}`);

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (error) {
      console.error('❌ Purchase error:', error);
      setPurchaseStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Purchase failed');
      
      // Reset error after 5 seconds
      setTimeout(() => {
        setPurchaseStatus('idle');
        setErrorMessage('');
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const renderActionButton = () => {
    if (purchaseStatus === 'loading' || isLoading) {
      return (
        <button
          disabled
          className="w-full bg-gray-400 text-white font-semibold py-2 xxs:py-3 px-4 xxs:px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 xxs:space-x-2 cursor-not-allowed text-sm xxs:text-base"
        >
          <Loader className="h-4 w-4 xxs:h-5 xxs:w-5 animate-spin" />
          <span>Processing...</span>
        </button>
      );
    }

    if (purchaseStatus === 'error') {
      return (
        <div className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 xxs:py-3 px-4 xxs:px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 xxs:space-x-2 text-sm xxs:text-base">
          <span>Error: {errorMessage}</span>
        </div>
      );
    }

    return (
      <button
        onClick={handleBuyClick}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 xxs:py-3 px-4 xxs:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-1 xxs:space-x-2 text-sm xxs:text-base"
      >
        <ShoppingCart className="h-4 w-4 xxs:h-5 xxs:w-5" />
        <span>Buy Now - ${price}</span>
      </button>
    );
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group flex flex-col ${className}`}>
      <div className="relative overflow-hidden h-36 xxs:h-40 sm:h-48">
        {imgLoading && (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <div className="text-gray-500 text-sm xxs:text-base">Loading...</div>
          </div>
        )}
        <img
          src={imgSrc}
          onLoad={handleImageLoad}
          onError={handleImageError}
          alt={title}
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${imgLoading ? 'hidden' : ''}`}
          style={{ display: imgLoading ? 'none' : 'block' }}
        />
        {imgError && (
          <div className="absolute top-2 left-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
            Image Error
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white rounded-full p-2 xxs:p-3 shadow-lg">
              <Play className="h-5 w-5 xxs:h-6 xxs:w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="absolute top-3 xxs:top-4 right-3 xxs:right-4">
          <span className="bg-red-600 text-white px-2 xxs:px-3 py-1 rounded-full text-xs xxs:text-sm font-semibold">
            ${price}
          </span>
        </div>
      </div>

      <div className="p-4 xxs:p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 xxs:h-4 xxs:w-4 text-yellow-400 fill-current" />
            <span className="text-xs xxs:text-sm text-gray-600">{rating}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-500 text-xs xxs:text-sm">
            <Users className="h-3 w-3 xxs:h-4 xxs:w-4" />
            <span>{students.toLocaleString()}</span>
          </div>
        </div>

        <h3 className="text-base xxs:text-lg sm:text-xl font-bold text-gray-800 mb-2 line-clamp-2 h-12 xxs:h-14 sm:h-16 group-hover:text-red-600 transition-colors duration-300">
          {title}
        </h3>

        <p className="text-gray-600 text-xs xxs:text-sm mb-3 xxs:mb-4 line-clamp-3 flex-grow">
          {description}
        </p>

        <div className="flex items-center justify-between mb-3 xxs:mb-4">
          <div className="flex items-center space-x-1 text-gray-500 text-xs xxs:text-sm">
            <Clock className="h-3 w-3 xxs:h-4 xxs:w-4" />
            <span>{duration}</span>
          </div>
          <span className="text-xs xxs:text-sm text-gray-500">by {instructor}</span>
        </div>

        <div className="space-y-2 xxs:space-y-3">
          {renderActionButton()}
          
          <Link
            to={`/course/${id}`}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 xxs:py-3 px-4 xxs:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md text-center block text-sm xxs:text-base"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;