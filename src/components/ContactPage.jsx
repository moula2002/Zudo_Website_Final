import React from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-6 py-12 md:py-20 min-h-[75vh]">
      <div className="text-center mb-16 animate-[fadeIn_0.5s_ease-out]">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Get in <span className="text-emerald-600">Touch</span></h1>
        <p className="text-gray-500 font-medium max-w-xl mx-auto">
          Have a question about our products, an order, or just want to say hi? We'd love to hear from you.
        </p>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row border border-gray-100 animate-[fadeIn_0.7s_ease-out]">
        
        {/* Contact Information (Left) */}
        <div className="w-full md:w-5/12 bg-emerald-900 p-10 md:p-14 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-[60px] opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-800 rounded-full blur-[40px] opacity-60 translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-10 text-white">Contact Information</h3>
            
            <div className="space-y-8">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-emerald-800/80 border border-emerald-700 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <MapPin size={22} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1 text-white">Our Location</h4>
                  <p className="text-emerald-100/80 text-sm leading-relaxed font-medium">
                    123 Grocery Lane, Fresh Market District<br />
                    Mumbai, Maharashtra 400001
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-emerald-800/80 border border-emerald-700 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Phone size={22} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1 text-white">Phone Number</h4>
                  <p className="text-emerald-100/80 text-sm font-medium">
                    +91 98765 43210<br />
                    Toll-Free: 1800-123-456
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-emerald-800/80 border border-emerald-700 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Mail size={22} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1 text-white">Email Address</h4>
                  <p className="text-emerald-100/80 text-sm font-medium">
                    support@zudo.com<br />
                    sales@zudo.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-emerald-800/80 border border-emerald-700 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Clock size={22} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1 text-white">Working Hours</h4>
                  <p className="text-emerald-100/80 text-sm font-medium">
                    Mon - Sat: 9:00 AM - 8:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form (Right) */}
        <div className="w-full md:w-7/12 p-10 md:p-14">
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Message sent successfully!"); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                <input 
                  type="text" 
                  placeholder="John"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-800 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                <input 
                  type="text" 
                  placeholder="Doe"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" 
                placeholder="john@example.com"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
              <input 
                type="text" 
                placeholder="How can we help?"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
              <textarea 
                rows="4" 
                placeholder="Write your message here..."
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-800 placeholder-gray-400 resize-none"
              ></textarea>
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 mt-2">
              Send Message <Send size={18} />
            </button>
          </form>
        </div>
        
      </div>

      {/* Map Section */}
      <div className="max-w-6xl mx-auto mt-16 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 h-[400px] md:h-[500px] animate-[fadeIn_0.9s_ease-out] relative">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.8286940864353!2d77.48971487507664!3d12.982806887333682!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae3c5f6e80b4d1%3A0x6b637042a926bd00!2sBharath%20Nagar%202nd%20Stage%2C%20Byadarahalli%2C%20Bengaluru%2C%20Karnataka%20560091!5e0!3m2!1sen!2sin!4v1709214000000!5m2!1sen!2sin" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen="" 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Zudo Store Location"
          className="grayscale-[0.2] contrast-[1.1] hover:grayscale-0 transition-all duration-500"
        ></iframe>
      </div>
    </div>
  );
}
