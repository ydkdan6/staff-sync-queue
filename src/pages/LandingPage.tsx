import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, CheckCircle, MessageSquare, Mail, Phone, MapPin, Menu, X } from 'lucide-react';

const QueueSystemLanding: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'about', 'features', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const navItems = [
    { id: 'hero', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'features', label: 'Features' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                QueueFlow
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeSection === item.id
                        ? 'text-green-400 bg-green-900/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 transform hover:scale-105">
                <Link to='/auth'>Access System</Link>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white p-2"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/40 backdrop-blur-md border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md text-base font-medium w-full text-left transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 pb-2 border-t border-white/10 space-y-2">
                <button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 transform hover:scale-105">
                  <Link to='/auth'>Access System</Link>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-16 min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 to-teal-900/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up mt-20">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Kaduna Polytechnic <br/>
              <span className="bg-gradient-to-r from-green-400 via-teal-400 to-green-400 bg-clip-text text-transparent animate-gradient-x">
                {' '}Queue System
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform how students and staff interact with our intelligent queue management system. 
              No more waiting in uncertainty – experience seamless, organized, and efficient service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25">
                <Link to='/auth'>Get Started</Link>
              </button>
            </div>
          </div>
          
          {/* Floating Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Student Management", desc: "Organize queues effortlessly" },
              { icon: Clock, title: "Real-time Updates", desc: "Live queue status & notifications" },
              { icon: CheckCircle, title: "Smart Analytics", desc: "Insights to optimize service" }
            ].map((item, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl">
                <item.icon className="w-12 h-12 text-green-400 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              About QueueFlow
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We revolutionize the traditional queue experience by bringing transparency, 
              efficiency, and intelligence to staff-student interactions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 rounded-xl p-8 border border-green-500/30">
                <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                <p className="text-gray-300 leading-relaxed">
                  To eliminate the frustration of uncertain waiting times and create a seamless, 
                  digital-first experience that respects everyone's time while improving service quality.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-teal-600/20 to-green-600/20 rounded-xl p-8 border border-teal-500/30">
                <h3 className="text-2xl font-bold text-white mb-4">Why Choose Us?</h3>
                <p className="text-gray-300 leading-relaxed">
                  Built specifically for educational institutions, our system understands the unique 
                  challenges of managing high-volume student services with limited staff resources.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div className="bg-white/10 rounded-lg p-6">
                    <div className="text-3xl font-bold text-green-400 mb-2">95%</div>
                    <div className="text-gray-300">Reduction in Wait Time</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-6">
                    <div className="text-3xl font-bold text-teal-400 mb-2">24/7</div>
                    <div className="text-gray-300">System Availability</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-6">
                    <div className="text-3xl font-bold text-green-400 mb-2">1000+</div>
                    <div className="text-gray-300">Students Served Daily</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-6">
                    <div className="text-3xl font-bold text-teal-400 mb-2">99%</div>
                    <div className="text-gray-300">User Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What Our System Does
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              A comprehensive queue management solution designed to transform your service delivery
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Smart Queue Management",
                description: "Automatically organize students based on service type, priority, and availability. Our AI-driven system ensures optimal flow and minimal wait times."
              },
              {
                icon: Clock,
                title: "Real-Time Tracking",
                description: "Students can see their position, estimated wait time, and receive notifications when it's their turn. Staff get live dashboards for better resource allocation."
              },
              {
                icon: MessageSquare,
                title: "Communication Hub",
                description: "Built-in messaging system allows staff to communicate with students, send updates, and handle pre-visit inquiries efficiently."
              },
              {
                icon: CheckCircle,
                title: "Service Categories",
                description: "Organize different types of services (academic advising, technical support, financial aid) with dedicated queues and specialized staff assignments."
              },
              {
                icon: Users,
                title: "Staff Dashboard",
                description: "Comprehensive admin panel for staff to manage queues, track performance metrics, and optimize service delivery in real-time."
              },
              {
                icon: Clock,
                title: "Analytics & Insights",
                description: "Detailed reporting on wait times, service efficiency, peak hours, and student satisfaction to continuously improve your operations."
              }
            ].map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/20 h-full">
                  <div className="bg-gradient-to-r from-green-600 to-teal-600 w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Ready to transform your queue management? Let's discuss how QueueFlow can work for your institution.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">Send us a message</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:bg-white/20 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:bg-white/20 transition-all"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:bg-white/20 transition-all"
                />
                <input
                  type="text"
                  placeholder="Institution Name"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:bg-white/20 transition-all"
                />
                <textarea
                  placeholder="Tell us about your queue management needs..."
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:bg-white/20 transition-all resize-none"
                ></textarea>
                <button className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                  Send Message
                </button>
              </div>
            </div>

            
            {/* Contact Info */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent mb-4">
              QueueFlow
            </h3>
            <p className="text-gray-400 mb-4">
              Transforming queue management for educational institutions worldwide.
            </p>
            <p className="text-gray-500 text-sm">
              © 2025 Kaduna Polytechnic. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QueueSystemLanding;