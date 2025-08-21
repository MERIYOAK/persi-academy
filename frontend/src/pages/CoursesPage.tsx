import React, { useEffect, useMemo, useState, useCallback } from 'react';
import CourseCard from '../components/CourseCard';
import { Search, Filter, X } from 'lucide-react';
import { buildApiUrl } from '../config/environment';

interface ApiCourse {
  _id: string;
  title: string;
  description: string;
  thumbnailURL?: string;
  price: number;
  category?: string;
  level?: string;
  totalEnrollments?: number;
  tags?: string[];
  videos?: Array<{ _id: string; duration?: string }>
}

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [hasFilteredData, setHasFilteredData] = useState<boolean>(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Check if user is authenticated - immediate check
  useEffect(() => {
    const token = localStorage.getItem('token');
    setUserToken(token);
    console.log('🔍 [CoursesPage] Authentication check:', {
      hasToken: !!token,
      tokenLength: token?.length || 0
    });
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setHasFilteredData(false); // Reset filtered data flag
      
      // Get token directly from localStorage to avoid timing issues
      const token = localStorage.getItem('token');
      
      console.log('🔍 [CoursesPage] Fetching courses...');
      console.log(`   - User token: ${token ? 'Present' : 'Not present'}`);
      
      // Include authentication token if available
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(buildApiUrl('/api/courses'), {
        headers
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load courses');
      }
      
      const data = await res.json();
      
      console.log('📊 [CoursesPage] API response received:', {
        isArray: Array.isArray(data),
        dataLength: Array.isArray(data) ? data.length : 'N/A',
        hasDataProperty: !!(data && data.data),
        hasCoursesProperty: !!(data && data.data && data.data.courses)
      });
      
      // Check if data has the expected structure
      let coursesData: ApiCourse[] = [];
      if (Array.isArray(data)) {
        coursesData = data as ApiCourse[];
      } else if (data.data && Array.isArray(data.data.courses)) {
        coursesData = data.data.courses as ApiCourse[];
      } else if (data.success && data.data && Array.isArray(data.data.courses)) {
        coursesData = data.data.courses as ApiCourse[];
      } else {
        coursesData = [];
      }
      
      console.log(`✅ [CoursesPage] Processed ${coursesData.length} courses`);
      console.log('📋 [CoursesPage] Course titles:', coursesData.map(c => c.title));
      
      setCourses(coursesData);
      setHasFilteredData(true); // Mark that filtered data is ready
      
    } catch (e) {
      console.error('❌ [CoursesPage] Error fetching courses:', e);
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []); // Remove userToken dependency since we get it directly

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    const onCreated = () => {
      fetchCourses();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCourses();
      }
    };
    window.addEventListener('course:created', onCreated as EventListener);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('course:created', onCreated as EventListener);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchCourses]);

  // Filter courses based on search and filter criteria
  const filteredCourses = useMemo(() => {
    console.log('🔍 [CoursesPage] Filtering courses...');
    console.log(`   - Total courses: ${courses.length}`);
    console.log(`   - Search term: "${searchTerm}"`);
    console.log(`   - Category filter: "${selectedCategory}"`);
    console.log(`   - Level filter: "${selectedLevel}"`);
    console.log(`   - Price range: "${priceRange}"`);
    
    const filtered = courses.filter(course => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.tags && course.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ));

      // Category filter
      const matchesCategory = selectedCategory === '' || course.category === selectedCategory;

      // Level filter
      const matchesLevel = selectedLevel === '' || course.level === selectedLevel;

      // Tag filter
      const matchesTag = selectedTag === '' || (course.tags && course.tags.includes(selectedTag));

      // Price range filter
      let matchesPrice = true;
      if (priceRange !== '') {
        const price = course.price;
        switch (priceRange) {
          case 'free':
            matchesPrice = price === 0;
            break;
          case 'under-50':
            matchesPrice = price > 0 && price < 50;
            break;
          case '50-100':
            matchesPrice = price >= 50 && price <= 100;
            break;
          case 'over-100':
            matchesPrice = price > 100;
            break;
        }
      }

      const matches = matchesSearch && matchesCategory && matchesLevel && matchesTag && matchesPrice;
      
      if (!matches) {
        console.log(`   ❌ Course "${course.title}" filtered out:`, {
          matchesSearch,
          matchesCategory,
          matchesLevel,
          matchesPrice
        });
      }

      return matches;
    });
    
    console.log(`✅ [CoursesPage] Filtered to ${filtered.length} courses`);
    console.log('📋 [CoursesPage] Filtered course titles:', filtered.map(c => c.title));
    
    return filtered;
  }, [courses, searchTerm, selectedCategory, selectedLevel, selectedTag, priceRange]);

  // Get unique categories and levels for dropdowns
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(courses.map(course => course.category).filter(Boolean))];
    return uniqueCategories.sort();
  }, [courses]);

  const levels = useMemo(() => {
    const uniqueLevels = [...new Set(courses.map(course => course.level).filter(Boolean))];
    return uniqueLevels.sort();
  }, [courses]);

  const tags = useMemo(() => {
    const allTags = courses.flatMap(course => course.tags || []);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.sort();
  }, [courses]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedTag('');
    setPriceRange('');
  };

  // Handle purchase success
  const handlePurchaseSuccess = useCallback(() => {
    // Refresh purchase status after successful purchase
    // This function is no longer needed as purchase status is handled by backend
  }, []);

  const content = useMemo(() => {
    console.log('🔍 [CoursesPage] Rendering content...');
    console.log(`   - Loading: ${loading}`);
    console.log(`   - Error: ${error}`);
    console.log(`   - Total courses: ${courses.length}`);
    console.log(`   - Filtered courses: ${filteredCourses.length}`);
    
    if (loading || !hasFilteredData) {
      console.log('🔍 [CoursesPage] Showing loading skeleton...', { loading, hasFilteredData });
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xxs:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl shadow p-4 xxs:p-6 h-64 xxs:h-72" />
          ))}
        </div>
      );
    }
    
    if (error) {
      console.log('🔍 [CoursesPage] Showing error state...');
      return (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 xxs:p-4 text-sm xxs:text-base">
          {error}
        </div>
      );
    }
    
    if (!filteredCourses.length) {
      console.log('🔍 [CoursesPage] Showing empty state...');
      return (
        <div className="text-center text-gray-500 py-12 xxs:py-20 text-sm xxs:text-base">
          {courses.length === 0 ? 'No courses available yet. Check back soon.' : 'No courses match your search criteria.'}
        </div>
      );
    }
    
    console.log('🔍 [CoursesPage] Rendering course grid...');
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xxs:gap-6 sm:gap-8">
        {filteredCourses.map((c) => (
          <CourseCard
            key={c._id}
            id={c._id}
            title={c.title}
            description={c.description}
            thumbnail={c.thumbnailURL || ''}
            price={c.price}
            duration={`${c.videos?.length || 0} lessons`}
            students={c.totalEnrollments || 0}

            instructor={'YT Academy'}
            tags={c.tags || []}
            onPurchaseSuccess={handlePurchaseSuccess}
          />
        ))}
      </div>
    );
  }, [filteredCourses, loading, error, courses.length, handlePurchaseSuccess]);

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20 xxs:pt-24 pb-6 sm:pb-8 xxs:pb-12">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 xxs:px-4 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 xxs:mb-12">
          <h1 className="text-xl sm:text-2xl xxs:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 xxs:mb-4">
            All Courses
          </h1>
          <p className="text-sm sm:text-base xxs:text-lg lg:text-xl text-gray-600">
            Master YouTube with our comprehensive courses
          </p>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="mb-6 sm:mb-8 xxs:mb-12">
          {/* Main Search Bar */}
          <div className="relative mb-3 sm:mb-4 xxs:mb-6">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 xxs:pl-4 flex items-center pointer-events-none">
              <Search className="h-3 w-3 sm:h-4 sm:w-4 xxs:h-5 xxs:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for courses, skills, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-8 sm:pl-10 xxs:pl-12 pr-4 py-1.5 sm:py-2 xxs:py-3 lg:py-4 text-xs sm:text-sm xxs:text-lg border-2 border-gray-200 rounded-lg sm:rounded-xl xxs:rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2 sm:pr-3 xxs:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 xxs:h-5 xxs:w-5" />
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Filter Header */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-2 sm:px-3 xxs:px-4 lg:px-6 py-1.5 sm:py-2 xxs:py-3 lg:py-4 border-b border-gray-100">
              <div className="flex flex-col xxs:flex-row xxs:items-center xxs:justify-between space-y-1.5 sm:space-y-2 xxs:space-y-3 lg:space-y-0">
                <div className="flex items-center space-x-1 sm:space-x-2 xxs:space-x-3">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 xxs:h-5 xxs:w-5 text-red-600" />
                  <h3 className="text-xs sm:text-sm xxs:text-base lg:text-lg font-semibold text-gray-900">Advanced Filters</h3>
                  {(searchTerm || selectedCategory || selectedLevel || selectedTag || priceRange) && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-1 sm:px-1.5 xxs:px-2 lg:px-2.5 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 xxs:space-x-3">
                  {(searchTerm || selectedCategory || selectedLevel || selectedTag || priceRange) && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center space-x-1 xxs:space-x-2 px-1 sm:px-1.5 xxs:px-2 lg:px-3 py-0.5 xxs:py-1 lg:py-1.5 text-xs xxs:text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <X className="h-3 w-3 xxs:h-4 xxs:w-4" />
                      <span>Clear all</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-1 xxs:space-x-2 px-1.5 sm:px-2 xxs:px-3 lg:px-4 py-0.5 xxs:py-1 lg:py-1.5 xxs:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm text-xs xxs:text-sm"
                  >
                    <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="p-2 sm:p-3 xxs:p-4 lg:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 xxs:gap-4 lg:gap-6">
                  {/* Category Filter */}
                  <div className="space-y-1 sm:space-y-2">
                    <label className="block text-xs xxs:text-sm font-semibold text-gray-700">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-1.5 sm:px-2 xxs:px-3 lg:px-4 py-1 sm:py-1.5 xxs:py-2 lg:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-200 appearance-none bg-white text-xs sm:text-sm xxs:text-base"
                      >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2 xxs:pr-3 lg:pr-3 pointer-events-none">
                        <svg className="h-3 w-3 sm:h-4 sm:w-4 xxs:h-5 xxs:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Level Filter */}
                  <div className="space-y-1 sm:space-y-2">
                    <label className="block text-xs xxs:text-sm font-semibold text-gray-700">
                      Skill Level
                    </label>
                    <div className="relative">
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-full px-1.5 sm:px-2 xxs:px-3 lg:px-4 py-1 sm:py-1.5 xxs:py-2 lg:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-200 appearance-none bg-white text-xs sm:text-sm xxs:text-base"
                      >
                        <option value="">All Levels</option>
                        {levels.map(level => (
                          <option key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-4 w-4 xxs:h-5 xxs:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Tag Filter */}
                  <div className="space-y-1 sm:space-y-2">
                    <label className="block text-xs xxs:text-sm font-semibold text-gray-700">
                      Tags
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                        className="w-full px-1.5 sm:px-2 xxs:px-3 lg:px-4 py-1 sm:py-1.5 xxs:py-2 lg:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-200 appearance-none bg-white text-xs sm:text-sm xxs:text-base"
                      >
                        <option value="">All Tags</option>
                        {tags.map(tag => (
                          <option key={tag} value={tag}>
                            #{tag}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2 xxs:pr-3 lg:pr-3 pointer-events-none">
                        <svg className="h-3 w-3 sm:h-4 sm:w-4 xxs:h-5 xxs:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-1 sm:space-y-2 sm:col-span-2 md:col-span-1">
                    <label className="block text-xs xxs:text-sm font-semibold text-gray-700">
                      Price Range
                    </label>
                    <div className="relative">
                      <select
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                        className="w-full px-1.5 sm:px-2 xxs:px-3 lg:px-4 py-1 sm:py-1.5 xxs:py-2 lg:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-200 appearance-none bg-white text-xs sm:text-sm xxs:text-base"
                      >
                        <option value="">All Prices</option>
                        <option value="free">Free Courses</option>
                        <option value="under-50">Under $50</option>
                        <option value="50-100">$50 - $100</option>
                        <option value="over-100">Over $100</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2 xxs:pr-3 lg:pr-3 pointer-events-none">
                        <svg className="h-3 w-3 sm:h-4 sm:w-4 xxs:h-5 xxs:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mt-3 sm:mt-4 xxs:mt-6 flex flex-col xxs:flex-row xxs:items-center xxs:justify-between space-y-1.5 sm:space-y-2 xxs:space-y-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2 xxs:space-x-4">
              <div className="text-xs xxs:text-sm text-gray-600">
                {loading ? (
                  <span>Loading courses...</span>
                ) : (
                  <>
                    <span className="font-semibold text-gray-900">{filteredCourses.length}</span> of <span className="font-semibold text-gray-900">{courses.length}</span> courses
                  </>
                )}
              </div>
              {(searchTerm || selectedCategory || selectedLevel || selectedTag || priceRange) && (
                <div className="flex flex-col xxs:flex-row xxs:items-center space-y-1 xxs:space-y-0 xxs:space-x-2">
                  <span className="text-xs xxs:text-sm text-gray-500">Filtered by:</span>
                  <div className="flex flex-wrap gap-1 xxs:gap-2">
                    {searchTerm && (
                      <span className="inline-flex items-center px-1.5 sm:px-2 xxs:px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        "{searchTerm}"
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="inline-flex items-center px-1.5 sm:px-2 xxs:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {selectedCategory}
                      </span>
                    )}
                    {selectedLevel && (
                      <span className="inline-flex items-center px-1.5 sm:px-2 xxs:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {selectedLevel}
                      </span>
                    )}
                    {selectedTag && (
                      <span className="inline-flex items-center px-1.5 sm:px-2 xxs:px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        #{selectedTag}
                      </span>
                    )}
                    {priceRange && (
                      <span className="inline-flex items-center px-1.5 sm:px-2 xxs:px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {priceRange === 'free' ? 'Free' : 
                         priceRange === 'under-50' ? 'Under $50' :
                         priceRange === '50-100' ? '$50-$100' : 'Over $100'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {content}
      </div>
    </div>
  );
};

export default CoursesPage; 