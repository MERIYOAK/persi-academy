import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Award, Zap, Target, TrendingUp } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { buildApiUrl } from '../config/environment';

interface ApiCourse {
  _id: string;
  title: string;
  description: string;
  thumbnailURL?: string;
  price: number;
  totalEnrollments?: number;
  tags?: string[];
  videos?: Array<{ _id: string }>
}

// Hero section data with rotating variations
const heroVariations = [
  {
    id: 1,
    headline: "Master YouTube Success",
    subtext: "Transform your passion into profit with our comprehensive video courses. Learn from creators who've built million-subscriber channels.",
    buttons: [
      { text: "Start Learning Today", link: "/register", primary: true },
      { text: "Browse Courses", link: "/courses", primary: false }
    ],
    stats: "10,000+ Students • 50+ Hours of Content • 4.9★ Rating",
    backgroundImage: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2"
  },
  {
    id: 2,
    headline: "Turn Views Into Income",
    subtext: "Discover proven strategies to grow, monetize, and scale your channel with step-by-step lessons from industry experts.",
    buttons: [
      { text: "Get Started Free", link: "/register", primary: true },
      { text: "Explore Courses", link: "/courses", primary: false }
    ],
    stats: "Trusted by Creators Worldwide • 95% Satisfaction Rate",
    backgroundImage: "https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2"
  },
  {
    id: 3,
    headline: "From Beginner to YouTube Pro",
    subtext: "No experience? No problem. Our structured courses take you from zero to building a thriving channel with a loyal audience.",
    buttons: [
      { text: "Start Your Journey", link: "/register", primary: true },
      { text: "See How It Works", link: "/courses", primary: false }
    ],
    stats: "20+ Expert Instructors • Global Community of Learners",
    backgroundImage: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2"
  },
  {
    id: 4,
    headline: "Learn. Create. Grow.",
    subtext: "Access powerful lessons on content creation, video editing, audience building, and monetization—all in one platform.",
    buttons: [
      { text: "Join for Free", link: "/register", primary: true },
      { text: "Browse Library", link: "/courses", primary: false }
    ],
    stats: "Continuous Updates • Lifetime Access to Materials",
    backgroundImage: "https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2"
  }
];

const benefits = [
  {
    icon: Target,
    title: 'Targeted Learning',
    description: 'Focus on specific YouTube strategies that drive real results for your channel.'
  },
  {
    icon: Award,
    title: 'Expert Instructors',
    description: 'Learn from successful YouTube creators with millions of views and subscribers.'
  },
  {
    icon: Zap,
    title: 'Actionable Content',
    description: 'Every lesson comes with practical steps you can implement immediately.'
  },
  {
    icon: TrendingUp,
    title: 'Proven Strategies',
    description: 'Techniques tested and refined by top YouTube creators across all niches.'
  }
];

const testimonials = [
  {
    name: 'Jessica Thompson',
    role: 'Beauty YouTuber',
    content: 'These courses transformed my channel from 500 to 50K subscribers in just 6 months!',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    rating: 5
  },
  {
    name: 'David Park',
    role: 'Tech Reviewer',
    content: 'The monetization strategies alone paid for the entire course within the first month.',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    rating: 5
  },
  {
    name: 'Maria Garcia',
    role: 'Lifestyle Creator',
    content: 'Finally, a course that actually delivers on its promises. My engagement rates doubled!',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    rating: 5
  }
];

