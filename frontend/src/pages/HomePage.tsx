import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Star, Award, Zap, Target, TrendingUp } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import LoadingMessage from '../components/LoadingMessage';
import { useFeaturedCourses } from '../hooks/useCourses';
import { parseDurationToSeconds } from '../utils/durationFormatter';

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
const HomePage = () => {
  const { t } = useTranslation();
  console.log('🏠 HomePage component rendering');
  
  const [currentVariation, setCurrentVariation] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Use React Query for fetching featured courses
  const { data: featuredCourses = [], isLoading: loading, error } = useFeaturedCourses();

  // Hero variations with translations
  const heroVariations = [
    {
      id: 1,
      headline: t('home.hero_variations.variation1.headline'),
      subtext: t('home.hero_variations.variation1.subtext'),
      buttons: [
        { text: t('home.hero_variations.variation1.button1'), link: "/register", primary: true },
        { text: t('home.hero_variations.variation1.button2'), link: "/courses", primary: false }
      ],
      stats: t('home.hero_variations.variation1.stats'),
      backgroundImage: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2"
    },
    {
      id: 2,
      headline: t('home.hero_variations.variation2.headline'),
      subtext: t('home.hero_variations.variation2.subtext'),
      buttons: [
        { text: t('home.hero_variations.variation2.button1'), link: "/register", primary: true },
        { text: t('home.hero_variations.variation2.button2'), link: "/courses", primary: false }
      ],
      stats: t('home.hero_variations.variation2.stats'),
      backgroundImage: "https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2"
    },
    {
      id: 3,
      headline: t('home.hero_variations.variation3.headline'),
      subtext: t('home.hero_variations.variation3.subtext'),
      buttons: [
        { text: t('home.hero_variations.variation3.button1'), link: "/register", primary: true },
        { text: t('home.hero_variations.variation3.button2'), link: "/courses", primary: false }
      ],
      stats: t('home.hero_variations.variation3.stats'),
      backgroundImage: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2"
    },
    {
      id: 4,
      headline: t('home.hero_variations.variation4.headline'),
      subtext: t('home.hero_variations.variation4.subtext'),
      buttons: [
        { text: t('home.hero_variations.variation4.button1'), link: "/register", primary: true },
        { text: t('home.hero_variations.variation4.button2'), link: "/courses", primary: false }
      ],
      stats: t('home.hero_variations.variation4.stats'),
      backgroundImage: "https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2"
    }
  ];

  const testimonials = [
    {
      name: t('home.testimonials.jessica.name'),
      role: t('home.testimonials.jessica.role'),
      content: t('home.testimonials.jessica.content'),
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 5
    },
    {
      name: t('home.testimonials.david.name'),
      role: t('home.testimonials.david.role'),
      content: t('home.testimonials.david.content'),
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 5
    },
    {
      name: t('home.testimonials.maria.name'),
      role: t('home.testimonials.maria.role'),
      content: t('home.testimonials.maria.content'),
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 5
    }
  ];

  const benefits = [
    {
      icon: Target,
      title: t('home.benefits.targeted_learning.title'),
      description: t('home.benefits.targeted_learning.description')
    },
    {
      icon: Award,
      title: t('home.benefits.expert_instructors.title'),
      description: t('home.benefits.expert_instructors.description')
    },
    {
      icon: Zap,
      title: t('home.benefits.actionable_content.title'),
      description: t('home.benefits.actionable_content.description')
    },
    {
      icon: TrendingUp,
      title: t('home.benefits.proven_strategies.title'),
      description: t('home.benefits.proven_strategies.description')
    }
  ];

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

  // Log loading state changes
  useEffect(() => {
    if (loading) {
      console.log('🔄 HomePage loading featured courses');
    } else if (error) {
      console.error('❌ HomePage load error:', error);
    } else {
      console.log('✅ HomePage featured courses loaded:', featuredCourses.length);
    }
  }, [loading, error, featuredCourses.length]);

  const featuredGrid = useMemo(() => {
    console.log('🎨 HomePage featuredGrid rendering with:');
    console.log(`   - Loading: ${loading}`);
    console.log(`   - Featured courses count: ${featuredCourses.length}`);
    
    if (loading) {
      console.log('⏳ HomePage rendering loading state');
      return (
        <div>
          <LoadingMessage 
            message={t('home.loading_featured_courses', 'Loading featured courses, please wait...')}
            className="mb-8"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl shadow p-6 h-64 sm:h-72" />
            ))}
          </div>
        </div>
      );
    }
    
    if (error) {
      console.log('❌ HomePage rendering error state');
      return (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <p className="text-lg font-medium">{t('home.error_loading_courses', 'Failed to load courses')}</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        </div>
      );
    }
    
    if (!featuredCourses.length) {
      console.log('📭 HomePage rendering empty state');
      return (
        <div className="text-gray-500 text-center px-4 py-12">
          <p className="text-lg">{t('home.no_courses_available', 'No courses yet. Check back soon.')}</p>
        </div>
      );
    }
    
    // Rendering featured course cards
    console.log('✅ HomePage rendering featured course cards');
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {featuredCourses.map((c) => {
          // Using the centralized parseDurationToSeconds utility
          const totalSeconds = (c.videos || []).reduce((acc, v) => acc + parseDurationToSeconds(v.duration), 0);
          return (
          <CourseCard
            key={c._id}
            id={c._id}
            title={c.title}
            description={c.description}
            thumbnail={c.thumbnailURL || ''}
            price={c.price}
            duration={`${totalSeconds}`}
            students={c.totalEnrollments || 0}
            lessons={(c.videos || []).length}
            instructor={t('brand.name')}
            tags={c.tags || []}
          />
        );})}
      </div>
    );
  }, [featuredCourses, loading, error, t]);

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
                <span key={index} className="inline-block mr-2">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-pulse">
                    {word}
                  </span>
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
              {t('home.featured_courses_title')}
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              {t('home.featured_courses_subtitle')}
            </p>
          </div>
          {featuredGrid}
          <div className="text-center mt-8 sm:mt-12">
            <Link
              to="/courses"
              className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span>{t('home.view_all_courses')}</span>
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
              {t('home.why_choose_title')}
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              {t('home.why_choose_subtitle')}
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

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-red-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              {t('home.faq.title')}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              {t('home.faq.subtitle')}
            </p>
          </div>
          
          <div className="space-y-6 sm:space-y-8">
            {[
              {
                question: t('home.faq.questions.get_started.question'),
                answer: t('home.faq.questions.get_started.answer')
              },
              {
                question: t('home.faq.questions.final_purchases.question'),
                answer: t('home.faq.questions.final_purchases.answer')
              },
              {
                question: t('home.faq.questions.mobile.question'),
                answer: t('home.faq.questions.mobile.answer')
              }
            ].map((faq, index) => (
              <div 
                key={index}
                className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 group-hover:text-red-600 transition-colors duration-300 flex items-center">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 mr-3 text-red-500 group-hover:scale-110 transition-transform duration-300" />
                  {faq.question}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed pl-8 sm:pl-9 group-hover:text-gray-700 transition-colors duration-300">
                  {faq.answer}
                </p>
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
              {t('home.success_stories_title')}
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              {t('home.success_stories_subtitle')}
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
            {t('home.cta_title')}
          </h2>
          <p className="text-sm sm:text-base md:text-xl mb-6 sm:mb-8 text-red-100 px-4">
            {t('home.cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-red-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base md:text-lg hover:bg-red-50 transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              {t('home.cta_button')}
            </Link>
            <Link
              to="/courses"
              className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base md:text-lg hover:bg-white hover:text-red-600 transition-all duration-300 transform hover:scale-105"
            >
              {t('home.view_all_courses')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;