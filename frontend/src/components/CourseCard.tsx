import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Star, Play } from 'lucide-react';

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
  className = ''
}) => {
  console.log(`🖼️ CourseCard rendering for course: "${title}"`);
  console.log(`   - Course ID: ${id}`);
  console.log(`   - Thumbnail URL: ${thumbnail || 'NULL/EMPTY'}`);
  console.log(`   - Thumbnail type: ${typeof thumbnail}`);
  console.log(`   - Thumbnail length: ${thumbnail ? thumbnail.length : 0}`);

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

  return (
    <div className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group flex flex-col ${className}`}>
      <div className="relative overflow-hidden h-48">
        {imgLoading && (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
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
            <div className="bg-white rounded-full p-3 shadow-lg">
              <Play className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            ${price}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{rating}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-500 text-sm">
            <Users className="h-4 w-4" />
            <span>{students.toLocaleString()}</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 h-16 group-hover:text-red-600 transition-colors duration-300">
          {title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
          {description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 text-gray-500 text-sm">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <span className="text-sm text-gray-500">by {instructor}</span>
        </div>

        <Link
          to={`/course/${id}`}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-center block mt-auto"
        >
          View Course
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;