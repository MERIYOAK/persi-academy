import React from 'react';
import { Award, Users, Target, Heart } from 'lucide-react';

const AboutPage = () => {
  const stats = [
    { icon: Users, value: '10,000+', label: 'Students Enrolled' },
    { icon: Award, value: '50+', label: 'Expert Instructors' },
    { icon: Target, value: '95%', label: 'Success Rate' },
    { icon: Heart, value: '4.9/5', label: 'Student Rating' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About YT Academy
            </h1>
            <p className="text-xl text-red-100 max-w-3xl mx-auto">
              We're on a mission to help creators turn their passion into profit through 
              comprehensive YouTube education and proven monetization strategies.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <stat.icon className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-gray-800 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                At YT Academy, we believe that everyone has the potential to create 
                meaningful content and build a sustainable income from their passion. 
                Our comprehensive courses are designed to take you from beginner to 
                successful content creator.
              </p>
              <p className="text-lg text-gray-600">
                We combine cutting-edge strategies with real-world experience to 
                provide you with the tools, knowledge, and support you need to 
                thrive in the competitive world of YouTube content creation.
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Why Choose Us?</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Expert-led courses from successful YouTubers
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Up-to-date strategies for the latest algorithm changes
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Practical, actionable content you can implement immediately
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Ongoing support and community access
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our team consists of successful content creators, marketing experts, 
              and industry professionals who are passionate about helping others succeed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <img
                src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
                alt="Sarah Johnson"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Sarah Johnson
              </h3>
              <p className="text-red-600 font-medium mb-2">Founder & CEO</p>
              <p className="text-gray-600">
                Former YouTube Partner with 2M+ subscribers, helping creators 
                build sustainable businesses.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <img
                src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
                alt="Mike Chen"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Mike Chen
              </h3>
              <p className="text-red-600 font-medium mb-2">Head of Education</p>
              <p className="text-gray-600">
                Digital marketing expert with 10+ years experience in 
                content strategy and audience growth.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <img
                src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
                alt="Emily Rodriguez"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Emily Rodriguez
              </h3>
              <p className="text-red-600 font-medium mb-2">Community Manager</p>
              <p className="text-gray-600">
                Building and nurturing our community of creators, ensuring 
                everyone gets the support they need.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 