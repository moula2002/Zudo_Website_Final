import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'Thank you! Your message has been sent successfully.' });
        setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' });
      } else {
        setStatus({ type: 'error', message: data.message || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to connect to server. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 md:py-20 min-h-[75vh]">
      <div className="text-center mb-16 animate-[fadeIn_0.5s_ease-out]">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">Get in <span className="text-emerald-600">Touch</span></h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl mx-auto">
          Have a question about our products, an order, or just want to say hi? We'd love to hear from you.
        </p>
      </div>

      <div className="max-w-6xl mx-auto bg-white dark:bg-[#121212] rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row border border-gray-100 dark:border-white/5 animate-[fadeIn_0.7s_ease-out]">
        
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
                    Bharath nagar, 2nd stage,<br />
                    Magadi main road, Bangaluru, 560091
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
                    snbtrading.co.2024@gmail.com
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
          {status.type === 'success' ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-[fadeIn_0.5s_ease-out]">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Message Sent!</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                {status.message}
              </p>
              <button 
                onClick={() => setStatus({ type: '', message: '' })}
                className="text-emerald-600 font-bold hover:underline mt-4"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-800 dark:text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                  <input 
                    type="text" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-800 dark:text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-800 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-800 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  required
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-800 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message</label>
                <textarea 
                  rows="4" 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  required
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-800 dark:text-white placeholder-gray-400 resize-none"
                ></textarea>
              </div>

              {status.type === 'error' && (
                <p className="text-red-500 text-sm font-bold animate-[shake_0.5s_ease-in-out]">{status.message}</p>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 mt-2"
              >
                {loading ? (
                  <>Sending Message <Loader2 size={18} className="animate-spin" /></>
                ) : (
                  <>Send Message <Send size={18} /></>
                )}
              </button>
            </form>
          )}
        </div>
        
      </div>

      {/* Map Section */}
      <div className="max-w-6xl mx-auto mt-16 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 h-[400px] md:h-[500px] animate-[fadeIn_0.9s_ease-out] relative">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.32288052188!2d77.4768393750731!3d12.982015087304198!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae3d849842a209%3A0x8085b30646014e7a!2sBharath%20Nagar%202nd%20Stage%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1715160000000!5m2!1sen!2sin" 
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
