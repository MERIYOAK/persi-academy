import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Award, Zap, Target, TrendingUp } from 'lucide-react';
import CourseCard from '../components/CourseCard';

interface ApiCourse {
  _id: string;
  title: string;
  description: string;
  thumbnailURL?: string;
  price: number;
  videos?: Array<{ _id: string }>
}

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

  useEffect(() => {
    const load = async () => {
      console.log('🔄 HomePage loading featured courses');
      try {
        setLoading(true);
        console.log('📡 Making API request to: http://localhost:5000/api/courses');
        const res = await fetch('http://localhost:5000/api/courses');
        
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl shadow p-6 h-72" />
          ))}
        </div>
      );
    }
    if (!recent.length) {
      console.log('📭 HomePage rendering empty state');
      return (
        <div className="text-gray-500">No courses yet. Check back soon.</div>
      );
    }
    
    console.log('🎯 HomePage rendering featured course cards:');
    recent.forEach((course, index) => {
      console.log(`   Featured Card ${index + 1}: "${course.title}"`);
      console.log(`     - Passing thumbnail: ${course.thumbnailURL || 'EMPTY'}`);
    });
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recent.map((c) => (
          <CourseCard
            key={c._id}
            id={c._id}
            title={c.title}
            description={c.description}
            thumbnail={c.thumbnailURL || ''}
            price={c.price}
            duration={`${c.videos?.length || 0} lessons`}
            students={0}
            rating={4.8}
            instructor={'YT Academy'}
          />
        ))}
      </div>
    );
  }, [recent, loading]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Master
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> YouTube</span>
              <br />Success
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-red-100 max-w-3xl mx-auto leading-relaxed">
              Transform your passion into profit with our comprehensive video courses. 
              Learn from creators who've built million-subscriber channels.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/register"
                className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-red-50 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center space-x-2"
              >
                <span>Start Learning Today</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/courses"
                className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-red-600 transition-all duration-300 transform hover:scale-105"
              >
                Browse Courses
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <div className="text-red-200">Students Enrolled</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">50+</div>
                <div className="text-red-200">Hours of Content</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">4.9★</div>
                <div className="text-red-200">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Featured Courses
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our most popular courses, designed to accelerate your YouTube journey
            </p>
          </div>
          {featuredGrid}
          <div className="text-center mt-12">
            <Link
              to="/courses"
              className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span>View All Courses</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Why Choose YT Academy?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're not just another course platform. We're your partner in YouTube success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center"
              >
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from creators who transformed their channels with our courses
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-red-50 to-pink-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-bold text-gray-800">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your YouTube Channel?
          </h2>
          <p className="text-xl mb-8 text-red-100">
            Join thousands of creators who've already accelerated their growth with our proven strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-red-50 transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Get Started Now
            </Link>
            <Link
              to="/courses"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-red-600 transition-all duration-300 transform hover:scale-105"
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