const HomePage = () => {
  console.log('🏠 HomePage component rendering');
  
  const [recent, setRecent] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentVariation, setCurrentVariation] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-rotate hero variations
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentVariation((prev) => (prev + 1) % heroVariations.length);
        setIsTransitioning(false);
      }, 300); // Half of the transition duration
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      console.log('🔄 HomePage loading featured courses');
      try {
        setLoading(true);
        
        // Get authentication token if available
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('🔐 HomePage using authentication token');
        } else {
          console.log('🔓 HomePage no authentication token found');
        }
        
    console.log('📡 Making API request to:', buildApiUrl('/api/courses'));
    const res = await fetch(buildApiUrl('/api/courses'), {
          headers
        });
        
        console.log(`📊 HomePage API Response status: ${res.status}`);
        console.log(`📊 HomePage API Response ok: ${res.ok}`);
        
        const data = await res.json();
        console.log('📦 HomePage Raw API response data:', data);
        
        let coursesData: ApiCourse[] = [];
        
        if (Array.isArray(data)) {
          console.log(`✅ HomePage received ${data.length} courses from API`);
          coursesData = data;
        } else if (data.data && Array.isArray(data.data.courses)) {
          console.log(`✅ HomePage received ${data.data.courses.length} courses from enhanced API`);
          coursesData = data.data.courses;
        } else {
          console.error('❌ HomePage unexpected API response structure:', data);
          coursesData = [];
        }
        
        const featuredCourses = coursesData.slice(0, 3);
        console.log(`🎯 HomePage setting ${featuredCourses.length} featured courses:`);
        featuredCourses.forEach((course, index) => {
          console.log(`   Featured ${index + 1}: "${course.title}"`);
          console.log(`     - ID: ${course._id}`);
          console.log(`     - Thumbnail URL: ${course.thumbnailURL || 'NULL/EMPTY'}`);
          console.log(`     - Price: ${course.price}`);
        });
        
        setRecent(featuredCourses);
      } catch (error) {
        console.error('❌ HomePage load error:', error);
        setRecent([]);
      } finally {
        setLoading(false);
        console.log('🏁 HomePage load completed');
      }
    };
    load();
  }, []);

  const featuredGrid = useMemo(() => {
    console.log('🎨 HomePage featuredGrid rendering with:');
    console.log(`   - Loading: ${loading}`);
    console.log(`   - Recent courses count: ${recent.length}`);
    
    if (loading) {
      console.log('⏳ HomePage rendering loading skeleton');
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl shadow p-6 h-64 sm:h-72" />
          ))}
        </div>
      );
    }
    if (!recent.length) {
      console.log('📭 HomePage rendering empty state');
      return (
        <div className="text-gray-500 text-center px-4">No courses yet. Check back soon.</div>
      );
    }
    
    console.log('🎯 HomePage rendering featured course cards:');
    recent.forEach((course, index) => {
      console.log(`   Featured Card ${index + 1}: "${course.title}"`);
      console.log(`     - Passing thumbnail: ${course.thumbnailURL || 'EMPTY'}`);
    });
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {recent.map((c) => (
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
          />
        ))}
      </div>
    );
  }, [recent, loading]);

  const currentHero = heroVariations[currentVariation];

  return (
    <div>
      {/* Enhanced Hero Section - Mobile Responsive */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-600 ease-in-out"
          style={{
            backgroundImage: `url(${currentHero.backgroundImage})`,
            transform: isTransitioning ? 'scale(1.05)' : 'scale(1)'
          }}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-red-900/50"></div>
        
        {/* Floating Elements - Hidden on very small screens */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse hidden sm:block"></div>
          <div className="absolute top-20 right-10 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 hidden sm:block"></div>
          <div className="absolute -bottom-8 left-20 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-red-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 hidden sm:block"></div>
        </div>
        
        {/* Content */}
        <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center text-white z-10">
          <div className={`transition-all duration-600 ease-in-out ${isTransitioning ? 'opacity-0 transform translate-y-8' : 'opacity-100 transform translate-y-0'}`}>
            {/* Headline - Responsive text sizes */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 leading-tight animate-fade-in-up px-2">
              {currentHero.headline.split(' ').map((word, index) => (
                <span key={index} className="inline-block">
                  {word === 'YouTube' ? (
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-pulse">
                      {word}
                    </span>
                  ) : (
                    word
                  )}
                  {index < currentHero.headline.split(' ').length - 1 && ' '}
                </span>
              ))}
            </h1>
            
            {/* Subtext - Responsive text sizes */}
            <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl mb-6 sm:mb-8 text-gray-200 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200 px-3">
              {currentHero.subtext}
            </p>
            
            {/* Buttons - Stacked on mobile, side by side on larger screens */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 animate-fade-in-up animation-delay-400 px-4">
              {currentHero.buttons.map((button, index) => (
                <Link
                  key={index}
                  to={button.link}
                  className={`group relative px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base md:text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl overflow-hidden w-full sm:w-auto ${
                    button.primary 
                      ? 'bg-white text-red-600 hover:bg-red-50' 
                      : 'border-2 border-white text-white hover:bg-white hover:text-red-600'
                  }`}
                >
                  {/* Glowing border effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
                  
                  <span className="relative flex items-center justify-center sm:justify-start space-x-2">
                    <span>{button.text}</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
            
            {/* Stats - Responsive text sizes */}
            <div className="animate-fade-in-up animation-delay-600 px-4">
              <div className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 font-medium leading-relaxed">
                {currentHero.stats}
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Dots - Responsive positioning */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 z-20">
          {heroVariations.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentVariation(index);
                  setIsTransitioning(false);
                }, 300);
              }}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                index === currentVariation 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              Featured Courses
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Our most popular courses, designed to accelerate your YouTube journey
            </p>
          </div>
          {featuredGrid}
          <div className="text-center mt-8 sm:mt-12">
            <Link
              to="/courses"
              className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span>View All Courses</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-red-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              Why Choose YT Academy?
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              We're not just another course platform. We're your partner in YouTube success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center"
              >
                <div className="bg-red-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <benefit.icon className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">{benefit.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              Success Stories
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Hear from creators who transformed their channels with our courses
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-red-50 to-pink-50 p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-3 sm:mr-4"
                  />
                  <div>
                    <div className="font-bold text-gray-800 text-sm sm:text-base">{testimonial.name}</div>
                    <div className="text-gray-600 text-xs sm:text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-3 sm:px-4 md:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Ready to Transform Your YouTube Channel?
          </h2>
          <p className="text-sm sm:text-base md:text-xl mb-6 sm:mb-8 text-red-100 px-4">
            Join thousands of creators who've already accelerated their growth with our proven strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-red-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base md:text-lg hover:bg-red-50 transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Get Started Now
            </Link>
            <Link
              to="/courses"
              className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base md:text-lg hover:bg-white hover:text-red-600 transition-all duration-300 transform hover:scale-105"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;