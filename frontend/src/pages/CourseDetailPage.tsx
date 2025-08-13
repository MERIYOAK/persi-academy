import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Users, Star, Play, CheckCircle, Award, Download, BookOpen } from 'lucide-react';

// Mock course data
const courseData = {
  '1': {
    id: '1',
    title: 'YouTube Monetization Masterclass',
    description: 'Transform your YouTube channel into a profitable business with proven monetization strategies. This comprehensive course covers everything from AdSense optimization to sponsorship deals, merchandise sales, and building multiple income streams.',
    thumbnail: 'https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    price: 97,
    originalPrice: 197,
    duration: '8.5 hours',
    students: 1247,
    rating: 4.9,
    instructor: 'Alex Johnson',
    instructorAvatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    totalLessons: 32,
    level: 'Intermediate',
    language: 'English',
    lastUpdated: 'March 2024',
    whatYouWillLearn: [
      'Set up and optimize YouTube AdSense for maximum revenue',
      'Negotiate and secure profitable sponsorship deals',
      'Create and sell your own merchandise effectively',
      'Build multiple passive income streams from your channel',
      'Understand YouTube analytics and revenue optimization',
      'Scale your earnings beyond traditional monetization methods'
    ],
    curriculum: [
      {
        section: 'Getting Started with Monetization',
        lessons: [
          { title: 'Understanding YouTube\'s Monetization Requirements', duration: '15:30', preview: true },
          { title: 'Setting Up Your AdSense Account', duration: '22:45', preview: false },
          { title: 'Channel Optimization for Higher CPM', duration: '18:20', preview: false },
        ]
      },
      {
        section: 'Advanced Revenue Strategies',
        lessons: [
          { title: 'Sponsorship Deal Negotiation', duration: '28:15', preview: true },
          { title: 'Creating Profitable Merchandise', duration: '25:30', preview: false },
          { title: 'Building Your Email List', duration: '20:10', preview: false },
        ]
      },
      {
        section: 'Scaling Your Income',
        lessons: [
          { title: 'Diversifying Revenue Streams', duration: '32:45', preview: false },
          { title: 'Passive Income Opportunities', duration: '24:20', preview: false },
          { title: 'Long-term Growth Strategies', duration: '19:40', preview: false },
        ]
      }
    ]
  }
};

const relatedCourses = [
  {
    id: '2',
    title: 'Content Strategy for YouTube Success',
    thumbnail: 'https://images.pexels.com/photos/4065184/pexels-photo-4065184.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    price: 67,
    rating: 4.8
  },
  {
    id: '3',
    title: 'YouTube SEO & Algorithm Secrets',
    thumbnail: 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    price: 87,
    rating: 4.9
  }
];

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const course = courseData[id as keyof typeof courseData];

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  const handlePurchase = () => {
    // Simulate Stripe checkout redirect
    window.location.href = '/checkout/success';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {course.level}
                </span>
                <span className="text-red-200">•</span>
                <span className="text-red-200">{course.language}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {course.title}
              </h1>
              
              <p className="text-xl text-red-100 mb-8 leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">{course.rating}</span>
                  <span className="text-red-200">({course.students} students)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-red-200" />
                  <span>{course.duration} total</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-red-200" />
                  <span>{course.totalLessons} lessons</span>
                </div>
              </div>
              
              {/* Instructor */}
              <div className="flex items-center space-x-4">
                <img
                  src={course.instructorAvatar}
                  alt={course.instructor}
                  className="w-16 h-16 rounded-full object-cover border-3 border-white"
                />
                <div>
                  <p className="text-red-200 text-sm">Created by</p>
                  <p className="font-semibold text-lg">{course.instructor}</p>
                  <p className="text-red-200 text-sm">Updated {course.lastUpdated}</p>
                </div>
              </div>
            </div>
            
            {/* Purchase Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-2xl p-8 sticky top-8">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-6"
                />
                
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <span className="text-4xl font-bold text-gray-800">${course.price}</span>
                    <span className="text-xl text-gray-500 line-through">${course.originalPrice}</span>
                  </div>
                  <p className="text-green-600 font-semibold">Save ${course.originalPrice - course.price}!</p>
                </div>
                
                <button
                  onClick={handlePurchase}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl mb-4"
                >
                  Enroll Now
                </button>
                
                <p className="text-center text-gray-600 text-sm mb-6">
                  30-day money-back guarantee
                </p>
                
                {/* Course Features */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span>{course.duration} on-demand video</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="h-4 w-4 text-red-600" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Download className="h-4 w-4 text-red-600" />
                    <span>Downloadable resources</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-red-600" />
                    <span>Lifetime access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* What You'll Learn */}
            <section>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">What You'll Learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.whatYouWillLearn.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Course Curriculum */}
            <section>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Course Curriculum</h2>
              <div className="space-y-6">
                {course.curriculum.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800">{section.section}</h3>
                      <p className="text-sm text-gray-600">{section.lessons.length} lessons</p>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {section.lessons.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {lesson.preview ? (
                                <Play className="h-5 w-5 text-red-600" />
                              ) : (
                                <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">{lesson.title}</h4>
                              {lesson.preview && (
                                <span className="text-xs text-red-600 font-semibold">Preview Available</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{lesson.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Related Courses */}
            <section className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Related Courses</h3>
              <div className="space-y-6">
                {relatedCourses.map((relatedCourse) => (
                  <Link
                    key={relatedCourse.id}
                    to={`/course/${relatedCourse.id}`}
                    className="block group"
                  >
                    <div className="flex space-x-4">
                      <img
                        src={relatedCourse.thumbnail}
                        alt={relatedCourse.title}
                        className="w-20 h-20 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 group-hover:text-red-600 transition-colors duration-200 line-clamp-2">
                          {relatedCourse.title}
                        </h4>
                        <div className="flex items-center space-x-1 mt-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{relatedCourse.rating}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-800 mt-1">
                          ${relatedCourse.price}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;